/**
 * Saqlangan cheklar komponenti
 * Chekni ochish va u bilan ishlashni davom ettirish imkonini beradi
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, clearCart, setCustomer } from '../../store/slices/posSlice';
import { RootState } from '../../store/store';
import { 
  FileText, 
  Clock, 
  Smartphone, 
  Monitor, 
  Trash2, 
  ShoppingCart,
  RefreshCw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import offlineStorage from '../../services/OfflineStorage';
import socketService from '../../services/SocketService';
import { useLanguage } from '../../i18n';
import { convertToLanguage } from '../../utils/transliterate';

export interface SavedReceipt {
  id: string;
  localId?: string; // IndexedDB ID
  cashierId?: string;
  cashierName?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    barcode?: string;
  }[];
  total: number;
  status: 'saved' | 'completed' | 'cancelled';
  source: 'mobile' | 'desktop';
  createdAt: string;
  customerId?: string;
  customerName?: string;
  synced?: boolean;
}

interface SavedReceiptsProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptLoaded?: () => void;
}

const SavedReceipts: React.FC<SavedReceiptsProps> = ({ isOpen, onClose, onReceiptLoaded }) => {
  const dispatch = useDispatch();
  const { isOnline } = useSelector((state: RootState) => state.sync);
  const { user } = useSelector((state: RootState) => state.auth);
  const { t, language } = useLanguage();
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReceipts();
    }
  }, [isOpen]);

  // 🔥 Socket.IO real-time yangilanishlar
  useEffect(() => {
    const cashierId = user?.id;
    if (!cashierId) return;

    // Socket.IO ga ulanish
    socketService.connect(cashierId);

    // Yangi chek saqlanganda
    socketService.onReceiptSaved((receipt) => {
      console.log('🔔 New receipt saved:', receipt);
      toast.success('Yangi chek saqlandi!', { icon: '📥' });
      
      // Ro'yxatga qo'shish
      setReceipts((prev) => [receipt, ...prev]);
    });

    // Chek o'chirilganda
    socketService.onReceiptDeleted((receiptId) => {
      console.log('🔔 Receipt deleted:', receiptId);
      
      // Ro'yxatdan o'chirish
      setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    });

    // Cleanup
    return () => {
      socketService.removeAllListeners();
    };
  }, [user?.id]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      let allReceipts: SavedReceipt[] = [];
      
      if (isOnline) {
        // Internet bor - MongoDB dan olish
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch('/api/receipts/saved?status=saved', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          
          if (data.success && data.data) {
            allReceipts = data.data.map((r: any) => ({
              id: r._id, // MongoDB _id ni ishlatish
              localId: r.localId, // IndexedDB ID
              cashierId: r.cashierId,
              cashierName: r.cashierName,
              items: r.items,
              total: r.total,
              status: r.status,
              source: r.source,
              createdAt: r.createdAt,
              customerId: r.customerId,
              customerName: r.customerName,
            }));
          }
        } catch (error) {
          console.error('Server xatosi, IndexedDB dan yuklanmoqda:', error);
          // Fallback to IndexedDB
          const localReceipts = await offlineStorage.getSavedReceipts();
          allReceipts = localReceipts.filter(r => r.status === 'saved');
        }
      } else {
        // Offline - IndexedDB dan olish
        const localReceipts = await offlineStorage.getSavedReceipts();
        allReceipts = localReceipts.filter(r => r.status === 'saved');
      }
      
      setReceipts(allReceipts);
    } catch (error) {
      console.error('Cheklar yuklash xatosi:', error);
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (receipt: SavedReceipt) => {
    try {
      // Joriy savatni tozalash
      dispatch(clearCart());
      
      // Chekdagi mahsulotlarni savatga qo'shish
      for (const item of receipt.items) {
        dispatch(addToCart({
          id: `${item.productId}-${Date.now()}-${Math.random()}`,
          productId: item.productId,
          name: item.name,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.price,
          discountAmount: 0,
        }));
      }

      // Mijozni o'rnatish (agar mavjud bo'lsa)
      if (receipt.customerId) {
        dispatch(setCustomer({
          id: receipt.customerId,
          fullName: receipt.customerName || 'Mijoz',
          currentDebt: 0,
          discountPercentage: 0,
        }));
      }

      // Chekni saqlangan ro'yxatdan o'chirish (endi savatda)
      await offlineStorage.deleteSavedReceipt(receipt.id);
      
      // Serverdan ham o'chirish
      if (isOnline) {
        try {
          const token = localStorage.getItem('accessToken');
          await fetch(`/api/receipts/saved/${receipt.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // Server xatosini e'tiborsiz qoldirish
        }
      }

      toast.success(t('pos.receiptLoaded'));
      onReceiptLoaded?.();
      onClose();
    } catch (error) {
      console.error('Chek ochish xatosi:', error);
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handleDeleteReceipt = async (receipt: SavedReceipt) => {
    if (!window.confirm(t('confirmations.deleteItem'))) return;

    try {
      await offlineStorage.deleteSavedReceipt(receipt.id);
      
      // Serverdan ham o'chirish
      if (isOnline) {
        try {
          const token = localStorage.getItem('accessToken');
          await fetch(`/api/receipts/saved/${receipt.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // Server xatosini e'tiborsiz qoldirish
        }
      }

      setReceipts(receipts.filter(r => r.id !== receipt.id));
      toast.success(t('common.deleted'));
    } catch (error) {
      console.error('Chek o\'chirish xatosi:', error);
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Sinxronlanmagan cheklar
      const unsyncedReceipts = await offlineStorage.getUnsyncedSavedReceipts();
      
      if (unsyncedReceipts.length > 0 && isOnline) {
        const token = localStorage.getItem('accessToken');
        
        for (const receipt of unsyncedReceipts) {
          try {
            await fetch('/api/receipts/saved', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(receipt),
            });
            await offlineStorage.markSavedReceiptAsSynced(receipt.id);
          } catch (error) {
            console.error(`Chek ${receipt.id} sinxronlash xatosi:`, error);
          }
        }
      }
      
      await loadReceipts();
      toast.success(t('settings.syncNow'));
    } catch (error) {
      console.error('Sinxronlash xatosi:', error);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-500 to-orange-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t('pos.savedReceipts')}</h2>
              <p className="text-sm text-white/70">{receipts.length} {t('common.pcs')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-white ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{t('pos.noSavedReceipts')}</p>
              <p className="text-gray-400 text-sm mt-1">
                {t('pos.openFromDesktop')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-amber-300 hover:bg-amber-50/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Manba ikonkasi */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        receipt.source === 'mobile' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {receipt.source === 'mobile' ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <Monitor className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          #{receipt.id.slice(-6).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(receipt.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {receipt.total.toLocaleString()} {t('common.sum')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {receipt.items.length} {t('common.pcs')}
                      </p>
                    </div>
                  </div>

                  {/* Mahsulotlar ko'rinishi */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="space-y-1">
                      {receipt.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate max-w-[200px]">
                            {convertToLanguage(item.name, language)} × {item.quantity}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {receipt.items.length > 3 && (
                        <p className="text-xs text-gray-400 mt-1">
                          +{receipt.items.length - 3} {t('common.pcs')}...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amallar */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenReceipt(receipt)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors active:scale-[0.98]"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {t('pos.openReceipt')}
                    </button>
                    <button
                      onClick={() => handleDeleteReceipt(receipt)}
                      className="px-4 py-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedReceipts;
