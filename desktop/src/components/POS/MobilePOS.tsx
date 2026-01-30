/**
 * Mobil kassa rejimi
 * Telefonlar uchun optimallashtirilgan
 * 
 * Skaner kassa terminali sifatida ishlaydi:
 * skan → mahsulot qidirish → chekka avtomatik qo'shish
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
} from '../../store/slices/posSlice';
import {
  Camera,
  Trash2,
  Plus,
  Minus,
  Send,
  ShoppingCart,
  Package,
  X,
  Wifi,
  WifiOff,
  FileText,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import offlineStorage, { SavedReceipt } from '../../services/OfflineStorage';
import { handleScanResult } from '../../services/ScannerService';
import apiService from '../../services/ApiService';
import socketService from '../../services/SocketService';
import BarcodeScanner from './BarcodeScanner';
import SavedReceipts from './SavedReceipts';
import { useLanguage } from '../../i18n';
import { convertToLanguage } from '../../utils/transliterate';

interface MobilePOSProps {
  cashierId?: string;
  cashierName?: string;
}

const MobilePOS: React.FC<MobilePOSProps> = ({ cashierId, cashierName }) => {
  const dispatch = useDispatch();
  const { cart, totalAmount } = useSelector((state: RootState) => state.pos);
  const { isOnline } = useSelector((state: RootState) => state.sync);
  const { t, language } = useLanguage();

  const [showScanner, setShowScanner] = useState(false);
  const [showSavedReceipts, setShowSavedReceipts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Debug: searchResults o'zgarishini kuzatish
  useEffect(() => {
    console.log('🔄 MobilePOS searchResults changed:', searchResults.length, searchResults);
  }, [searchResults]);
  const [sending, setSending] = useState(false);
  const [savedReceiptsCount, setSavedReceiptsCount] = useState(0);

  // 📡 Online status initialization
  useEffect(() => {
    const initialStatus = apiService.getStatus();
    dispatch({ type: 'sync/setOnlineStatus', payload: initialStatus.isOnline });
    console.log('📡 MobilePOS: Initial online status:', initialStatus.isOnline);
    
    const unsubscribe = apiService.onStatusChange((online) => {
      console.log('📡 MobilePOS: Online status changed:', online);
      dispatch({ type: 'sync/setOnlineStatus', payload: online });
    });
    
    return unsubscribe;
  }, [dispatch]);

  // Saqlangan cheklar sonini yuklash
  useEffect(() => {
    loadSavedReceiptsCount();
  }, []);

  // 🔥 Socket.IO ulanish
  useEffect(() => {
    if (cashierId) {
      console.log('🔌 MobilePOS: Connecting to Socket.IO for cashier:', cashierId);
      socketService.connect(cashierId);
    }

    return () => {
      console.log('🔌 MobilePOS: Disconnecting Socket.IO');
      socketService.disconnect();
    };
  }, [cashierId]);

  const loadSavedReceiptsCount = async () => {
    try {
      if (isOnline) {
        // Internet bor - MongoDB dan olish
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/receipts/saved?status=saved&cashierId=${cashierId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setSavedReceiptsCount(data.data.length);
        }
      } else {
        // Offline - IndexedDB dan olish
        const receipts = await offlineStorage.getSavedReceipts();
        setSavedReceiptsCount(receipts.filter(r => r.status === 'saved').length);
      }
    } catch (error) {
      console.error('Cheklar yuklashda xatolik:', error);
      // Fallback to IndexedDB
      const receipts = await offlineStorage.getSavedReceipts();
      setSavedReceiptsCount(receipts.filter(r => r.status === 'saved').length);
    }
  };

  /**
   * Skanerlashni qayta ishlash
   * Kassa terminali sifatida ishlaydi: skan → qidirish → chekka qo'shish
   */
  const handleScan = async (code: string) => {
    setShowScanner(false);

    if (!code?.trim()) {
      toast.error(t('pos.productNotFound'));
      return;
    }

    // Mahsulotni qidirish
    const result = await handleScanResult(code);

    if (result.found) {
      // Mahsulot topildi — chekka qo'shish
      addProductToCart(result.product);
      toast.success(t('pos.productAdded'));
    } else {
      // Mahsulot topilmadi
      toast.error('Mahsulot topilmadi');
    }
  };

  // Mahsulotni savatga qo'shish
  const addProductToCart = (product: { id: string; barcode: string; name: string; sellingPrice: number; currentStock: number }) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast.error(t('pos.insufficientStock'));
        return;
      }
      dispatch(updateCartItemQuantity({
        id: existingItem.id,
        quantity: existingItem.quantity + 1
      }));
    } else {
      if (product.currentStock < 1) {
        toast.error(t('pos.outOfStock'));
        return;
      }
      dispatch(addToCart({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discountAmount: 0,
        maxStock: product.currentStock, // Stock limitini saqlash
      }));
    }
  };

  // Mahsulotlarni qidirish (kod/shtrix-kod bo'yicha)
  const handleSearch = async (query?: string) => {
    console.log('🔍 MobilePOS handleSearch called, query:', query);
    console.log('🌐 isOnline:', isOnline);

    setLoading(true);
    try {
      let allProducts: any[] = [];

      // Har doim API'dan olishga harakat qilish
      try {
        console.log('📡 Trying to fetch from API...');
        allProducts = await apiService.getProducts();
        console.log('✅ Products from API:', allProducts.length);
        // getProducts ichida allaqachon IndexedDB ga saqlanadi
      } catch (apiError) {
        console.warn('⚠️ API fetch failed, falling back to IndexedDB:', apiError);
        // Offline - IndexedDB dan olish
        console.log('💾 Loading from IndexedDB...');
        const offlineProducts = await offlineStorage.getProducts();
        console.log('✅ Products from IndexedDB:', offlineProducts.length);
        allProducts = offlineProducts.map(p => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          selling_price: p.selling_price,
          current_stock: p.current_stock,
        }));
      }

      if (query && query.trim()) {
        // Kod bo'yicha qisman moslik
        const q = query.trim().toLowerCase();
        const filtered = allProducts.filter(p =>
          p.barcode?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q)
        );
        console.log('🔎 Filtered results:', filtered.length);
        setSearchResults(filtered);
      } else {
        // Bo'sh bo'lsa - barcha mahsulotlar
        console.log('📋 Showing all products:', allProducts.length);
        setSearchResults(allProducts);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      // Fallback to IndexedDB
      const offlineProducts = await offlineStorage.getProducts();
      console.log('💾 Fallback to IndexedDB:', offlineProducts.length);
      const mapped = offlineProducts.map(p => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        selling_price: p.selling_price,
        current_stock: p.current_stock,
      }));

      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        setSearchResults(mapped.filter(p =>
          p.barcode?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q)
        ));
      } else {
        setSearchResults(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  // Qidiruv ochilganda mahsulotlarni yuklash
  useEffect(() => {
    console.log('🔍 MobilePOS useEffect: showSearch changed to', showSearch);
    if (showSearch) {
      console.log('  → Calling handleSearch');
      handleSearch('');
    }
  }, [showSearch]);

  // Chekni yuborish (saqlash)
  const handleSendReceipt = async () => {
    console.log('📤 handleSendReceipt called');
    console.log('  → Cart items:', cart.length);
    console.log('  → Total amount:', totalAmount);
    
    if (cart.length === 0) {
      toast.error(t('pos.emptyCart'));
      return;
    }

    setSending(true);
    console.log('  → Sending state set to true');

    try {
      // Chek obyektini shakllantirish
      const receipt: SavedReceipt = {
        id: `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        cashierId,
        cashierName,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          barcode: item.barcode,
        })),
        total: totalAmount,
        status: 'saved',
        source: 'mobile',
        createdAt: new Date().toISOString(),
        synced: false,
      };

      console.log('  → Receipt object created:', receipt);

      // Har doim IndexedDB ga saqlash (offline backup)
      console.log('  → Saving to IndexedDB...');
      await offlineStorage.saveSavedReceipt(receipt);
      console.log('  ✅ Saved to IndexedDB');

      // Internet bor bo'lsa MongoDB ga ham yuborish
      console.log('  → isOnline:', isOnline);
      
      // isOnline noto'g'ri bo'lishi mumkin, shuning uchun har doim serverga yuborishga harakat qilamiz
      try {
        const token = localStorage.getItem('accessToken');
        console.log('  → Token:', token ? 'exists' : 'missing');
        console.log('  → Sending to server...');
        
        const response = await fetch('/api/receipts/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(receipt),
        });

        console.log('  → Server response status:', response.status);
        const responseData = await response.json();
        console.log('  → Server response data:', responseData);

        if (response.ok) {
          await offlineStorage.markSavedReceiptAsSynced(receipt.id);
          console.log('  ✅ Receipt synced');
          toast.success(t('pos.receiptSaved'));
        } else {
          console.warn('  ⚠️ Server error, saved locally');
          toast.success(t('pos.receiptSaved') + ' (lokal)');
        }
      } catch (error) {
        console.error('  ❌ Server error:', error);
        toast.success(t('pos.receiptSaved') + ' (lokal)');
      }

      // Savatni tozalash
      dispatch(clearCart());
      loadSavedReceiptsCount();

    } catch (error) {
      console.error('Chek saqlash xatosi:', error);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSending(false);
    }
  };

  // Miqdorni o'zgartirish
  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      dispatch(removeFromCart(itemId));
    } else {
      // Stock limitini tekshirish
      if (item.maxStock && newQuantity > item.maxStock) {
        toast.error(`${t('pos.insufficientStock')} (max: ${item.maxStock})`);
        return;
      }
      dispatch(updateCartItemQuantity({ id: itemId, quantity: newQuantity }));
    }
  };

  return (
    <div className="h-screen h-[100dvh] bg-gray-100 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 safe-area-top flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">{t('pos.mobilePOS')}</h1>
              <p className="text-white/70 text-xs">{cashierName || t('settings.cashier')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Saqlangan cheklar tugmasi */}
            <button
              onClick={() => setShowSavedReceipts(true)}
              className="relative p-2 bg-white/20 rounded-xl"
            >
              <FileText className="w-5 h-5 text-white" />
              {savedReceiptsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {savedReceiptsCount}
                </span>
              )}
            </button>
            {/* Online holati */}
            <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {isOnline ? (
                <Wifi className="w-5 h-5 text-emerald-300" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-300" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Asosiy kontent - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Savat elementlari */}
        <div className="p-4 pb-32">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Package className="w-20 h-20 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('pos.emptyCart')}</p>
              <p className="text-sm mt-1">{t('pos.scanQRBarcode')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2">
                        {convertToLanguage(item.name, language)}
                      </h3>
                      {item.barcode && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          {item.barcode}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Miqdor boshqaruvi */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Narx */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {(item.totalPrice ?? 0).toLocaleString()} {t('common.sum')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(item.unitPrice ?? 0).toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pastki panel - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom shadow-lg">
        {/* Jami */}
        {cart.length > 0 && (
          <div className="flex justify-between items-center mb-3 px-2">
            <span className="text-gray-600 text-sm">{t('common.total')}:</span>
            <span className="text-xl font-bold text-gray-900">
              {totalAmount.toLocaleString()} {t('common.sum')}
            </span>
          </div>
        )}

        {/* Amal tugmalari */}
        <div className="grid grid-cols-2 gap-2">
          {/* Qidirish tugmasi */}
          <button
            onClick={() => {
              console.log('🔘 MobilePOS: Search button clicked');
              setShowSearch(true);
            }}
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors active:scale-95"
          >
            <Search className="w-6 h-6" />
            <span className="text-xs">{t('common.search')}</span>
          </button>

          {/* Skanerlash tugmasi */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center justify-center gap-1.5 py-3 bg-emerald-500 rounded-xl font-medium text-white hover:bg-emerald-600 transition-colors active:scale-95"
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs leading-tight text-center">
              {t('pos.scanBarcode')}
            </span>
          </button>
        </div>

        {/* Yuborish tugmasi (savatda mahsulot bo'lganda) */}
        {cart.length > 0 && (
          <button
            onClick={handleSendReceipt}
            disabled={sending}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('pos.sendReceipt')} ({cart.length} {t('common.pcs')})
              </>
            )}
          </button>
        )}
      </div>

      {/* Shtrix-kod skaner modali */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Saqlangan cheklar modali */}
      <SavedReceipts
        isOpen={showSavedReceipts}
        onClose={() => setShowSavedReceipts(false)}
        onReceiptLoaded={loadSavedReceiptsCount}
      />

      {/* Qidiruv modali */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    placeholder={t('pos.searchProduct')}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-3 hover:bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? t('pos.noProductsFound') : t('products.noProducts')}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((product) => (
                    <button
                      key={product.id || product._id}
                      onClick={() => {
                        addProductToCart({
                          id: product.id || product._id,
                          barcode: product.barcode,
                          name: product.name,
                          sellingPrice: product.selling_price || product.sellingPrice || 0,
                          currentStock: product.current_stock || product.currentStock || 0,
                        });
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                        toast.success(t('pos.productAdded'));
                      }}
                      className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-emerald-50 transition-colors active:scale-[0.98]"
                    >
                      <div className="font-medium text-gray-900">{convertToLanguage(product.name, language)}</div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500 font-mono">{product.barcode}</span>
                        <span className="font-bold text-emerald-600">
                          {(product.selling_price || product.sellingPrice || 0).toLocaleString()} {t('common.sum')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {t('pos.inStock')}: {product.current_stock || product.currentStock || 0} {t('common.pcs')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePOS;
