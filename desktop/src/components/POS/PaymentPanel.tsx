import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { clearCart, setSaleLoading, setSaleSuccess, setSaleError } from '../../store/slices/posSlice';
import { CreditCard, Banknote, Smartphone, UserCheck, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../i18n';
import { convertToLanguage } from '../../utils/transliterate';

type PaymentMethod = 'cash' | 'card' | 'click' | 'payme' | 'debt';

interface Payment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

const PaymentPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { cart, customer, totalAmount, loading } = useSelector((state: RootState) => state.pos);
  const { user } = useSelector((state: RootState) => state.auth);
  const { t, language } = useLanguage();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [reference, setReference] = useState('');

  const paymentMethods = [
    { id: 'cash' as PaymentMethod, label: t('pos.cash'), icon: Banknote, color: 'green' },
    { id: 'card' as PaymentMethod, label: t('pos.card'), icon: CreditCard, color: 'blue' },
    { id: 'click' as PaymentMethod, label: 'Click', icon: Smartphone, color: 'purple' },
    { id: 'payme' as PaymentMethod, label: 'Payme', icon: Smartphone, color: 'indigo' },
    { id: 'debt' as PaymentMethod, label: t('pos.debt'), icon: UserCheck, color: 'orange' },
  ];

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalAmount - totalPaid;
  const change = totalPaid > totalAmount ? totalPaid - totalAmount : 0;

  const addPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error(t('common.error'));
      return;
    }

    if (selectedMethod === 'debt' && !customer) {
      toast.error(t('pos.selectCustomer'));
      return;
    }

    const newPayment: Payment = {
      method: selectedMethod,
      amount,
      reference: reference.trim() || undefined
    };

    setPayments([...payments, newPayment]);
    setPaymentAmount('');
    setReference('');
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error(t('pos.emptyCart'));
      return;
    }

    if (remainingAmount > 0.01) {
      toast.error(t('pos.paymentIncomplete'));
      return;
    }

    dispatch(setSaleLoading(true));

    try {
      const saleData = {
        customerId: customer?.id || null,
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount
        })),
        payments: payments,
        discountAmount: 0,
        notes: ''
      };

      // Generate sale number
      const saleNumber = `SALE${Date.now()}`;
      const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Save to local database
      if (window.electronAPI) {
        const operations = [];

        // Insert sale
        operations.push({
          query: `INSERT INTO sales (id, sale_number, customer_id, cashier_id, subtotal, total_amount, payment_status) 
                  VALUES (?, ?, ?, ?, ?, ?, 'completed')`,
          params: [saleId, saleNumber, customer?.id || null, user?.id, totalAmount, totalAmount]
        });

        // Insert sale items
        cart.forEach(item => {
          operations.push({
            query: `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount_amount, total_amount, cost_price) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params: [
              `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              saleId,
              item.productId,
              item.quantity,
              item.unitPrice,
              item.discountAmount,
              item.totalPrice,
              item.unitPrice * 0.7 // Assume 30% margin for now
            ]
          });

          // Update stock
          operations.push({
            query: `UPDATE products SET current_stock = current_stock - ? WHERE id = ?`,
            params: [item.quantity, item.productId]
          });
        });

        // Insert payments
        payments.forEach(payment => {
          operations.push({
            query: `INSERT INTO payments (id, sale_id, customer_id, payment_method, amount, reference_number, cashier_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
            params: [
              `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              saleId,
              customer?.id || null,
              payment.method,
              payment.amount,
              payment.reference || null,
              user?.id
            ]
          });
        });

        await window.electronAPI.dbTransaction(operations);

        // Print receipt
        const receiptData = {
          saleNumber,
          date: new Date().toLocaleString(),
          cashier: convertToLanguage(user?.fullName || 'Unknown', language),
          customer: customer?.fullName ? convertToLanguage(customer.fullName, language) : undefined,
          items: cart.map(item => ({
            name: convertToLanguage(item.name, language),
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.totalPrice
          })),
          subtotal: totalAmount,
          discount: 0,
          total: totalAmount,
          payments: payments.map(p => ({
            method: p.method,
            amount: p.amount
          })),
          change: change > 0 ? change : undefined
        };

        await window.electronAPI.printReceipt(receiptData);

        dispatch(setSaleSuccess({ saleId, saleNumber, totalAmount }));
        dispatch(clearCart());
        setPayments([]);
        toast.success(t('pos.saleCompleted'));
      }
    } catch (error: any) {
      console.error('Sale error:', error);
      dispatch(setSaleError(error.message));
      toast.error(t('common.error'));
    }
  };

  const quickPayment = (amount: number) => {
    setSelectedMethod('cash');
    setPaymentAmount(amount.toString());
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>{t('pos.addItemsToCart')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Methods */}
      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              disabled={method.id === 'debt' && !customer}
              className={`p-3 rounded-md border-2 transition-colors flex items-center justify-center ${
                isSelected
                  ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700`
                  : 'border-gray-200 hover:border-gray-300'
              } ${method.id === 'debt' && !customer ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">{method.label}</span>
            </button>
          );
        })}
      </div>

      {/* Payment Input */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder={t('common.amount')}
            className="form-input flex-1"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />
          <button onClick={addPayment} className="btn-primary">
            {t('common.add')}
          </button>
        </div>

        {(selectedMethod === 'card' || selectedMethod === 'click' || selectedMethod === 'payme') && (
          <input
            type="text"
            placeholder={t('pos.referenceNumber')}
            className="form-input"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        )}
      </div>

      {/* Quick Payment Buttons */}
      {selectedMethod === 'cash' && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => quickPayment(remainingAmount)}
            className="btn-secondary text-sm"
          >
            {t('pos.exact')}
          </button>
          <button
            onClick={() => quickPayment(Math.ceil(remainingAmount / 1000) * 1000)}
            className="btn-secondary text-sm"
          >
            {t('pos.round')}
          </button>
          <button
            onClick={() => quickPayment(remainingAmount + 10000)}
            className="btn-secondary text-sm"
          >
            +10K
          </button>
        </div>
      )}

      {/* Payment Summary */}
      {payments.length > 0 && (
        <div className="border rounded-md p-3 bg-gray-50">
          <h4 className="font-medium mb-2">{t('pos.payments')}:</h4>
          {payments.map((payment, index) => (
            <div key={index} className="flex justify-between items-center text-sm mb-1">
              <span className="capitalize">
                {payment.method}: {payment.amount.toLocaleString()} {t('common.sum')}
                {payment.reference && ` (${payment.reference})`}
              </span>
              <button
                onClick={() => removePayment(index)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment Status */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>{t('common.total')}:</span>
          <span className="font-medium">{totalAmount.toLocaleString()} {t('common.sum')}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('pos.totalPaid')}:</span>
          <span className="font-medium">{totalPaid.toLocaleString()} {t('common.sum')}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('pos.remaining')}:</span>
          <span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {remainingAmount.toLocaleString()} {t('common.sum')}
          </span>
        </div>
        {change > 0 && (
          <div className="flex justify-between">
            <span>{t('pos.change')}:</span>
            <span className="font-medium text-blue-600">{change.toLocaleString()} {t('common.sum')}</span>
          </div>
        )}
      </div>

      {/* Complete Sale Button */}
      <button
        onClick={completeSale}
        disabled={remainingAmount > 0.01 || loading}
        className={`w-full py-3 rounded-md font-medium transition-colors ${
          remainingAmount > 0.01 || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="spinner mr-2"></div>
            {t('pos.processing')}...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <Printer className="w-4 h-4 mr-2" />
            {t('pos.completeSale')}
          </div>
        )}
      </button>
    </div>
  );
};

export default PaymentPanel;
