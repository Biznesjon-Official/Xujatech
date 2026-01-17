import React, { useState, useEffect } from 'react';
import { Printer, X, Settings } from 'lucide-react';

// Chek ma'lumotlari interfeysi
interface ReceiptData {
  saleNumber: string;
  date: string;
  cashier: string;
  customer?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  payments: Array<{
    method: string;
    amount: number;
  }>;
  change?: number;
}

// Chek sozlamalari interfeysi
interface ReceiptSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showBarcode: boolean;
  paperWidth: number;
}

interface ReceiptPreviewProps {
  data: ReceiptData;
  onClose: () => void;
  onPrint: () => void;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ data, onClose, onPrint }) => {
  const [settings, setSettings] = useState<ReceiptSettings>({
    storeName: 'XUJATECh Store',
    storeAddress: '',
    storePhone: '',
    headerText: 'Home Appliances',
    footerText: 'Thank you for your business!',
    showLogo: true,
    showBarcode: true,
    paperWidth: 80
  });

  // Sozlamalarni yuklash
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/receipt', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Failed to load receipt settings:', error);
    }
  };

  // To'lov usuli nomini olish
  const getPaymentMethodName = (method: string): string => {
    const methods: Record<string, string> = {
      cash: 'Naqd',
      card: 'Karta',
      click: 'Click',
      payme: 'Payme',
      debt: 'Qarz'
    };
    return methods[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chek Ko'rinishi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div 
            className="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-sm"
            style={{ width: settings.paperWidth === 58 ? '220px' : '300px', margin: '0 auto' }}
          >
            {/* Store Header */}
            <div className="text-center mb-4">
              {settings.showLogo && (
                <div className="text-2xl font-bold mb-1">🏪</div>
              )}
              <div className="font-bold text-lg">{settings.storeName}</div>
              {settings.headerText && (
                <div className="text-xs text-gray-600">{settings.headerText}</div>
              )}
              {settings.storeAddress && (
                <div className="text-xs">{settings.storeAddress}</div>
              )}
              {settings.storePhone && (
                <div className="text-xs">Tel: {settings.storePhone}</div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Sale Info */}
            <div className="text-xs mb-2">
              <div>Chek: #{data.saleNumber}</div>
              <div>Sana: {data.date}</div>
              <div>Kassir: {data.cashier}</div>
              {data.customer && <div>Mijoz: {data.customer}</div>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Items */}
            <div className="mb-2">
              {data.items.map((item, index) => (
                <div key={index} className="mb-1">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="flex justify-between text-xs">
                    <span>{item.quantity} x {item.price.toLocaleString()}</span>
                    <span>{item.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Totals */}
            <div className="text-xs">
              <div className="flex justify-between">
                <span>Jami:</span>
                <span>{data.subtotal.toLocaleString()} UZS</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Chegirma:</span>
                  <span>-{data.discount.toLocaleString()} UZS</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-1">
                <span>JAMI:</span>
                <span>{data.total.toLocaleString()} UZS</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Payments */}
            <div className="text-xs mb-2">
              <div className="font-medium mb-1">To'lov:</div>
              {data.payments.map((payment, index) => (
                <div key={index} className="flex justify-between">
                  <span>{getPaymentMethodName(payment.method)}:</span>
                  <span>{payment.amount.toLocaleString()} UZS</span>
                </div>
              ))}
              {data.change && data.change > 0 && (
                <div className="flex justify-between font-medium mt-1">
                  <span>Qaytim:</span>
                  <span>{data.change.toLocaleString()} UZS</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Footer */}
            <div className="text-center text-xs">
              {settings.showBarcode && (
                <div className="my-2 font-mono tracking-widest">
                  ||||| {data.saleNumber} |||||
                </div>
              )}
              {settings.footerText && (
                <div className="text-gray-600">{settings.footerText}</div>
              )}
              <div className="mt-2 text-gray-400">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Yopish
          </button>
          <button
            onClick={onPrint}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Chop etish
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;
