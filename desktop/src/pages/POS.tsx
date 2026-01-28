import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RootState } from '../store/store';
import {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  updateCartItemPrice,
  clearCart,
} from '../store/slices/posSlice';
import { setOnlineStatus } from '../store/slices/syncSlice';
import {
  Search,
  RotateCcw,
  Save,
  CreditCard,
  Trash2,
  Plus,
  Minus,
  Package,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  Wifi,
  WifiOff,
  User,
  Users,
  ShoppingCart,
  BookOpen,
  LogOut,
  Store,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  Edit,
  FileText,
  Printer,
  QrCode,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import apiService from '../services/ApiService';
import offlineStorage, { SavedReceipt } from '../services/OfflineStorage';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';
import { useMobileDetect } from '../hooks/useMobileDetect';
import MobilePOS from '../components/POS/MobilePOS';
import SavedReceipts from '../components/POS/SavedReceipts';
import { handleScanResult, searchProductByCode } from '../services/ScannerService';

// Dollar kursi (default, keyinchalik API dan olinadi)
const DEFAULT_USD_RATE = 12850;

interface Product {
  id: string;
  barcode: string;
  name: string;
  selling_price: number;
  current_stock: number;
}

const POS: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { cashierId } = useParams<{ cashierId: string }>();
  const { cart, totalAmount, customer } = useSelector((state: RootState) => state.pos);
  const { isOnline } = useSelector((state: RootState) => state.sync);
  const { user } = useSelector((state: RootState) => state.auth);
  const { t, language, setLanguage } = useLanguage();

  // Определение мобильного устройства
  const { isMobile } = useMobileDetect();

  const isAdminPanel = location.pathname.startsWith('/admin');
  const selectedCashier = JSON.parse(localStorage.getItem('selectedCashier') || '{}');

  // POS states
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'quantity' | 'code' | 'price'>('code');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNumpad, setShowNumpad] = useState(true);
  const [showSavedReceipts, setShowSavedReceipts] = useState(false);

  // URL ga qarab activeTab ni aniqlash
  const isDebtsPage = location.pathname.endsWith('/debts');
  const isProductsPage = location.pathname.endsWith('/products');
  const isCustomersPage = location.pathname.endsWith('/customers');
  const getInitialTab = () => {
    if (isDebtsPage) return 'debts';
    if (isProductsPage) return 'products';
    if (isCustomersPage) return 'customers';
    return 'pos';
  };
  const [activeTab, setActiveTab] = useState<'pos' | 'debts' | 'products' | 'customers'>(getInitialTab());
  const [cashierDebts, setCashierDebts] = useState<any[]>([]);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtCustomers, setDebtCustomers] = useState<any[]>([]);
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [showEditDebtModal, setShowEditDebtModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [editDebtForm, setEditDebtForm] = useState({ amount: '', dueDate: '', notes: '' });

  // Effects - должны быть до любого return
  useEffect(() => {
    const unsubscribe = apiService.onStatusChange((online) => {
      dispatch(setOnlineStatus(online));
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [isDebtsPage, isProductsPage, isCustomersPage]);

  useEffect(() => {
    if (activeTab === 'debts') {
      loadCashierDebts();
      loadDebtCustomers();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPayment || showSearch) return;
      if (e.key >= '0' && e.key <= '9') handleNumberClick(e.key);
      else if (e.key === 'Enter') handleAdd();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') {
        handleClear();
        setSelectedItemId(null);
        setInputMode('code');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputValue, inputMode, selectedItemId, showPayment, showSearch]);

  // Handlers
  const handleNumberClick = (num: string) => setInputValue((prev) => prev + num);
  const handleBackspace = () => setInputValue((prev) => prev.slice(0, -1));
  const handleClear = () => setInputValue('');

  const handleTabChange = (tab: 'pos' | 'debts' | 'products' | 'customers') => {
    setActiveTab(tab);
    if (tab === 'pos') {
      navigate(`/${cashierId}/pos`);
    } else {
      navigate(`/${cashierId}/pos/${tab}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('selectedCashier');
    navigate('/');
  };

  // Kassir qarzlarini yuklash
  const loadCashierDebts = async () => {
    setLoadingDebts(true);
    try {
      const token = localStorage.getItem('accessToken');
      const currentCashierId = cashierId || selectedCashier?._id;
      const response = await fetch(`/api/customers/debts/by-cashier/${currentCashierId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCashierDebts(data.data || []);
      }
    } catch (error) {
      console.error('Load debts error:', error);
    } finally {
      setLoadingDebts(false);
    }
  };

  // Mijozlarni yuklash (faqat kassir qo'shgan mijozlar)
  const loadDebtCustomers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const currentCashierId = cashierId || selectedCashier?._id;
      const url = currentCashierId
        ? `/api/customers?createdBy=${currentCashierId}`
        : '/api/customers';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDebtCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Load customers error:', error);
    }
  };

  // Qarz to'lash
  const handlePayDebt = async () => {
    if (!selectedDebt || !payAmount) {
      toast.error(t('errors.requiredField'));
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${selectedDebt.customerId}/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(payAmount), cashierId: cashierId || selectedCashier?._id }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('debts.debtPaid'));
        setShowPayDebtModal(false);
        setSelectedDebt(null);
        setPayAmount('');
        loadCashierDebts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  // Qarzni o'chirish
  const handleDeleteDebt = async (debt: any) => {
    if (!window.confirm(`${debt.customerName} - ${t('confirmations.deleteItem')}`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${debt.customerId}/delete-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cashierId: cashierId || selectedCashier?._id, notes: "Qarz o'chirildi" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('common.deleted'));
        loadCashierDebts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  // Qarzni tahrirlash modalini ochish
  const openEditDebtModal = (debt: any) => {
    setSelectedDebt(debt);
    setEditDebtForm({
      amount: debt.amount?.toString() || '',
      dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',
      notes: debt.notes || '',
    });
    setShowEditDebtModal(true);
  };

  // Qarzni to'lash modalini ochish
  const openPayDebtModal = (debt: any) => {
    setSelectedDebt(debt);
    setPayAmount('');
    setShowPayDebtModal(true);
  };

  const handleAdd = async () => {
    if (!inputValue) return;
    if (inputMode === 'code') {
      await searchByBarcode(inputValue);
    } else if (inputMode === 'quantity' && selectedItemId) {
      const qty = parseInt(inputValue);
      if (qty > 0) {
        dispatch(updateCartItemQuantity({ id: selectedItemId, quantity: qty }));
        toast.success(t('common.success'));
      }
      setSelectedItemId(null);
      setInputMode('code');
    } else if (inputMode === 'price' && selectedItemId) {
      const price = parseFloat(inputValue);
      if (price >= 0) {
        dispatch(updateCartItemPrice({ id: selectedItemId, unitPrice: price }));
        toast.success(t('common.success'));
      }
      setSelectedItemId(null);
      setInputMode('code');
    }
    setInputValue('');
  };

  /**
   * Поиск товара по коду
   * Работает как кассовый терминал: код → поиск → добавление в чек
   */
  const searchByBarcode = async (rawCode: string) => {
    const result = await handleScanResult(rawCode);

    if (result.found) {
      // Товар найден — добавляем в корзину
      const product = {
        id: result.product.id,
        barcode: result.product.barcode,
        name: result.product.name,
        selling_price: result.product.sellingPrice,
        current_stock: result.product.currentStock,
      };
      addProductToCart(product);
    } else {
      // Товар не найден
      toast.error('Mahsulot topilmadi');
    }
  };

  const addProductToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        toast.error(t('pos.insufficientStock'));
        return;
      }
      dispatch(updateCartItemQuantity({ id: existingItem.id, quantity: existingItem.quantity + 1 }));
    } else {
      if (product.current_stock < 1) {
        toast.error(t('pos.outOfStock'));
        return;
      }
      dispatch(addToCart({
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: 1,
        unitPrice: product.selling_price,
        discountAmount: 0,
        maxStock: product.current_stock, // Stock limitini saqlash
      }));
    }
    toast.success(t('pos.addToCart'));
  };


  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromCart(itemId));
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
      setInputMode('code');
    }
  };

  // Barcha mahsulotlarni yuklash
  const loadAllProducts = async () => {
    setLoading(true);
    try {
      const products = await apiService.getProducts();
      setSearchResults(products);
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Qidiruv modali ochilganda
  useEffect(() => {
    if (showSearch) {
      loadAllProducts();
    }
  }, [showSearch]);

  // Debounced search
  useEffect(() => {
    if (!showSearch) return;
    
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      }
    }, 300); // 300ms kutish

    return () => clearTimeout(timer);
  }, [searchQuery, showSearch]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadAllProducts();
      return;
    }
    
    setLoading(true);
    try {
      const products = await apiService.getProducts(searchQuery.trim());
      setSearchResults(products);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (cart.length === 0) {
      toast.error(t('pos.emptyCart'));
      return;
    }
    setShowPayment(true);
  };

  // Сохранить чек для последующего открытия
  const handleSaveReceipt = async () => {
    if (cart.length === 0) {
      toast.error(t('pos.emptyCart'));
      return;
    }

    try {
      const receipt: SavedReceipt = {
        id: `desktop_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        cashierId: cashierId || selectedCashier?._id || user?.id,
        cashierName: selectedCashier?.fullName || user?.fullName,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          barcode: item.barcode,
        })),
        total: totalAmount,
        status: 'saved',
        source: 'desktop',
        createdAt: new Date().toISOString(),
        synced: false,
      };

      // Сохраняем в IndexedDB
      await offlineStorage.saveSavedReceipt(receipt);

      // Пробуем отправить на сервер
      if (isOnline) {
        try {
          const token = localStorage.getItem('accessToken');
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
          console.log('Чек сохранён локально, синхронизируется позже');
        }
      }

      // Очищаем корзину
      dispatch(clearCart());
      toast.success(t('pos.receiptSaved') || 'Чек сохранён');
    } catch (error) {
      console.error('Ошибка сохранения чека:', error);
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  // Admin panel ichida - Layout bilan
  if (isAdminPanel) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('nav.pos')}</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Savdo qilish</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user?.fullName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          {/* Cart Table */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{t('common.total')}: {cart.length} {t('common.pcs')}</span>
              <button onClick={() => setShowNumpad(!showNumpad)} className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                {showNumpad ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">{t('products.barcode')}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('products.title')}</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('common.quantity')}</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">{t('common.price')}</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">{t('common.amount')}</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">{t('pos.emptyCart')}</p>
                        <p className="text-gray-300 text-sm mt-1">Mahsulot qo'shish uchun shtrix-kodni kiriting</p>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${selectedItemId === item.id ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 hidden md:table-cell">{item.barcode || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">{convertToLanguage(item.name, language)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            defaultValue={item.quantity}
                            key={`qty-${item.id}-${item.quantity}`}
                            onBlur={(e) => {
                              const qty = parseInt(e.target.value);
                              if (qty > 0) {
                                // Stock limitini tekshirish
                                if (item.maxStock && qty > item.maxStock) {
                                  toast.error(`${t('pos.insufficientStock')} (max: ${item.maxStock})`);
                                  e.target.value = item.maxStock.toString();
                                  dispatch(updateCartItemQuantity({ id: item.id, quantity: item.maxStock }));
                                } else {
                                  dispatch(updateCartItemQuantity({ id: item.id, quantity: qty }));
                                }
                              } else {
                                e.target.value = item.quantity.toString();
                              }
                            }}
                            className="w-16 text-center font-semibold border border-gray-200 rounded-lg py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            min="1"
                            max={item.maxStock || undefined}
                          />
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <input
                            type="number"
                            defaultValue={item.unitPrice}
                            key={`price-${item.id}-${item.unitPrice}`}
                            onBlur={(e) => {
                              const price = parseFloat(e.target.value);
                              if (price > 0) {
                                dispatch(updateCartItemPrice({ id: item.id, unitPrice: price }));
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
                            onClick={() => { handleRemoveItem(item.id); }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex gap-2 overflow-x-auto">
              <button onClick={() => setShowSearch(true)} className="btn btn-sm btn-secondary">
                <Search className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.search')}</span>
              </button>
              <button onClick={() => dispatch(clearCart())} className="btn btn-sm btn-ghost border border-orange-200 text-orange-500 hover:bg-orange-50">
                <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">{t('pos.clearCart')}</span>
              </button>
              <button onClick={handleSaveReceipt} className="btn btn-sm btn-secondary">
                <Save className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.save')}</span>
              </button>
              <div className="flex-1" />
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                <span className="text-sm text-emerald-600">{t('common.total')}:</span>
                <span className="text-xl font-bold text-emerald-700">{totalAmount.toLocaleString()}</span>
                <span className="text-sm text-emerald-600">{t('common.sum')}</span>
              </div>
              <button onClick={handlePayment} className="btn btn-sm btn-primary">
                <CreditCard className="w-4 h-4" /> {t('pos.payment')}
              </button>
            </div>
          </div>

          {/* Numpad Panel */}
          {showNumpad && (
            <div className="hidden lg:flex w-80 bg-white rounded-2xl shadow-sm border border-gray-100 flex-col overflow-hidden">
              <div className="p-4 text-right border-b border-gray-100 bg-emerald-50">
                <p className="text-sm text-emerald-600 mb-1">{t('common.total')}</p>
                <div className="text-3xl font-bold text-emerald-700">{totalAmount.toLocaleString()} <span className="text-lg">{t('common.sum')}</span></div>
              </div>
              <div className="p-3 flex gap-2">
                <button onClick={() => { setInputMode('quantity'); setInputValue(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${inputMode === 'quantity' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500'}`}>
                  {t('common.quantity')}
                </button>
                <button onClick={() => { setInputMode('price'); setInputValue(''); }}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${inputMode === 'price' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 text-gray-500'}`}>
                  Narx
                </button>
                <button onClick={() => { setInputMode('code'); setInputValue(''); setSelectedItemId(null); }}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${inputMode === 'code' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-gray-100 text-gray-500'}`}>
                  {t('products.barcode')}
                </button>
              </div>
              <div className="px-3 pb-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder={inputMode === 'code' ? 'Kod kiriting...' : inputMode === 'price' ? 'Narx...' : 'Soni...'}
                  className="input text-center text-lg"
                />
              </div>
              <div className="grid grid-cols-4 gap-2.5 p-4 flex-1">
                {['7', '8', '9'].map((n) => (
                  <button key={n} onClick={() => handleNumberClick(n)} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors" style={{ minHeight: '60px' }}>{n}</button>
                ))}
                <button onClick={handleClear} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-colors" style={{ minHeight: '60px' }}>C</button>
                {['4', '5', '6'].map((n) => (
                  <button key={n} onClick={() => handleNumberClick(n)} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors" style={{ minHeight: '60px' }}>{n}</button>
                ))}
                <button onClick={handleBackspace} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-colors" style={{ minHeight: '60px' }}>⌫</button>
                {['1', '2', '3'].map((n) => (
                  <button key={n} onClick={() => handleNumberClick(n)} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors" style={{ minHeight: '60px' }}>{n}</button>
                ))}
                <button onClick={handleAdd} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-emerald-500 hover:bg-emerald-600 text-white row-span-2 shadow-lg shadow-emerald-500/25 transition-colors" style={{ minHeight: '60px' }}>+</button>
                <button onClick={() => handleNumberClick('0')} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors" style={{ minHeight: '60px' }}>0</button>
                <button onClick={() => handleNumberClick('00')} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors" style={{ minHeight: '60px' }}>00</button>
                <button onClick={() => handleNumberClick('.')} className="flex items-center justify-center rounded-xl font-semibold text-xl bg-gray-50 hover:bg-gray-100 text-gray-800 transition-colors" style={{ minHeight: '60px' }}>.</button>
              </div>
            </div>
          )}
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="modal-overlay" onClick={() => setShowSearch(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">{t('pos.searchProduct')}</h2>
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-5">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={t('pos.searchProduct')}
                    className="input flex-1"
                    autoFocus
                  />
                  <button onClick={handleSearch} className="btn btn-md btn-primary px-4">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-8"><div className="spinner mx-auto" /></div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">{searchQuery ? t('common.notFound') : t('products.noProducts')}</div>
                  ) : (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => { addProductToCart(product); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                        className="w-full p-4 border border-gray-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left"
                      >
                        <div className="font-medium text-gray-900">{convertToLanguage(product.name, language)}</div>
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span className="font-mono">{product.barcode}</span>
                          <span className="font-bold text-emerald-600">{product.selling_price.toLocaleString()} {t('common.sum')}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{t('pos.inStock')}: {product.current_stock} {t('common.pcs')}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && (
          <PaymentModal
            totalAmount={totalAmount}
            cart={cart}
            customer={customer}
            cashierName={convertToLanguage(user?.fullName || 'Admin', language)}
            cashierId={user?.id}
            onClose={() => setShowPayment(false)}
            onSuccess={() => { setShowPayment(false); dispatch(clearCart()); toast.success(t('pos.saleCompleted')); }}
          />
        )}

        {/* Saved Receipts Modal */}
        {showSavedReceipts && (
          <SavedReceipts
            isOpen={showSavedReceipts}
            onClose={() => setShowSavedReceipts(false)}
          />
        )}
      </div>
    );
  }

  // Standalone POS (kassirlar uchun) - /:cashierId/pos sahifasi
  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Mobile versiya (kassir panelida)
  if (isMobile) {
    return (
      <MobilePOS
        cashierId={cashierId || selectedCashier?._id}
        cashierName={selectedCashier?.fullName}
      />
    );
  }

  // Desktop versiya
  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown on lg+ */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 bg-white flex flex-col border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header with Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">{t('common.appName')}</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User Info - Tepada */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 font-bold text-xl mb-2">
              {(selectedCashier?.fullName || 'K')[0].toUpperCase()}
            </div>
            <p className="text-base font-semibold text-gray-800">
              {convertToLanguage(selectedCashier?.fullName || 'Kassir', language)}
            </p>
            <p className="text-sm text-gray-500">{t('cashiers.title')}</p>
          </div>
          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage('lat')}
              className={`flex-1 py-2.5 text-base font-medium rounded-xl transition-all ${language === 'lat'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Lotin
            </button>
            <button
              onClick={() => setLanguage('cyr')}
              className={`flex-1 py-2.5 text-base font-medium rounded-xl transition-all ${language === 'cyr'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Кирилл
            </button>
          </div>

        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 px-3">
          <button
            onClick={() => { handleTabChange('pos'); setShowMobileSidebar(false); }}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl mb-2 transition-colors ${activeTab === 'pos' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Store className="w-5 h-5" />
            <span className="font-semibold text-base">{t('nav.pos')}</span>
          </button>
          <button
            onClick={() => { handleTabChange('products'); setShowMobileSidebar(false); }}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl mb-2 transition-colors ${activeTab === 'products' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Package className="w-5 h-5" />
            <span className="font-semibold text-base">{t('nav.products')}</span>
          </button>
          <button
            onClick={() => { handleTabChange('customers'); setShowMobileSidebar(false); }}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl mb-2 transition-colors ${activeTab === 'customers' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-semibold text-base">{t('nav.customers')}</span>
          </button>
          <button
            onClick={() => { handleTabChange('debts'); setShowMobileSidebar(false); }}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl mb-2 transition-colors ${activeTab === 'debts' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-semibold text-base">{t('pos.debtBook')}</span>
          </button>
        </nav>

        {/* Bottom Section - Logout only */}
        <div className="border-t border-gray-100 p-3">
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-base font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-gray-800 font-semibold">
              {activeTab === 'pos' && t('nav.pos')}
              {activeTab === 'products' && t('nav.products')}
              {activeTab === 'customers' && t('nav.customers')}
              {activeTab === 'debts' && t('pos.debtBook')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'pos' && (
              <>
                <button
                  onClick={() => setShowSavedReceipts(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-lg text-amber-700 text-sm hover:bg-amber-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {t('pos.savedReceipts') || 'Сохранённые чеки'}
                </button>
              </>
            )}
            {activeTab === 'debts' && (
              <button
                onClick={() => setShowAddDebt(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 rounded-lg text-white text-sm hover:bg-cyan-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('pos.addDebt')}
              </button>
            )}
          </div>
        </div>

        {/* POS Tab Content */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Cart Section */}
            <div className="flex-1 flex flex-col bg-white">
              {/* Header Info */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('common.total')}: {cart.length} {t('common.pcs')}</span>
                <span className="text-sm font-semibold text-emerald-600 lg:hidden">
                  {totalAmount.toLocaleString()} {t('common.sum')}
                </span>
              </div>

              {/* Cart Items - Mobile Card Layout / Desktop Table */}
              <div className="flex-1 overflow-auto">
                {/* Mobile Card Layout */}
                <div className="lg:hidden p-3 space-y-3">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <Package className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium">{t('pos.emptyCart')}</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 pr-2">
                            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
                              {convertToLanguage(item.name, language)}
                            </h3>
                            {item.barcode && (
                              <p className="text-xs text-gray-400 font-mono mt-0.5">{item.barcode}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newQty = item.quantity - 1;
                                if (newQty > 0) {
                                  dispatch(updateCartItemQuantity({ id: item.id, quantity: newQty }));
                                } else {
                                  handleRemoveItem(item.id);
                                }
                              }}
                              className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 border border-gray-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => {
                                const newQty = item.quantity + 1;
                                if (item.maxStock && newQty > item.maxStock) {
                                  toast.error(`${t('pos.insufficientStock')} (max: ${item.maxStock})`);
                                } else {
                                  dispatch(updateCartItemQuantity({ id: item.id, quantity: newQty }));
                                }
                              }}
                              className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 active:scale-95 border border-gray-200"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price */}
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
                    ))
                  )}
                </div>

                {/* Desktop Table Layout */}
                <table className="w-full hidden lg:table">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="px-4 py-3 text-left font-semibold">{t('products.barcode')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('nav.products')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('nav.inventory')}</th>
                      <th className="px-4 py-3 text-center font-semibold">{t('common.quantity')}</th>
                      <th className="px-4 py-3 text-center font-semibold">{t('common.price')}</th>
                      <th className="px-4 py-3 text-right font-semibold">{t('common.amount')}</th>
                      <th className="px-4 py-3 text-center font-semibold">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400">{t('pos.emptyCart')}</p>
                        </td>
                      </tr>
                    ) : (
                      cart.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-sm text-gray-500">{item.barcode || '-'}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-gray-500">-</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              defaultValue={item.quantity}
                              key={`qty-${item.id}-${item.quantity}`}
                              onBlur={(e) => {
                                const qty = parseInt(e.target.value);
                                if (qty > 0) {
                                  // Stock limitini tekshirish
                                  if (item.maxStock && qty > item.maxStock) {
                                    toast.error(`${t('pos.insufficientStock')} (max: ${item.maxStock})`);
                                    e.target.value = item.maxStock.toString();
                                    dispatch(updateCartItemQuantity({ id: item.id, quantity: item.maxStock }));
                                  } else {
                                    dispatch(updateCartItemQuantity({ id: item.id, quantity: qty }));
                                  }
                                } else {
                                  e.target.value = item.quantity.toString();
                                }
                              }}
                              className="w-20 text-center font-semibold border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              min="1"
                              max={item.maxStock || undefined}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              defaultValue={item.unitPrice}
                              key={`price-${item.id}-${item.unitPrice}`}
                              onBlur={(e) => {
                                const price = parseFloat(e.target.value);
                                if (price > 0) {
                                  dispatch(updateCartItemPrice({ id: item.id, unitPrice: price }));
                                } else {
                                  e.target.value = item.unitPrice.toString();
                                }
                              }}
                              className="w-32 text-center font-semibold border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{item.totalPrice.toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions */}
              <div className="px-3 py-3 bg-gray-50 border-t border-gray-200">
                {/* Mobile Layout - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 lg:hidden">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    <Search className="w-4 h-4" />
                    {t('common.search')}
                  </button>
                  <button
                    onClick={() => dispatch(clearCart())}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-orange-200 rounded-xl text-orange-500 hover:bg-orange-50 text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('pos.clearCart')}
                  </button>
                  <button
                    onClick={handleSaveReceipt}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={cart.length === 0}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 rounded-xl text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    {t('pos.payment')}
                  </button>
                </div>

                {/* Desktop Layout - Horizontal */}
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50"
                  >
                    <Search className="w-4 h-4" />
                    {t('common.search')}
                  </button>
                  <button
                    onClick={() => dispatch(clearCart())}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 rounded-full text-orange-500 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('pos.clearCart')}
                  </button>
                  <button
                    onClick={handleSaveReceipt}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50"
                  >
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </button>
                  <button
                    onClick={handlePayment}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-500 rounded-full text-white font-medium hover:bg-emerald-600"
                  >
                    <CreditCard className="w-4 h-4" />
                    {t('pos.payment')}
                  </button>
                </div>
              </div>
            </div>

            {/* Right - Numpad Panel (Desktop only) */}
            <div className="hidden lg:flex w-64 bg-white border-l border-gray-200 flex-col">
              {/* Total */}
              <div className="p-4 text-right border-b border-gray-100">
                <p className="text-3xl font-bold text-gray-800">
                  {totalAmount.toLocaleString()} <span className="text-base text-gray-500">{t('common.sum')}</span>
                </p>
              </div>

              {/* Input */}
              <div className="px-3 py-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder={t('pos.scanBarcode')}
                  className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 text-center placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Numpad - Fixed height */}
              <div className="p-3 grid grid-cols-4 gap-2" style={{ gridAutoRows: '48px' }}>
                {['7', '8', '9'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleNumberClick(n)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg transition-colors"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-lg transition-colors"
                >
                  C
                </button>
                {['4', '5', '6'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleNumberClick(n)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg transition-colors"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={handleBackspace}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold rounded-lg transition-colors"
                >
                  ⌫
                </button>
                {['1', '2', '3'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleNumberClick(n)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg transition-colors"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={handleAdd}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg font-semibold rounded-lg row-span-2 transition-colors"
                >
                  +
                </button>
                <button
                  onClick={() => handleNumberClick('0')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg transition-colors"
                >
                  0
                </button>
                <button
                  onClick={() => handleNumberClick('00')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg transition-colors"
                >
                  00
                </button>
                <button
                  onClick={() => handleNumberClick('.')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg transition-colors"
                >
                  .
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab Content */}
        {activeTab === 'products' && (
          <div className="flex-1 overflow-auto bg-gray-50 p-4">
            <ProductsTab t={t} />
          </div>
        )}

        {/* Customers Tab Content */}
        {activeTab === 'customers' && (
          <div className="flex-1 overflow-auto bg-gray-50 p-4">
            <CustomersTab t={t} cashierId={cashierId || selectedCashier?._id} />
          </div>
        )}

        {/* Debts Tab Content */}
        {activeTab === 'debts' && (
          <div className="flex-1 overflow-auto bg-gray-50">
            {/* Stats Cards - Admin panel style */}
            <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{cashierDebts.length}</p>
                <p className="text-sm text-gray-500">{t('debts.pending')}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">{t('debts.todayDue')}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">{t('debts.paid')}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">{t('debts.overdue')}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 col-span-2 sm:col-span-1 text-white shadow-lg shadow-purple-500/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{cashierDebts.reduce((sum: number, d: any) => sum + (d.amount || 0), 0).toLocaleString()}</p>
                <p className="text-sm text-white/80">{t('debts.totalDebt')} ({t('common.sum')})</p>
              </div>
            </div>

            {/* Debts Table */}
            <div className="px-4 pb-4">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {loadingDebts ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : cashierDebts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500">{t('pos.noDebts')}</p>
                    <p className="text-sm text-gray-400">{t('pos.addDebtHint')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('customers.customerName')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('debts.debtAmount')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('debts.dueDate')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cashierDebts.map((debt: any) => (
                          <tr key={debt._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{debt.customerName || t('common.unknown')}</p>
                                  <p className="text-sm text-gray-500">{debt.customerPhone || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-lg font-bold text-red-600">{(debt.amount || 0).toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{t('common.sum')}</p>
                            </td>
                            <td className="px-4 py-4">
                              {debt.dueDate ? (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">{new Date(debt.dueDate).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">{t('debts.notSet')}</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                <Clock className="w-3 h-3" />
                                {t('debts.pending')}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openPayDebtModal(debt)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title={t('pos.payDebt')}>
                                  <CreditCard className="w-4 h-4" />
                                </button>
                                <button onClick={() => openEditDebtModal(debt)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('common.edit')}>
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteDebt(debt)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t('common.delete')}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      {showAddDebt && (
        <AddDebtModal
          customers={debtCustomers}
          cashierId={cashierId || selectedCashier?._id}
          onClose={() => setShowAddDebt(false)}
          onSuccess={() => { setShowAddDebt(false); loadCashierDebts(); toast.success(t('pos.debtAdded')); }}
          t={t}
        />
      )}

      {/* Pay Debt Modal */}
      {showPayDebtModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayDebtModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-lg font-semibold text-white">{t('pos.payDebt')}</h3>
              <button onClick={() => setShowPayDebtModal(false)} className="p-2 hover:bg-white/20 rounded-xl"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="p-5">
              <div className="text-center mb-5">
                <p className="font-medium text-gray-900">{selectedDebt.customerName}</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{(selectedDebt.amount || 0).toLocaleString()} {t('common.sum')}</p>
                <p className="text-sm text-gray-400">{t('debts.currentDebt')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('debts.paymentAmount')}</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-emerald-500" placeholder="0" autoFocus />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPayAmount(Math.floor((selectedDebt.amount || 0) / 2).toString())} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200">50%</button>
                <button onClick={() => setPayAmount((selectedDebt.amount || 0).toString())} className="flex-1 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-200">{t('common.all')}</button>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowPayDebtModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">{t('common.cancel')}</button>
              <button onClick={handlePayDebt} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium">{t('pos.payDebt')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Debt Modal */}
      {showEditDebtModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditDebtModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('debts.editDebt')}</h3>
              <button onClick={() => setShowEditDebtModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">{t('customers.customerName')}</p>
                <p className="font-medium text-gray-900">{selectedDebt.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('debts.debtAmount')}</label>
                <input type="number" value={editDebtForm.amount} onChange={(e) => setEditDebtForm({ ...editDebtForm, amount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('debts.dueDate')}</label>
                <input type="date" value={editDebtForm.dueDate} onChange={(e) => setEditDebtForm({ ...editDebtForm, dueDate: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.notes')}</label>
                <textarea value={editDebtForm.notes} onChange={(e) => setEditDebtForm({ ...editDebtForm, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowEditDebtModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">{t('common.cancel')}</button>
              <button onClick={() => { toast.success(t('common.saved')); setShowEditDebtModal(false); loadCashierDebts(); }} className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSearch(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">{t('pos.searchProduct')}</h2>
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Har bir o'zgarishda qidirish
                    if (e.target.value.trim()) {
                      handleSearch();
                    } else {
                      loadAllProducts();
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t('pos.searchProduct')}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button onClick={handleSearch} className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                  <Search className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">{searchQuery ? t('common.notFound') : t('products.noProducts')}</div>
                ) : (
                  searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => { addProductToCart(product); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                      className="w-full p-3 border border-gray-100 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 text-left"
                    >
                      <div className="font-medium text-gray-900">{convertToLanguage(product.name, language)}</div>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span className="font-mono">{product.barcode}</span>
                        <span className="font-bold text-emerald-600">{product.selling_price.toLocaleString()} {t('common.sum')}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{t('pos.inStock')}: {product.current_stock} {t('common.pcs')}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          totalAmount={totalAmount}
          cart={cart}
          customer={customer}
          cashierName={user?.fullName || t('cashiers.title')}
          cashierId={cashierId || selectedCashier?._id || user?.id}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); dispatch(clearCart()); toast.success(t('pos.saleCompleted')); }}
        />
      )}

      {/* Saved Receipts Modal */}
      {showSavedReceipts && (
        <SavedReceipts
          isOpen={showSavedReceipts}
          onClose={() => setShowSavedReceipts(false)}
        />
      )}
    </div>
  );
};

// ==================== PRINT RECEIPT FUNCTION ====================
interface ReceiptData {
  saleNumber: string;
  date: string;
  cashierName: string;
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  receivedAmount: number;
  change: number;
  customerName?: string;
  mixedPayment?: {
    cash: number;
    card: number;
    credit: number;
  };
}

const printReceipt = (data: ReceiptData) => {
  const { saleNumber, date, cashierName, items, totalAmount, paymentMethod, receivedAmount, change, customerName, mixedPayment } = data;

  const paymentMethodText = paymentMethod === 'cash' ? 'Naqd' :
    paymentMethod === 'card' ? 'Karta' :
      paymentMethod === 'mixed' ? 'Aralash' : "Bo'lib to'lash";

  const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Chek ${saleNumber}</title>
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
        .header p { font-size: 11px; color: #333; }
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
        .footer p { margin: 3px 0; }
        @media print {
          body { width: 80mm; }
          @page { size: 80mm auto; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SOTUV CHEKI</h1>
        <p>Do'kon nomi</p>
      </div>
      
      <div class="info">
        <div class="info-row"><span>Chek №:</span><span>${saleNumber}</span></div>
        <div class="info-row"><span>Sana:</span><span>${date}</span></div>
        <div class="info-row"><span>Kassir:</span><span>${cashierName}</span></div>
        ${customerName ? `<div class="info-row"><span>Mijoz:</span><span>${customerName}</span></div>` : ''}
      </div>
      
      <div class="items">
        ${items.map((item, idx) => `
          <div class="item">
            <div class="item-name">${idx + 1}. ${item.name}</div>
            <div class="item-details">
              <span>${item.quantity} x ${item.unitPrice.toLocaleString()}</span>
              <span>${(item.quantity * item.unitPrice).toLocaleString()} so'm</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="totals">
        <div class="total-row"><span>Mahsulotlar:</span><span>${items.length} ta</span></div>
        <div class="total-row main"><span>JAMI:</span><span>${totalAmount.toLocaleString()} so'm</span></div>
        <div class="total-row"><span>To'lov turi:</span><span>${paymentMethodText}</span></div>
        ${paymentMethod === 'cash' ? `
          <div class="total-row"><span>Qabul qilindi:</span><span>${receivedAmount.toLocaleString()} so'm</span></div>
          ${change > 0 ? `<div class="total-row"><span>Qaytim:</span><span>${change.toLocaleString()} so'm</span></div>` : ''}
        ` : ''}
        ${paymentMethod === 'mixed' && mixedPayment ? `
          <div class="total-row"><span>💵 Naqd:</span><span>${mixedPayment.cash.toLocaleString()} so'm</span></div>
          <div class="total-row"><span>💳 Karta:</span><span>${mixedPayment.card.toLocaleString()} so'm</span></div>
          <div class="total-row"><span>📅 Bo'lib to'lash:</span><span>${mixedPayment.credit.toLocaleString()} so'm</span></div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>Xaridingiz uchun rahmat!</p>
        <p>Yana keling!</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (printWindow) {
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  }
};

// ==================== PAYMENT MODAL ====================
interface PaymentModalProps {
  totalAmount: number;
  cart: any[];
  customer: any;
  cashierName: string;
  cashierId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomerOption {
  _id: string;
  fullName: string;
  phone?: string;
  currentDebt: number;
  debtLimit?: number;
}

interface InstallmentPlan {
  month: number;
  date: string;
  amount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ totalAmount, cart, customer, cashierName, cashierId, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit' | 'mixed'>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const received = parseFloat(receivedAmount) || 0;
  const change = received - totalAmount;

  // Dollar uchun
  const [usdRate, setUsdRate] = useState(DEFAULT_USD_RATE);
  const [receivedUsd, setReceivedUsd] = useState('');
  const [showUsdInput, setShowUsdInput] = useState(false);
  const receivedUsdAmount = parseFloat(receivedUsd) || 0;
  const receivedUsdInUzs = Math.round(receivedUsdAmount * usdRate);
  const totalReceivedWithUsd = received + receivedUsdInUzs;
  const changeWithUsd = totalReceivedWithUsd - totalAmount;

  // Kredit uchun
  const [creditMonths, setCreditMonths] = useState(3);
  const [initialPayment, setInitialPayment] = useState('');
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);

  // Aralash to'lov uchun
  const [mixedCashAmount, setMixedCashAmount] = useState('');
  const [mixedCardAmount, setMixedCardAmount] = useState('');
  const [mixedUsdAmount, setMixedUsdAmount] = useState('');
  const mixedCash = parseFloat(mixedCashAmount) || 0;
  const mixedCard = parseFloat(mixedCardAmount) || 0;
  const mixedUsd = parseFloat(mixedUsdAmount) || 0;
  const mixedUsdInUzs = Math.round(mixedUsd * usdRate);
  const mixedPaidTotal = mixedCash + mixedCard + mixedUsdInUzs;
  const mixedCreditAmount = totalAmount - mixedPaidTotal;

  // Mijozlar uchun (kredit)
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Yangi mijoz qo'shish uchun
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);

  // Dollar kursini yuklash
  useEffect(() => {
    const savedRate = localStorage.getItem('usdRate');
    if (savedRate) {
      setUsdRate(parseFloat(savedRate));
    }
  }, []);

  // Mijozlarni yuklash
  useEffect(() => {
    if (paymentMethod === 'credit' || paymentMethod === 'mixed') {
      loadCustomers();
    }
  }, [paymentMethod]);

  // Kredit rejasini hisoblash
  useEffect(() => {
    if (paymentMethod === 'credit') {
      const initial = parseFloat(initialPayment) || 0;
      const remaining = totalAmount - initial;
      if (remaining <= 0 || creditMonths <= 0) {
        setInstallmentPlans([]);
        return;
      }
      const monthlyPayment = Math.ceil(remaining / creditMonths);
      const plans: InstallmentPlan[] = [];
      const today = new Date();
      for (let i = 1; i <= creditMonths; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i);
        const amount = i === creditMonths ? remaining - (monthlyPayment * (creditMonths - 1)) : monthlyPayment;
        plans.push({ month: i, date: dueDate.toISOString().split('T')[0], amount });
      }
      setInstallmentPlans(plans);
    } else if (paymentMethod === 'mixed' && mixedCreditAmount > 0) {
      // Aralash to'lov uchun kredit rejasi
      const remaining = mixedCreditAmount;
      if (remaining <= 0 || creditMonths <= 0) {
        setInstallmentPlans([]);
        return;
      }
      const monthlyPayment = Math.ceil(remaining / creditMonths);
      const plans: InstallmentPlan[] = [];
      const today = new Date();
      for (let i = 1; i <= creditMonths; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(dueDate.getMonth() + i);
        const amount = i === creditMonths ? remaining - (monthlyPayment * (creditMonths - 1)) : monthlyPayment;
        plans.push({ month: i, date: dueDate.toISOString().split('T')[0], amount });
      }
      setInstallmentPlans(plans);
    }
  }, [creditMonths, initialPayment, totalAmount, paymentMethod, mixedCreditAmount]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const token = localStorage.getItem('accessToken');
      // Kassir faqat o'zi qo'shgan mijozlarni ko'radi
      const url = cashierId
        ? `/api/customers?createdBy=${cashierId}`
        : '/api/customers';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Load customers error:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Yangi mijoz qo'shish
  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error('Mijoz ismini kiriting');
      return;
    }
    if (!newCustomerPhone.trim()) {
      toast.error('Telefon raqamini kiriting');
      return;
    }
    if (!newCustomerAddress.trim()) {
      toast.error('Manzilni kiriting');
      return;
    }

    setAddingCustomer(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          address: newCustomerAddress.trim(),
          createdBy: cashierId,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Mijoz qo'shildi");
        // Yangi mijozni ro'yxatga qo'shish va tanlash
        const newCustomer = data.data;
        setCustomers(prev => [...prev, newCustomer]);
        setSelectedCustomerId(newCustomer._id);
        // Formani tozalash
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
        setShowAddCustomer(false);
      } else {
        toast.error(data.message || 'Xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Add customer error:', error);
      toast.error("Mijoz qo'shishda xatolik");
    } finally {
      setAddingCustomer(false);
    }
  };

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);
  const initialPay = parseFloat(initialPayment) || 0;
  const remainingCredit = totalAmount - initialPay;

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && totalReceivedWithUsd < totalAmount) {
      toast.error('Yetarli summa kiritilmagan');
      return;
    }

    if (paymentMethod === 'credit') {
      if (!selectedCustomerId) {
        toast.error('Mijozni tanlang');
        return;
      }
    }

    if (paymentMethod === 'credit' && remainingCredit <= 0) {
      toast.error("Bo'lib to'lash summasi noto'g'ri");
      return;
    }

    // Aralash to'lov validatsiyasi
    if (paymentMethod === 'mixed') {
      if (!selectedCustomerId) {
        toast.error("Bo'lib to'lash uchun mijozni tanlang");
        return;
      }
      if (mixedPaidTotal <= 0) {
        toast.error("Naqd yoki karta summasini kiriting");
        return;
      }
      if (mixedCreditAmount <= 0) {
        toast.error("Bo'lib to'lash summasi noto'g'ri. Naqd/karta bilan to'liq to'langan");
        return;
      }
    }

    setLoading(true);
    try {
      let notes = '';
      let payments: { method: string; amount: number; reference: string }[] = [];

      if (paymentMethod === 'credit') {
        notes = `Bo'lib to'lash: ${creditMonths} oy, Boshlang'ich: ${initialPay.toLocaleString()}, Oylik: ${installmentPlans[0]?.amount.toLocaleString()} so'm`;
        payments = [{ method: 'credit', amount: initialPay, reference: '' }];
      } else if (paymentMethod === 'mixed') {
        // Aralash to'lov
        notes = `Aralash to'lov: Naqd ${mixedCash.toLocaleString()}, Karta ${mixedCard.toLocaleString()}, Bo'lib to'lash ${mixedCreditAmount.toLocaleString()} (${creditMonths} oy)`;
        payments = [];
        if (mixedCash > 0) {
          payments.push({ method: 'cash', amount: mixedCash, reference: '' });
        }
        if (mixedCard > 0) {
          payments.push({ method: 'card', amount: mixedCard, reference: '' });
        }
      } else {
        payments = [{ method: paymentMethod, amount: totalAmount, reference: '' }];
      }

      const result = await apiService.createSale({
        customerId: (paymentMethod === 'credit' || paymentMethod === 'mixed') ? selectedCustomerId : (customer?.id || undefined),
        cashierId: cashierId,
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount || 0
        })),
        payments: payments,
        discountAmount: 0,
        notes: notes,
      });

      if (result.success) {
        // Bo'lib to'lash bo'lsa qarz qo'shish
        if (paymentMethod === 'credit' && selectedCustomerId) {
          try {
            const token = localStorage.getItem('accessToken');
            const debtAmount = remainingCredit;
            const debtNotes = `Bo'lib to'lash #${result.data?.saleNumber || ''} - ${creditMonths} oyga`;

            await fetch(`/api/customers/${selectedCustomerId}/add-debt`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                amount: debtAmount,
                dueDate: installmentPlans[installmentPlans.length - 1]?.date,
                notes: debtNotes,
                cashierId: cashierId,
                isCredit: true,
                creditMonths: creditMonths,
              }),
            });
          } catch (e) {
            console.error('Add debt error:', e);
          }
        }

        // Aralash to'lov bo'lsa qarz qo'shish
        if (paymentMethod === 'mixed' && selectedCustomerId && mixedCreditAmount > 0) {
          try {
            const token = localStorage.getItem('accessToken');
            const debtNotes = `Aralash to'lov #${result.data?.saleNumber || ''} - Bo'lib to'lash qismi ${creditMonths} oyga`;

            await fetch(`/api/customers/${selectedCustomerId}/add-debt`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                amount: mixedCreditAmount,
                dueDate: installmentPlans[installmentPlans.length - 1]?.date,
                notes: debtNotes,
                cashierId: cashierId,
                isCredit: true,
                creditMonths: creditMonths,
              }),
            });
          } catch (e) {
            console.error('Add mixed debt error:', e);
          }
        }

        // Chek chiqarish
        printReceipt({
          saleNumber: result.data?.saleNumber || `#${Date.now()}`,
          date: new Date().toLocaleString('uz-UZ'),
          cashierName: cashierName,
          items: cart,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          receivedAmount: paymentMethod === 'cash' ? received : (paymentMethod === 'mixed' ? mixedPaidTotal : totalAmount),
          change: paymentMethod === 'cash' ? change : 0,
          customerName: (paymentMethod === 'credit' || paymentMethod === 'mixed') ? selectedCustomer?.fullName : undefined,
          mixedPayment: paymentMethod === 'mixed' ? {
            cash: mixedCash,
            card: mixedCard,
            credit: mixedCreditAmount,
          } : undefined,
        });

        if (result.data?.offline) {
          toast.success("Sotuv offline saqlandi");
        }
        onSuccess();
      } else {
        toast.error(result.message || 'Xatolik');
      }
    } catch {
      toast.error("To'lovda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { id: 'cash', label: 'Naqd', color: 'bg-emerald-500', icon: '💵' },
    { id: 'card', label: 'Karta', color: 'bg-blue-500', icon: '💳' },
    { id: 'credit', label: "Bo'lib to'lash", color: 'bg-orange-500', icon: '📅' },
    { id: 'mixed', label: 'Aralash', color: 'bg-purple-500', icon: '🔀' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-gray-900">To'lov</h2>
            <p className="text-xs text-gray-500">Kassir: {cashierName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">
          <div className="text-center mb-6 p-5 bg-emerald-50 rounded-2xl">
            <div className="text-sm text-emerald-600 font-medium mb-1">Jami summa</div>
            <div className="text-4xl font-bold text-emerald-700">{totalAmount.toLocaleString()} <span className="text-lg">so'm</span></div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id as any)}
                className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1 ${paymentMethod === m.id
                  ? `${m.color} text-white shadow-lg`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <span className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Naqd to'lov */}
          {paymentMethod === 'cash' && (
            <>
              <div className="mb-4">
                <label className="label">Qabul qilingan summa (so'm)</label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="0"
                  className="input text-xl text-center"
                  autoFocus
                />
              </div>

              {/* Dollar kiritish */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Dollar ($)</label>
                  <button
                    type="button"
                    onClick={() => setShowUsdInput(!showUsdInput)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <DollarSign className="w-3 h-3" />
                    {showUsdInput ? 'Yopish' : 'Dollar qo\'shish'}
                  </button>
                </div>

                {showUsdInput && (
                  <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={receivedUsd}
                        onChange={(e) => setReceivedUsd(e.target.value)}
                        placeholder="0"
                        className="input text-center flex-1"
                      />
                      <div className="flex items-center gap-1 px-3 bg-white rounded-lg border border-blue-200">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">USD</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Kurs: 1$ = {usdRate.toLocaleString()} so'm</span>
                      <input
                        type="number"
                        value={usdRate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value) || DEFAULT_USD_RATE;
                          setUsdRate(rate);
                          localStorage.setItem('usdRate', rate.toString());
                        }}
                        className="w-24 px-2 py-1 text-center text-xs border border-gray-200 rounded"
                      />
                    </div>
                    {receivedUsdAmount > 0 && (
                      <div className="text-center text-sm text-blue-700 font-medium">
                        ${receivedUsdAmount} = {receivedUsdInUzs.toLocaleString()} so'm
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Qaytim */}
              {(changeWithUsd > 0 || (totalReceivedWithUsd > 0 && totalReceivedWithUsd >= totalAmount)) && (
                <div className="mb-4 text-center p-3 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">
                    Jami qabul qilindi: {totalReceivedWithUsd.toLocaleString()} so'm
                    {receivedUsdAmount > 0 && <span className="text-blue-600"> (${receivedUsdAmount} + {received.toLocaleString()})</span>}
                  </div>
                  {changeWithUsd > 0 && (
                    <div>
                      <span className="text-gray-600">Qaytim: </span>
                      <span className="font-bold text-emerald-600 text-lg">{changeWithUsd.toLocaleString()} so'm</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 mb-6">
                {[10000, 50000, 100000, totalAmount].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setReceivedAmount(amt.toString())}
                    className="py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    {amt === totalAmount ? 'Aniq' : `${amt / 1000}K`}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Bo'lib to'lash */}
          {paymentMethod === 'credit' && (
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-700 font-medium flex items-center gap-2">
                  <span>📅</span>
                  Bo'lib to'lash - oyma-oy to'lash
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Mijozni tanlang *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Yangi mijoz
                  </button>
                </div>

                {/* Yangi mijoz qo'shish formasi */}
                {showAddCustomer && (
                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Mijoz ismi *"
                      className="input text-sm"
                      autoFocus
                    />
                    <input
                      type="tel"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Telefon raqami *"
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Manzil *"
                      className="input text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCustomer(false);
                          setNewCustomerName('');
                          setNewCustomerPhone('');
                          setNewCustomerAddress('');
                        }}
                        className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Bekor
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        disabled={addingCustomer || !newCustomerName.trim() || !newCustomerPhone.trim() || !newCustomerAddress.trim()}
                        className="flex-1 py-2 text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {addingCustomer ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Qo'shish
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {loadingCustomers ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="input">
                    <option value="">Mijozni tanlang...</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.fullName} {c.phone && `(${c.phone})`}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="label">Boshlang'ich to'lov (ixtiyoriy)</label>
                <input type="number" value={initialPayment} onChange={(e) => setInitialPayment(e.target.value)} placeholder="0" className="input" />
              </div>

              <div>
                <label className="label">Necha oyga?</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <button key={m} onClick={() => setCreditMonths(m)} className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${creditMonths === m ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCustomerId && remainingCredit > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jami summa:</span>
                    <span className="font-semibold">{totalAmount.toLocaleString()} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Boshlang'ich to'lov:</span>
                    <span className="font-semibold text-emerald-600">-{initialPay.toLocaleString()} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Qoldiq (bo'lib to'lash):</span>
                    <span className="font-bold text-orange-600">{remainingCredit.toLocaleString()} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Oylik to'lov:</span>
                    <span className="font-bold text-orange-600">~{installmentPlans[0]?.amount.toLocaleString()} so'm</span>
                  </div>
                </div>
              )}

              {installmentPlans.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">To'lov jadvali</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {installmentPlans.map((plan, idx) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-xs">{plan.month}</div>
                          <span className="text-sm text-gray-600">{new Date(plan.date).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{plan.amount.toLocaleString()} so'm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aralash to'lov (Naqd + Karta + Bo'lib to'lash) */}
          {paymentMethod === 'mixed' && (
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                  <span>🔀</span>
                  Aralash to'lov - bir qismini to'lab, qolganini bo'lib to'lash
                </p>
              </div>

              {/* Naqd summa */}
              <div>
                <label className="label">💵 Naqd summa (so'm)</label>
                <input
                  type="number"
                  value={mixedCashAmount}
                  onChange={(e) => setMixedCashAmount(e.target.value)}
                  placeholder="0"
                  className="input"
                />
              </div>

              {/* Karta summa */}
              <div>
                <label className="label">💳 Karta summa</label>
                <input
                  type="number"
                  value={mixedCardAmount}
                  onChange={(e) => setMixedCardAmount(e.target.value)}
                  placeholder="0"
                  className="input"
                />
              </div>

              {/* Dollar summa */}
              <div>
                <label className="label">💵 Dollar ($)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={mixedUsdAmount}
                    onChange={(e) => setMixedUsdAmount(e.target.value)}
                    placeholder="0"
                    className="input flex-1"
                  />
                  <div className="flex items-center gap-1 px-3 bg-blue-50 rounded-lg border border-blue-200">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                {mixedUsd > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    ${mixedUsd} = {mixedUsdInUzs.toLocaleString()} so'm (kurs: {usdRate.toLocaleString()})
                  </p>
                )}
              </div>

              {/* Tez summa tugmalari */}
              <div className="grid grid-cols-4 gap-2">
                {[10000, 50000, 100000, Math.floor(totalAmount / 2)].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setMixedCashAmount(amt.toString())}
                    className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    {amt === Math.floor(totalAmount / 2) ? '50%' : `${amt / 1000}K`}
                  </button>
                ))}
              </div>

              {/* Mijoz tanlash (bo'lib to'lash uchun) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Mijozni tanlang (bo'lib to'lash uchun) *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Yangi mijoz
                  </button>
                </div>

                {/* Yangi mijoz qo'shish formasi */}
                {showAddCustomer && (
                  <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Mijoz ismi *"
                      className="input text-sm"
                      autoFocus
                    />
                    <input
                      type="tel"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Telefon raqami *"
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Manzil *"
                      className="input text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCustomer(false);
                          setNewCustomerName('');
                          setNewCustomerPhone('');
                          setNewCustomerAddress('');
                        }}
                        className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Bekor
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        disabled={addingCustomer || !newCustomerName.trim() || !newCustomerPhone.trim() || !newCustomerAddress.trim()}
                        className="flex-1 py-2 text-sm text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {addingCustomer ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            Qo'shish
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {loadingCustomers ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="input">
                    <option value="">Mijozni tanlang...</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.fullName} {c.phone && `(${c.phone})`}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bo'lib to'lash muddati */}
              {mixedCreditAmount > 0 && (
                <div>
                  <label className="label">Bo'lib to'lash muddati (oy)</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <button key={m} onClick={() => setCreditMonths(m)} className={`py-2.5 rounded-lg font-semibold text-sm transition-all ${creditMonths === m ? 'bg-purple-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hisob-kitob */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Jami summa:</span>
                  <span className="font-semibold">{totalAmount.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">💵 Naqd:</span>
                  <span className="font-semibold text-emerald-600">{mixedCash.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">💳 Karta:</span>
                  <span className="font-semibold text-blue-600">{mixedCard.toLocaleString()} so'm</span>
                </div>
                {mixedUsd > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">💵 Dollar:</span>
                    <span className="font-semibold text-blue-600">${mixedUsd} ({mixedUsdInUzs.toLocaleString()} so'm)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-500">To'langan:</span>
                  <span className="font-bold text-emerald-600">{mixedPaidTotal.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">📅 Bo'lib to'lash qoldig'i:</span>
                  <span className={`font-bold ${mixedCreditAmount > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                    {mixedCreditAmount > 0 ? mixedCreditAmount.toLocaleString() : 0} so'm
                  </span>
                </div>
                {mixedCreditAmount > 0 && installmentPlans.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Oylik to'lov:</span>
                    <span className="font-bold text-purple-600">~{installmentPlans[0]?.amount.toLocaleString()} so'm</span>
                  </div>
                )}
              </div>

              {/* Bo'lib to'lash jadvali */}
              {mixedCreditAmount > 0 && installmentPlans.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-purple-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-purple-700">Bo'lib to'lash jadvali</p>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {installmentPlans.map((plan, idx) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs">{plan.month}</div>
                          <span className="text-sm text-gray-600">{new Date(plan.date).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{plan.amount.toLocaleString()} so'm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* To'lov tugmasi */}
          <button
            onClick={handlePayment}
            disabled={
              loading ||
              (paymentMethod === 'cash' && totalReceivedWithUsd < totalAmount) ||
              (paymentMethod === 'credit' && !selectedCustomerId) ||
              (paymentMethod === 'credit' && remainingCredit <= 0) ||
              (paymentMethod === 'mixed' && !selectedCustomerId) ||
              (paymentMethod === 'mixed' && mixedPaidTotal <= 0) ||
              (paymentMethod === 'mixed' && mixedCreditAmount <= 0)
            }
            className={`btn btn-lg w-full ${paymentMethod === 'credit' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
              paymentMethod === 'mixed' ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                'btn-primary'
              }`}
          >
            {loading ? (
              <div className="spinner spinner-sm spinner-white" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                {paymentMethod === 'credit' ? "Bo'lib to'lashga rasmiylashtirish" :
                  paymentMethod === 'mixed' ? 'Aralash to\'lovni tasdiqlash' :
                    'Tasdiqlash'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== ADD DEBT MODAL ====================
interface AddDebtModalProps {
  customers: any[];
  cashierId: string;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string) => string;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({ customers, cashierId, onClose, onSuccess, t }) => {
  const [debtType, setDebtType] = useState<'debt' | 'credit'>('debt');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Kredit uchun
  const [creditMonths, setCreditMonths] = useState(1);
  const [initialPayment, setInitialPayment] = useState('');

  const totalAmount = parseFloat(amount) || 0;
  const initialPay = parseFloat(initialPayment) || 0;
  const remainingCredit = totalAmount - initialPay;
  const monthlyPayment = remainingCredit > 0 && creditMonths > 0 ? Math.ceil(remainingCredit / creditMonths) : 0;

  // Kredit jadvali
  const getInstallmentPlans = () => {
    if (remainingCredit <= 0 || creditMonths <= 0) return [];
    const plans = [];
    const today = new Date();
    for (let i = 1; i <= creditMonths; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i);
      const amt = i === creditMonths ? remainingCredit - (monthlyPayment * (creditMonths - 1)) : monthlyPayment;
      plans.push({ month: i, date: dueDate.toISOString().split('T')[0], amount: amt });
    }
    return plans;
  };

  const handleSubmit = async () => {
    if (!selectedCustomerId || !amount) {
      toast.error(t('pos.fillRequired'));
      return;
    }

    if (debtType === 'credit' && remainingCredit <= 0) {
      toast.error(t('errors.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const installmentPlans = getInstallmentPlans();
      const debtAmount = debtType === 'credit' ? remainingCredit : totalAmount;
      const debtNotes = debtType === 'credit'
        ? `Bo'lib to'lash: ${creditMonths} oy, Boshlang'ich: ${initialPay.toLocaleString()}, Oylik: ${monthlyPayment.toLocaleString()} so'm`
        : notes;
      const finalDueDate = debtType === 'credit' && installmentPlans.length > 0
        ? installmentPlans[installmentPlans.length - 1].date
        : dueDate;

      const response = await fetch(`/api/customers/${selectedCustomerId}/add-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: debtAmount,
          dueDate: finalDueDate || undefined,
          notes: debtNotes,
          cashierId: cashierId,
          isCredit: debtType === 'credit',
          creditMonths: debtType === 'credit' ? creditMonths : undefined,
          initialPayment: debtType === 'credit' ? initialPay : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        toast.error(data.message || t('errors.somethingWentWrong'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900">{debtType === 'credit' ? t('pos.addCredit') : t('pos.addDebt')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Debt Type Switcher */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setDebtType('debt')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${debtType === 'debt' ? 'bg-red-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
              {t('pos.simpleDebt')}
            </button>
            <button onClick={() => setDebtType('credit')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${debtType === 'credit' ? 'bg-orange-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
              {t('pos.credit')}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Mijoz tanlash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pos.selectCustomer')} *</label>
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500">
              <option value="">{t('pos.selectCustomer')}...</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.fullName} {c.phone && `(${c.phone})`}</option>
              ))}
            </select>
          </div>

          {/* Summa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.amount')} *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500" />
          </div>

          {/* Oddiy qarz uchun */}
          {debtType === 'debt' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pos.dueDate')}</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('pos.debtNotes')} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 resize-none" />
              </div>
            </>
          )}

          {/* Kredit uchun */}
          {debtType === 'credit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pos.initialPayment')}</label>
                <input type="number" value={initialPayment} onChange={(e) => setInitialPayment(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pos.creditMonths')}</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <button key={m} onClick={() => setCreditMonths(m)} className={`py-2 rounded-lg text-sm font-semibold transition-all ${creditMonths === m ? 'bg-orange-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kredit hisob-kitobi */}
              {selectedCustomerId && totalAmount > 0 && (
                <div className="p-4 bg-orange-50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('common.total')}:</span>
                    <span className="font-semibold">{totalAmount.toLocaleString()} {t('common.sum')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('pos.initialPayment')}:</span>
                    <span className="font-semibold text-emerald-600">-{initialPay.toLocaleString()} {t('common.sum')}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-orange-200">
                    <span className="text-gray-500">{t('pos.creditAmount')}:</span>
                    <span className="font-bold text-orange-600">{remainingCredit.toLocaleString()} {t('common.sum')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('pos.monthlyPayment')}:</span>
                    <span className="font-bold text-orange-600">~{monthlyPayment.toLocaleString()} {t('common.sum')}</span>
                  </div>
                </div>
              )}

              {/* To'lov jadvali */}
              {getInstallmentPlans().length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">{t('pos.paymentSchedule')}</p>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {getInstallmentPlans().map((plan, idx) => (
                      <div key={idx} className="flex justify-between items-center px-3 py-2 border-b border-gray-100 last:border-0 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-xs">{plan.month}</span>
                          <span className="text-gray-600">{new Date(plan.date).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{plan.amount.toLocaleString()} {t('common.sum')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">{t('common.cancel')}</button>
            <button onClick={handleSubmit} disabled={loading || !selectedCustomerId || !amount || (debtType === 'credit' && remainingCredit <= 0)} className={`flex-1 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${debtType === 'credit' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600'}`}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PRODUCTS TAB ====================
interface ProductsTabProps {
  t: (key: string) => string;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ t }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    current_stock: '',
    minimum_stock: '5',
  });
  const [saving, setSaving] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<any>(null);
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const mappedProducts = (data.data || []).map((p: any) => ({
          ...p,
          _id: p._id || p.id,
          selling_price: p.sellingPrice || p.selling_price || 0,
          current_stock: p.currentStock || p.current_stock || 0,
          cost_price: p.purchasePrice || p.cost_price || 0,
          minimum_stock: p.minimumStock || p.minimum_stock || 5,
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  const resetForm = () => setForm({
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    current_stock: '',
    minimum_stock: '5',
  });

  const generateBarcode = () => {
    const barcode = Date.now().toString();
    setForm({ ...form, barcode });
    toast.success('Shtrix-kod yaratildi');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Kategoriya nomini kiriting');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Kategoriya qo\'shildi');
        setNewCategoryName('');
        setShowAddCategoryInput(false);
        loadCategories();
        if (data.data?._id) {
          setForm({ ...form, category_id: data.data._id });
        }
      } else {
        toast.error(data.message || 'Xatolik');
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleAddProduct = async () => {
    if (!form.name || !form.selling_price) {
      toast.error(t('errors.requiredField'));
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const barcodeToUse = form.barcode || Date.now().toString();
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          barcode: barcodeToUse,
          name: form.name,
          description: form.description || undefined,
          categoryId: form.category_id || undefined,
          purchasePrice: parseFloat(form.cost_price) || 0,
          sellingPrice: parseFloat(form.selling_price),
          currentStock: parseInt(form.current_stock) || 0,
          minimumStock: parseInt(form.minimum_stock) || 5,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('products.productSaved'));
        setShowAddModal(false);
        resetForm();
        loadProducts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !form.name || !form.selling_price) {
      toast.error(t('errors.requiredField'));
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/products/${editingProduct._id || editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          barcode: form.barcode,
          name: form.name,
          description: form.description,
          categoryId: form.category_id || undefined,
          purchasePrice: parseFloat(form.cost_price) || 0,
          sellingPrice: parseFloat(form.selling_price),
          currentStock: parseInt(form.current_stock) || 0,
          minimumStock: parseInt(form.minimum_stock) || 5,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('products.productSaved'));
        setShowEditModal(false);
        setEditingProduct(null);
        resetForm();
        loadProducts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (!window.confirm(`${product.name} - ${t('confirmations.deleteItem')}`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/products/${product._id || product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('products.productDeleted'));
        loadProducts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setForm({
      barcode: product.barcode || '',
      name: product.name || '',
      description: product.description || '',
      category_id: product.categoryId?._id || '',
      cost_price: (product.cost_price || product.purchasePrice || 0).toString(),
      selling_price: (product.selling_price || product.sellingPrice || 0).toString(),
      current_stock: (product.current_stock || product.currentStock || 0).toString(),
      minimum_stock: (product.minimum_stock || product.minimumStock || 5).toString(),
    });
    setShowEditModal(true);
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery)
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{t('nav.products')}</h2>
            <p className="text-sm text-gray-500">{products.length} {t('nav.products').toLowerCase()}</p>
          </div>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors">
            <Plus className="w-4 h-4" />
            {t('products.addProduct')}
          </button>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('pos.searchProduct')} className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-cyan-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">{t('common.notFound')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t('products.barcode')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t('products.title')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t('common.price')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t('nav.inventory')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product._id || product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm text-gray-500 whitespace-nowrap">{product.barcode || '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    <span className="truncate block max-w-[200px]">{product.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-semibold whitespace-nowrap">{(product.selling_price || 0).toLocaleString()} {t('common.sum')}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.current_stock > 10 ? 'bg-emerald-100 text-emerald-700' : product.current_stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {product.current_stock || 0} {t('common.pcs')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setSelectedProductForBarcode(product); setShowBarcodeModal(true); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Shtrix kod">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('common.edit')}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t('common.delete')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">{t('products.addProduct')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Kategoriya */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Kategoriya</label>
                  {form.category_id && (
                    <button type="button" onClick={() => setForm({ ...form, category_id: '' })} className="text-xs text-red-500 hover:text-red-600 font-medium">Tozalash</button>
                  )}
                </div>
                {form.category_id && (
                  <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-sm text-gray-600">Tanlangan: </span>
                    <span className="text-sm font-semibold text-emerald-700">{categories.find(c => c._id === form.category_id)?.name || '—'}</span>
                  </div>
                )}
                <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Kategoriyalar yo'q</p>
                  ) : (
                    categories.map((cat) => (
                      <div
                        key={cat._id}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${form.category_id === cat._id ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                        onClick={() => setForm({ ...form, category_id: cat._id })}
                      >
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                    ))
                  )}
                </div>
                {showAddCategoryInput ? (
                  <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm" placeholder="Kategoriya nomi..." autoFocus />
                    <button type="button" onClick={handleAddCategory} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium"><Check className="w-4 h-4" /></button>
                    <button type="button" onClick={() => { setShowAddCategoryInput(false); setNewCategoryName(''); }} className="px-4 py-2.5 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddCategoryInput(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                    <Plus className="w-4 h-4" /> Kategoriya yaratish
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('products.productName')} *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder={t('products.productName')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none" rows={2} placeholder="Qo'shimcha ma'lumot..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shtrix-kod</label>
                <div className="flex gap-2">
                  <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="Avtomatik yoki kiriting" readOnly />
                  <button type="button" onClick={generateBarcode} className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors" title="Kod yaratish">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
                {form.barcode && <p className="mt-2 text-sm text-gray-500">Kod: {form.barcode}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tan narxi</label>
                  <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sotish narxi *</label>
                  <input type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Qoldiq</label>
                  <input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Min. qoldiq</label>
                  <input type="number" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="5" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200">Bekor qilish</button>
              <button onClick={handleAddProduct} disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">Mahsulotni tahrirlash</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/20 rounded-xl"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Kategoriya */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Kategoriya</label>
                  {form.category_id && (
                    <button type="button" onClick={() => setForm({ ...form, category_id: '' })} className="text-xs text-red-500 hover:text-red-600 font-medium">Tozalash</button>
                  )}
                </div>
                {form.category_id && (
                  <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-sm text-gray-600">Tanlangan: </span>
                    <span className="text-sm font-semibold text-emerald-700">{categories.find(c => c._id === form.category_id)?.name || '—'}</span>
                  </div>
                )}
                <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Kategoriyalar yo'q</p>
                  ) : (
                    categories.map((cat) => (
                      <div
                        key={cat._id}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${form.category_id === cat._id ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                        onClick={() => setForm({ ...form, category_id: cat._id })}
                      >
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                    ))
                  )}
                </div>
                {showAddCategoryInput ? (
                  <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm" placeholder="Kategoriya nomi..." autoFocus />
                    <button type="button" onClick={handleAddCategory} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium"><Check className="w-4 h-4" /></button>
                    <button type="button" onClick={() => { setShowAddCategoryInput(false); setNewCategoryName(''); }} className="px-4 py-2.5 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddCategoryInput(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                    <Plus className="w-4 h-4" /> Kategoriya yaratish
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('products.productName')} *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder={t('products.productName')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none" rows={2} placeholder="Qo'shimcha ma'lumot..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shtrix-kod</label>
                <div className="flex gap-2">
                  <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="Avtomatik yoki kiriting" readOnly />
                  <button type="button" onClick={generateBarcode} className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors" title="Kod yaratish">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
                {form.barcode && <p className="mt-2 text-sm text-gray-500">Kod: {form.barcode}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tan narxi</label>
                  <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sotish narxi *</label>
                  <input type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Qoldiq</label>
                  <input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Min. qoldiq</label>
                  <input type="number" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" placeholder="5" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200">Bekor qilish</button>
              <button onClick={handleEditProduct} disabled={saving} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {showBarcodeModal && selectedProductForBarcode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBarcodeModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex justify-between items-center bg-gradient-to-r from-purple-500 to-indigo-600">
              <h3 className="text-lg font-semibold text-white">Shtrix kod</h3>
              <button onClick={() => setShowBarcodeModal(false)} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <p className="text-lg font-semibold text-gray-900 mb-2">{selectedProductForBarcode.name}</p>
              <p className="text-sm text-gray-500 mb-4">{(selectedProductForBarcode.selling_price || 0).toLocaleString()} {t('common.sum')}</p>
              <div id="pos-barcode-container" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <Barcode
                  value={selectedProductForBarcode.barcode || selectedProductForBarcode._id || selectedProductForBarcode.id}
                  width={2}
                  height={60}
                  fontSize={14}
                  margin={5}
                  displayValue={true}
                />
              </div>
            </div>
            <div className="p-5 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-medium border border-gray-200"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  const barcodeEl = document.getElementById('pos-barcode-container');
                  if (!barcodeEl) {
                    toast.error('Barkod topilmadi');
                    return;
                  }

                  const svgElement = barcodeEl.querySelector('svg');
                  if (!svgElement) {
                    toast.error('SVG topilmadi');
                    return;
                  }

                  // Yangi oyna ochib chop etish
                  const printWindow = window.open('', '_blank', 'width=220,height=110');
                  if (!printWindow) {
                    toast.error('Popup bloklangan. Ruxsat bering.');
                    return;
                  }

                  const svgClone = svgElement.cloneNode(true) as SVGElement;
                  const productName = selectedProductForBarcode.name || '';
                  const productPrice = Number(selectedProductForBarcode.selling_price || 0).toLocaleString('uz-UZ');

                  // 58mm x 29mm yorliq
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Shtrix kod</title>
                      <style>
                        @page {
                          size: 58mm 29mm;
                          margin: 0;
                        }
                        * {
                          margin: 0;
                          padding: 0;
                          box-sizing: border-box;
                        }
                        html, body {
                          width: 58mm;
                          height: 29mm;
                          overflow: hidden;
                          background: white;
                          font-family: Arial, sans-serif;
                        }
                        .label {
                          width: 58mm;
                          height: 29mm;
                          padding: 1mm 1.5mm;
                          background: white;
                        }
                        .header {
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          height: 4mm;
                        }
                        .name {
                          font-size: 7pt;
                          font-weight: bold;
                          max-width: 36mm;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: nowrap;
                        }
                        .price {
                          font-size: 8pt;
                          font-weight: bold;
                        }
                        .barcode-wrapper {
                          text-align: center;
                          height: 23mm;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        }
                        .barcode-wrapper svg {
                          width: 55mm;
                          height: 22mm;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="label">
                        <div class="header">
                          <span class="name">${productName}</span>
                          <span class="price">${productPrice}</span>
                        </div>
                        <div class="barcode-wrapper">${svgClone.outerHTML}</div>
                      </div>
                    </body>
                    </html>
                  `);

                  printWindow.document.close();

                  setTimeout(() => {
                    printWindow.print();
                    setTimeout(() => printWindow.close(), 1000);
                  }, 500);
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Chop etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CUSTOMERS TAB ====================
interface CustomersTabProps {
  t: (key: string) => string;
  cashierId?: string;
}

const CustomersTab: React.FC<CustomersTabProps> = ({ t, cashierId }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [cashierId]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const url = cashierId
        ? `/api/customers?createdBy=${cashierId}`
        : '/api/customers';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('Load customers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm({ fullName: '', phone: '', address: '' });

  const handleAddCustomer = async () => {
    if (!form.fullName) {
      toast.error(t('errors.requiredField'));
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          createdBy: cashierId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('customers.customerSaved'));
        setShowAddModal(false);
        resetForm();
        loadCustomers();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer || !form.fullName) {
      toast.error(t('errors.requiredField'));
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: form.fullName, phone: form.phone, address: form.address }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('customers.customerSaved'));
        setShowEditModal(false);
        setEditingCustomer(null);
        resetForm();
        loadCustomers();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (customer: any) => {
    if (!window.confirm(`${customer.fullName} - ${t('confirmations.deleteItem')}`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${customer._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('customers.customerDeleted'));
        loadCustomers();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const openEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setForm({ fullName: customer.fullName || '', phone: customer.phone || '', address: customer.address || '' });
    setShowEditModal(true);
  };

  const filteredCustomers = customers.filter((c) =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery)
  );

  const totalDebt = customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{t('nav.customers')}</h2>
            <p className="text-sm text-gray-500">{customers.length} {t('nav.customers').toLowerCase()} • {t('debts.totalDebt')}: {totalDebt.toLocaleString()} {t('common.sum')}</p>
          </div>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
            <Plus className="w-4 h-4" />
            {t('customers.addCustomer')}
          </button>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('customers.searchCustomers')} className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">{t('customers.noCustomers')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('customers.customerName')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('customers.phone')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('customers.debt')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{customer.fullName?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.fullName}</p>
                        {customer.address && <p className="text-xs text-gray-500">{customer.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{customer.phone || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${customer.currentDebt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {(customer.currentDebt || 0).toLocaleString()} {t('common.sum')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditModal(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('common.edit')}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteCustomer(customer)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t('common.delete')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600">
              <h3 className="text-lg font-semibold text-white">{t('customers.addCustomer')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.customerName')} *</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder={t('customers.customerName')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.phone')}</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="+998901234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.address')}</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder={t('customers.address')} />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">{t('common.cancel')}</button>
              <button onClick={handleAddCustomer} disabled={saving} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('customers.editCustomer')}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.customerName')} *</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.phone')}</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.address')}</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium">{t('common.cancel')}</button>
              <button onClick={handleEditCustomer} disabled={saving} className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
