/**
 * Responsive POS Layout Component
 * Mobile-first approach with professional UX
 */

import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { convertToLanguage } from '../../utils/transliterate';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  maxStock?: number;
}

interface ResponsivePOSLayoutProps {
  cart: CartItem[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onPriceChange: (itemId: string, price: number) => void;
  onRemove: (itemId: string) => void;
  selectedItemId?: string | null;
}

const ResponsivePOSLayout: React.FC<ResponsivePOSLayoutProps> = ({
  cart,
  onQuantityChange,
  onPriceChange,
  onRemove,
  selectedItemId,
}) => {
  const { t, language } = useLanguage();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="text-lg font-medium">{t('pos.emptyCart')}</p>
        <p className="text-sm mt-1 text-center px-4">Mahsulot qo'shish uchun qidirish yoki skanerlash</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Table Layout */}
      <div className="hidden md:block overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('products.barcode')}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('products.title')}</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('common.quantity')}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('common.price')}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('common.amount')}</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr
                key={item.id}
                className={`transition-colors ${selectedItemId === item.id ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.barcode || '-'}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{convertToLanguage(item.name, language)}</div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={item.quantity}
                    key={`qty-${item.id}-${item.quantity}`}
                    onBlur={(e) => {
                      const qty = parseInt(e.target.value);
                      if (qty > 0) {
                        onQuantityChange(item.id, qty);
                      } else {
                        e.target.value = item.quantity.toString();
                      }
                    }}
                    className="w-16 text-center font-semibold border border-gray-200 rounded-lg py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                    max={item.maxStock || undefined}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    defaultValue={item.unitPrice}
                    key={`price-${item.id}-${item.unitPrice}`}
                    onBlur={(e) => {
                      const price = parseFloat(e.target.value);
                      if (price > 0) {
                        onPriceChange(item.id, price);
                      } else {
                        e.target.value = item.unitPrice.toString();
                      }
                    }}
                    className="w-28 text-right font-semibold border border-gray-200 rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{item.totalPrice.toLocaleString()}</td>
                <td className="px-2">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden overflow-auto p-3 space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className={`mobile-card touch-feedback ${selectedItemId === item.id ? 'ring-2 ring-emerald-500' : ''}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-2">
                <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
                  {convertToLanguage(item.name, language)}
                </h3>
                {item.barcode && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{item.barcode}</p>
                )}
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newQty = item.quantity - 1;
                    if (newQty > 0) onQuantityChange(item.id, newQty);
                    else onRemove(item.id);
                  }}
                  className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-lg">{item.quantity}</span>
                <button
                  onClick={() => {
                    const newQty = item.quantity + 1;
                    if (!item.maxStock || newQty <= item.maxStock) {
                      onQuantityChange(item.id, newQty);
                    }
                  }}
                  className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">
                  {item.totalPrice.toLocaleString()} <span className="text-sm text-gray-500">{t('common.sum')}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {item.unitPrice.toLocaleString()} × {item.quantity}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ResponsivePOSLayout;
