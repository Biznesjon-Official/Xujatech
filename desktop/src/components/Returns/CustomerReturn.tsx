import React, { useState } from 'react';
import { Search, RotateCcw, X, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../i18n';
import { convertToLanguage } from '../../utils/transliterate';

// Sotuv interfeysi
interface Sale {
  id: string;
  sale_number: string;
  total_amount: number;
  customer_name: string;
  sale_date: string;
  items: SaleItem[];
}

// Sotuv elementi interfeysi
interface SaleItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

// Qaytarish elementi interfeysi
interface ReturnItem {
  saleItemId: string;
  productName: string;
  maxQuantity: number;
  quantity: number;
  reason: string;
  unitPrice: number;
}

const CustomerReturn: React.FC = () => {
  const { t, language } = useLanguage();
  // State'lar
  const [saleNumber, setSaleNumber] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Sotuvni qidirish
  const searchSale = async () => {
    if (!saleNumber.trim()) {
      toast.error(t('returns.enterSaleNumber'));
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/sales/search?saleNumber=${saleNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      const data = await response.json();

      if (data.success && data.data) {
        setSale(data.data);
        setReturnItems([]);
        toast.success(t('returns.saleFound'));
      } else {
        toast.error(t('returns.saleNotFound'));
        setSale(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('returns.searchError'));
    } finally {
      setSearching(false);
    }
  };

  // Elementni qaytarish ro'yxatiga qo'shish
  const addToReturn = (item: SaleItem) => {
    const existing = returnItems.find(ri => ri.saleItemId === item.id);
    if (existing) {
      toast.error(t('returns.productAlreadyAdded'));
      return;
    }

    setReturnItems([
      ...returnItems,
      {
        saleItemId: item.id,
        productName: convertToLanguage(item.product_name, language),
        maxQuantity: item.quantity,
        quantity: 1,
        reason: '',
        unitPrice: item.unit_price
      }
    ]);
  };

  // Qaytarish miqdorini o'zgartirish
  const updateReturnQuantity = (saleItemId: string, quantity: number) => {
    setReturnItems(returnItems.map(item => {
      if (item.saleItemId === saleItemId) {
        return { ...item, quantity: Math.min(quantity, item.maxQuantity) };
      }
      return item;
    }));
  };

  // Qaytarish sababini o'zgartirish
  const updateReturnReason = (saleItemId: string, reason: string) => {
    setReturnItems(returnItems.map(item => {
      if (item.saleItemId === saleItemId) {
        return { ...item, reason };
      }
      return item;
    }));
  };

  // Elementni ro'yxatdan olib tashlash
  const removeFromReturn = (saleItemId: string) => {
    setReturnItems(returnItems.filter(item => item.saleItemId !== saleItemId));
  };

  // Jami qaytarish summasini hisoblash
  const totalRefund = returnItems.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity),
    0
  );

  // Qaytarishni amalga oshirish
  const processReturn = async () => {
    // Validatsiya
    if (returnItems.length === 0) {
      toast.error(t('returns.selectProducts'));
      return;
    }

    const invalidItems = returnItems.filter(item => !item.reason.trim());
    if (invalidItems.length > 0) {
      toast.error(t('returns.enterReasonForAll'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sales/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          originalSaleId: sale!.id,
          items: returnItems.map(item => ({
            saleItemId: item.saleItemId,
            quantity: item.quantity,
            reason: item.reason
          })),
          refundMethod,
          notes
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${t('returns.returnProcessed')}: ${data.data.returnNumber}`);
        // Reset form
        setSale(null);
        setSaleNumber('');
        setReturnItems([]);
        setNotes('');
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Return error:', error);
      toast.error(t('returns.returnError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <RotateCcw className="w-6 h-6" />
        {t('returns.customerReturn')}
      </h1>

      {/* Sotuv qidirish */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('returns.saleNumber')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={saleNumber}
            onChange={(e) => setSaleNumber(e.target.value)}
            placeholder="SALE1234567890"
            className="form-input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && searchSale()}
          />
          <button
            onClick={searchSale}
            disabled={searching}
            className="btn-primary flex items-center gap-2"
          >
            {searching ? (
              <div className="spinner w-4 h-4"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
            {t('common.search')}
          </button>
        </div>
      </div>

      {/* Sotuv ma'lumotlari */}
      {sale && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">{t('returns.sale')} #{sale.sale_number}</h2>
                <p className="text-sm text-gray-500">
                  {convertToLanguage(sale.customer_name || 'Walk-in', language)} • {new Date(sale.sale_date).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{t('common.total')}</p>
                <p className="font-bold text-lg">{sale.total_amount.toLocaleString()} {t('common.sum')}</p>
              </div>
            </div>
          </div>

          {/* Sotuv elementlari */}
          <div className="p-4">
            <h3 className="font-medium mb-3">{t('returns.soldProducts')}</h3>
            <div className="space-y-2">
              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{convertToLanguage(item.product_name, language)}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} x {item.unit_price.toLocaleString()} {t('common.sum')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium">{item.total_amount.toLocaleString()} {t('common.sum')}</p>
                    <button
                      onClick={() => addToReturn(item)}
                      className="btn-secondary text-sm"
                      disabled={returnItems.some(ri => ri.saleItemId === item.id)}
                    >
                      {t('returns.return')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Qaytarish ro'yxati */}
      {returnItems.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Qaytariladigan Mahsulotlar
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {returnItems.map((item) => (
              <div key={item.saleItemId} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-500">
                      Narx: {item.unitPrice.toLocaleString()} UZS
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromReturn(item.saleItemId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Miqdor (max: {item.maxQuantity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) => updateReturnQuantity(item.saleItemId, parseInt(e.target.value) || 1)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Sabab *</label>
                    <input
                      type="text"
                      value={item.reason}
                      onChange={(e) => updateReturnReason(item.saleItemId, e.target.value)}
                      placeholder="Qaytarish sababi"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-500">Qaytarish summasi: </span>
                  <span className="font-bold text-red-600">
                    {(item.unitPrice * item.quantity).toLocaleString()} UZS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Qaytarish yakunlash */}
      {returnItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qaytarish Usuli
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
                className="form-input"
              >
                <option value="cash">Naqd pul</option>
                <option value="card">Karta</option>
                <option value="credit">Mijoz hisobiga</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Izoh
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Qo'shimcha izoh"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Jami qaytarish summasi</p>
              <p className="text-2xl font-bold text-red-600">
                {totalRefund.toLocaleString()} UZS
              </p>
            </div>
            <button
              onClick={processReturn}
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              {loading ? (
                <div className="spinner w-5 h-5"></div>
              ) : (
                <Check className="w-5 h-5" />
              )}
              Qaytarishni Tasdiqlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReturn;
