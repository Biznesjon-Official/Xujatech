/**
 * Chek modal oynasi
 * Telefondan kelgan chekni ochish, to'lov qilish va print qilish
 */

import React, { useState, useEffect } from 'react';
import { X, Printer, CreditCard, DollarSign, Wallet, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../i18n';
import { convertToLanguage } from '../../utils/transliterate';

interface ReceiptItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

interface Receipt {
  _id: string;
  cashierName: string;
  items: ReceiptItem[];
  total: number;
  createdAt: string;
  status: string;
  customerName?: string;
}

interface Props {
  receiptId: string;
  onClose: () => void;
  onComplete: () => void;
}

const ReceiptModal: React.FC<Props> = ({ receiptId, onClose, onComplete }) => {
  const { t, language } = useLanguage();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');

  // Chek ma'lumotlarini yuklash
  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/receipts/saved/${receiptId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReceipt(data.data);
        } else {
          toast.error('Chek topilmadi');
          onClose();
        }
      } catch (error) {
        console.error('Chek yuklash xatosi:', error);
        toast.error('Xatolik yuz berdi');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId, onClose]);

  // Chekni claim qilish (noutbukka biriktirish)
  useEffect(() => {
    const claimReceipt = async () => {
      try {
        const noutbukId = localStorage.getItem('noutbukId') || `LAPTOP-${Date.now()}`;
        localStorage.setItem('noutbukId', noutbukId);

        const token = localStorage.getItem('accessToken');
        await fetch(`/api/receipts/saved/${receiptId}/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ noutbukId }),
        });
      } catch (error) {
        console.error('Claim xatosi:', error);
      }
    };

    if (receiptId) {
      claimReceipt();
    }
  }, [receiptId]);

  // To'lov qilish
  const handlePayment = async () => {
    if (!receipt) return;

    setProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Chek statusini yangilash
      const response = await fetch(`/api/receipts/saved/${receiptId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'completed',
        }),
      });

      if (response.ok) {
        toast.success('To\'lov muvaffaqiyatli amalga oshirildi!');
        
        // Print qilish
        await handlePrint();
        
        // Modal yopish
        onComplete();
        onClose();
      } else {
        toast.error('To\'lov xatosi');
      }
    } catch (error) {
      console.error('To\'lov xatosi:', error);
      toast.error('Xatolik yuz berdi');
    } finally {
      setProcessing(false);
    }
  };

  // Print qilish
  const handlePrint = async () => {
    if (!receipt) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      // Print vaqtini belgilash
      await fetch(`/api/receipts/saved/${receiptId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          printedAt: new Date().toISOString(),
        }),
      });

      // Print oynasini ochish
      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.write(generateReceiptHTML(receipt));
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (error) {
      console.error('Print xatosi:', error);
    }
  };

  // Chek HTML generatsiya
  const generateReceiptHTML = (receipt: Receipt) => {
    const date = new Date(receipt.createdAt).toLocaleString('uz-UZ');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Chek</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            width: 80mm; 
            padding: 5mm;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .info { margin: 10px 0; font-size: 11px; }
          .info-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
          .item { margin: 8px 0; }
          .item-name { font-weight: bold; }
          .item-details { display: flex; justify-content: space-between; font-size: 11px; color: #333; }
          .totals { margin: 10px 0; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total-row.main { font-size: 16px; font-weight: bold; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; font-size: 11px; }
          @media print {
            body { width: 80mm; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SOTUV CHEKI</h1>
          <p>XUJATECH POS</p>
        </div>
        
        <div class="info">
          <div class="info-row"><span>Sana:</span><span>${date}</span></div>
          <div class="info-row"><span>Kassir:</span><span>${receipt.cashierName}</span></div>
          ${receipt.customerName ? `<div class="info-row"><span>Mijoz:</span><span>${receipt.customerName}</span></div>` : ''}
        </div>
        
        <div class="items">
          ${receipt.items.map((item, idx) => `
            <div class="item">
              <div class="item-name">${idx + 1}. ${item.name}</div>
              <div class="item-details">
                <span>${item.quantity} x ${item.price.toLocaleString()}</span>
                <span>${(item.quantity * item.price).toLocaleString()} so'm</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-row"><span>Mahsulotlar:</span><span>${receipt.items.length} ta</span></div>
          <div class="total-row main"><span>JAMI:</span><span>${receipt.total.toLocaleString()} so'm</span></div>
        </div>
        
        <div class="footer">
          <p>Xaridingiz uchun rahmat!</p>
          <p>Yana keling!</p>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() { window.close(); }, 1000);
          }
        </script>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const received = parseFloat(receivedAmount) || 0;
  const change = received - receipt.total;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Chek #{receipt._id.slice(-6)}</h2>
            <p className="text-sm text-white/80">{receipt.cashierName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Vaqt</p>
                <p className="font-medium">
                  {new Date(receipt.createdAt).toLocaleString('uz-UZ')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Mahsulotlar</p>
                <p className="font-medium">{receipt.items.length} ta</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-6">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {idx + 1}. {convertToLanguage(item.name, language)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.quantity} x {item.price.toLocaleString()} so'm
                  </p>
                </div>
                <p className="font-bold text-gray-900">
                  {(item.quantity * item.price).toLocaleString()} so'm
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-emerald-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-700">JAMI:</span>
              <span className="text-3xl font-bold text-emerald-600">
                {receipt.total.toLocaleString()} so'm
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              To'lov turi
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-6 h-6" />
                <span className="text-sm font-medium">Naqd</span>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">Karta</span>
              </button>
              <button
                onClick={() => setPaymentMethod('mixed')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'mixed'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Wallet className="w-6 h-6" />
                <span className="text-sm font-medium">Aralash</span>
              </button>
            </div>
          </div>

          {/* Cash input */}
          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qabul qilingan summa
              </label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {received > 0 && change >= 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Qaytim:</span>
                    <span className="font-bold text-blue-600">
                      {change.toLocaleString()} so'm
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => handlePrint()}
            className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button
            onClick={handlePayment}
            disabled={processing || (paymentMethod === 'cash' && received < receipt.total)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Kutilmoqda...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                To'lov qilish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
