import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Hash,
  DollarSign,
  Box,
  Tag,
  TrendingUp,
  AlertTriangle,
  Camera,
  RefreshCw,
  Check,
  Printer,
  QrCode,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';
import ProductScanner from '../components/POS/ProductScanner';
import { type GS1ParseResult, expiryToISO } from '../utils/scanner';

interface Product {
  _id: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: {
    _id: string;
    name: string;
  };
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  unit: string;
}

interface Category {
  _id: string;
  name: string;
}

const Products: React.FC = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'add' | 'edit'>('add');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // Category management
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Barcode print modal
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);

  // Currency exchange rate
  const [usdRate, setUsdRate] = useState(12500); // Default 1 USD = 12500 UZS
  const [rateLoading, setRateLoading] = useState(false);

  // CBU API'dan valyuta kursini olish
  const fetchExchangeRate = async () => {
    setRateLoading(true);
    try {
      const response = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
      const data = await response.json();
      // USD kursini topish
      const usdCurrency = data.find((item: any) => item.Ccy === 'USD');
      if (usdCurrency) {
        const rate = parseFloat(usdCurrency.Rate);
        setUsdRate(Math.round(rate));
        console.log('💱 CBU kurs yangilandi:', rate);
      }
    } catch (error) {
      console.error('Valyuta kursini olishda xatolik:', error);
      // Xatolik bo'lsa default qiymat qoladi
    } finally {
      setRateLoading(false);
    }
  };

  // Skaner-pistolet uchun ref va state
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const scannerBufferRef = useRef<string>('');
  const scannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    cost_price_usd: '',
    cost_price_uzs: '',
    selling_price_usd: '',
    selling_price_uzs: '',
    current_stock: '',
    minimum_stock: '5',
    unit: 'dona',
  });

  // Skaner-pistolet bilan skanerlash (barcode input uchun)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter bosilganda - skanerlash tugadi
    if (e.key === 'Enter') {
      e.preventDefault();
      const barcode = form.barcode.trim();
      if (barcode.length >= 3) {
        // Ovoz chiqarish
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 1800;
          osc.type = 'sine';
          gain.gain.value = 0.3;
          osc.start();
          setTimeout(() => { osc.stop(); ctx.close(); }, 100);
        } catch {}
        
        toast.success(`Shtrix-kod: ${barcode}`, { duration: 2000 });
      }
    }
  };

  // Handle USD price change - auto calculate UZS
  const handleCostPriceUsdChange = (value: string) => {
    const usdValue = parseFloat(value) || 0;
    setForm({
      ...form,
      cost_price_usd: value,
      cost_price_uzs: usdValue ? Math.round(usdValue * usdRate).toString() : '',
    });
  };

  // Handle UZS price change - auto calculate USD
  const handleCostPriceUzsChange = (value: string) => {
    const uzsValue = parseFloat(value) || 0;
    setForm({
      ...form,
      cost_price_uzs: value,
      cost_price_usd: uzsValue ? (uzsValue / usdRate).toFixed(2) : '',
    });
  };

  // Handle selling USD price change - auto calculate UZS
  const handleSellingPriceUsdChange = (value: string) => {
    const usdValue = parseFloat(value) || 0;
    setForm({
      ...form,
      selling_price_usd: value,
      selling_price_uzs: usdValue ? Math.round(usdValue * usdRate).toString() : '',
    });
  };

  // Handle selling UZS price change - auto calculate USD
  const handleSellingPriceUzsChange = (value: string) => {
    const uzsValue = parseFloat(value) || 0;
    setForm({
      ...form,
      selling_price_uzs: value,
      selling_price_usd: uzsValue ? (uzsValue / usdRate).toFixed(2) : '',
    });
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    fetchExchangeRate(); // CBU'dan valyuta kursini olish
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
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Load products error:', error);
      toast.error(t('errors.loadError'));
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

  // Добавить категорию
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Kategoriya nomini kiriting');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Kategoriya qo\'shildi');
        setNewCategoryName('');
        setShowAddCategoryInput(false);
        loadCategories();
        // Автоматически выбираем новую категорию
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

  // Редактировать категорию
  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Kategoriya yangilandi');
        setShowEditCategoryModal(false);
        setEditingCategory(null);
        setNewCategoryName('');
        loadCategories();
      } else {
        toast.error(data.message || 'Xatolik');
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  // Удалить категорию
  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Kategoriyani o\'chirmoqchimisiz?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Kategoriya o\'chirildi');
        if (form.category_id === categoryId) {
          setForm({ ...form, category_id: '' });
        }
        loadCategories();
      } else {
        toast.error(data.message || 'Xatolik');
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  // Генерация штрих-кода
  const generateBarcode = () => {
    const barcode = Date.now().toString();
    setForm({ ...form, barcode });
    toast.success('Штрих-код сгенерирован');
  };

  // Открыть сканер для добавления
  const openBarcodeScanner = (target: 'add' | 'edit') => {
    setScannerTarget(target);
    setShowBarcodeScanner(true);
  };

  // Skanerlash natijasini qayta ishlash
  const handleScanComplete = (data: GS1ParseResult) => {
    // Faqat raqamlarni olish (agar mavjud bo'lsa)
    const rawCode = data.raw || '';
    const numericCode = rawCode.replace(/\D/g, ''); // Faqat raqamlar
    
    // Agar GTIN mavjud bo'lsa - uni ishlatamiz, aks holda raw kodni
    let barcode = data.gtin || numericCode || data.barcode || rawCode;
    
    // Agar kod juda qisqa bo'lsa - raw kodni ishlatamiz
    if (barcode.length < 8 && rawCode.length >= 8) {
      barcode = rawCode;
    }
    
    if (scannerTarget === 'add') {
      setForm(prev => ({
        ...prev,
        barcode: barcode,
      }));
      
      // Natijani ko'rsatish
      toast.success(`Shtrix-kod: ${barcode}`, { duration: 3000 });
    } else if (editingProduct) {
      setEditingProduct({ ...editingProduct, barcode });
      toast.success(`Shtrix-kod: ${barcode}`);
    }
  };

  // Закрыть сканер
  const closeBarcodeScanner = () => {
    setShowBarcodeScanner(false);
  };

  const handleAddProduct = async () => {
    if (!form.name || (!form.selling_price_uzs && !form.selling_price_usd)) {
      toast.error(t('errors.requiredField'));
      return;
    }

    // Используем barcode из формы или генерируем новый
    const barcodeToUse = form.barcode || Date.now().toString();

    // Use UZS prices (they are always synced)
    const finalCostPrice = parseFloat(form.cost_price_uzs) || 0;
    const finalSellingPrice = parseFloat(form.selling_price_uzs) || 0;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barcode: barcodeToUse,
          name: form.name,
          description: form.description || undefined,
          categoryId: form.category_id || undefined,
          purchasePrice: finalCostPrice,
          sellingPrice: finalSellingPrice,
          currentStock: parseInt(form.current_stock) || 0,
          minimumStock: parseInt(form.minimum_stock) || 5,
          unit: form.unit || 'dona',
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
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !form.name || (!form.selling_price_uzs && !form.selling_price_usd)) {
      toast.error(t('errors.requiredField'));
      return;
    }

    // Use UZS prices (they are always synced)
    const finalCostPrice = parseFloat(form.cost_price_uzs) || 0;
    const finalSellingPrice = parseFloat(form.selling_price_uzs) || 0;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barcode: form.barcode,
          name: form.name,
          description: form.description,
          categoryId: form.category_id || undefined,
          purchasePrice: finalCostPrice,
          sellingPrice: finalSellingPrice,
          currentStock: parseInt(form.current_stock) || 0,
          minimumStock: parseInt(form.minimum_stock) || 5,
          unit: form.unit,
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
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(`"${convertToLanguage(product.name, language)}" - ${t('products.confirmDelete')}`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/products/${product._id}`, {
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
      console.error('Delete error:', error);
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const costUzs = product.purchasePrice.toString();
    const costUsd = product.purchasePrice ? (product.purchasePrice / usdRate).toFixed(2) : '';
    const sellingUzs = product.sellingPrice.toString();
    const sellingUsd = product.sellingPrice ? (product.sellingPrice / usdRate).toFixed(2) : '';
    setForm({
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      category_id: product.categoryId?._id || '',
      cost_price_usd: costUsd,
      cost_price_uzs: costUzs,
      selling_price_usd: sellingUsd,
      selling_price_uzs: sellingUzs,
      current_stock: product.currentStock.toString(),
      minimum_stock: product.minimumStock.toString(),
      unit: product.unit || 'dona',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({
      barcode: '',
      name: '',
      description: '',
      category_id: '',
      cost_price_usd: '',
      cost_price_uzs: '',
      selling_price_usd: '',
      selling_price_uzs: '',
      current_stock: '',
      minimum_stock: '5',
      unit: 'dona',
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Agar kategoriya tanlangan bo'lsa, faqat o'sha kategoriya mahsulotlarini ko'rsatish
  const displayProducts = selectedCategory 
    ? filteredProducts.filter(p => 
        selectedCategory === 'no-category' 
          ? !p.categoryId 
          : p.categoryId?._id === selectedCategory
      )
    : filteredProducts;

  // Mahsulotlarni kategoriyalar bo'yicha guruhlash (faqat kategoriyalar ko'rsatish uchun)
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const categoryName = product.categoryId?.name || 'Kategoriyasiz';
    const categoryId = product.categoryId?._id || 'no-category';
    
    if (!groups[categoryId]) {
      groups[categoryId] = {
        categoryName,
        categoryId,
        products: []
      };
    }
    
    groups[categoryId].products.push(product);
    return groups;
  }, {} as Record<string, { categoryName: string; categoryId: string; products: Product[] }>);

  const categoryGroups = Object.values(groupedProducts).sort((a, b) => {
    // "Kategoriyasiz" ni oxirga qo'yish
    if (a.categoryId === 'no-category') return 1;
    if (b.categoryId === 'no-category') return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });

  const lowStockCount = products.filter(p => p.currentStock <= 1).length;
  const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0);
  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalValueUSD = totalValue / usdRate;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Orqaga"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={selectedCategory ? "Mahsulotlarni qidirish..." : t('products.title')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
            />
          </div>
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-100/80 rounded-xl text-xs font-semibold text-gray-600">
            <Package className="w-3.5 h-3.5" />
            {selectedCategory ? displayProducts.length : products.length}
          </span>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Kategoriya</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-emerald-100 font-medium">{t('products.title')}</p>
                <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-blue-100 font-medium">{t('common.total')}</p>
                <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-purple-100 font-medium">USD</p>
                <p className="text-lg sm:text-xl font-bold text-white tracking-tight">${totalValueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <Box className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-cyan-100 font-medium">Umumiy soni</p>
                <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{totalStock.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-0.5 col-span-2 sm:col-span-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-amber-100 font-medium">{t('products.lowStock')}</p>
                <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{lowStockCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">{t('common.loading')}...</p>
          </div>
        ) : !selectedCategory ? (
          // Kategoriyalar ko'rinishi
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryGroups.map((group) => (
                <button
                  key={group.categoryId}
                  onClick={() => setSelectedCategory(group.categoryId)}
                  className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group text-left hover:-translate-y-1 active:scale-95"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Tag className="w-6 h-6 text-emerald-600" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {convertToLanguage(group.categoryName, language)}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Mahsulotlar:</span>
                      <span className="text-sm font-semibold text-gray-900">{group.products.length} ta</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Umumiy qiymat:</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {group.products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">USD:</span>
                      <span className="text-sm font-semibold text-blue-600">
                        ${(group.products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0) / usdRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/60 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Bu kategoriyada mahsulot yo'q</p>
          </div>
        ) : (
          // Tanlangan kategoriya mahsulotlari
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mb-2">
                  <Tag className="w-6 h-6" />
                  <h2 className="text-xl font-bold">
                    {convertToLanguage(
                      categoryGroups.find(g => g.categoryId === selectedCategory)?.categoryName || 'Kategoriyasiz',
                      language
                    )}
                  </h2>
                </div>
                <button
                  onClick={() => { 
                    resetForm(); 
                    // Tanlangan kategoriyani formga o'rnatish
                    if (selectedCategory !== 'no-category') {
                      setForm(prev => ({ ...prev, category_id: selectedCategory }));
                    }
                    setShowAddModal(true); 
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Mahsulot qo'shish
                </button>
              </div>
              <p className="text-emerald-100">
                {displayProducts.length} ta mahsulot • 
                Jami: {displayProducts.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0).toLocaleString()} so'm
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <Package className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 rounded-lg text-emerald-700 text-xs font-bold">
                      #{product.barcode || '-'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{convertToLanguage(product.name, language)}</h4>
                    <p className="text-xs text-gray-500">{product.description || 'Tavsif yo\'q'}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Tan narxi:</span>
                      <span className="text-sm font-semibold text-orange-600">{product.purchasePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Sotish narxi:</span>
                      <span className="text-sm font-bold text-gray-900">{product.sellingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">USD:</span>
                      <span className="text-sm font-semibold text-blue-600">${(product.sellingPrice / usdRate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Qoldiq:</span>
                      <span className={`text-sm font-semibold ${
                        product.currentStock < 0
                          ? 'text-red-600'
                          : product.currentStock <= 1
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                      }`}>
                        {product.currentStock} {product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Jami qiymat:</span>
                      <span className="text-sm font-bold text-purple-600">
                        {(product.sellingPrice * product.currentStock).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProductForBarcode(product);
                        setShowBarcodeModal(true);
                      }}
                      className="flex-1 p-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 hover:scale-105 flex items-center justify-center"
                      title="Shtrix kod chiqarish"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-105 flex items-center justify-center"
                      title={t('common.edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="flex-1 p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all duration-200 hover:scale-105 flex items-center justify-center"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddCategoryModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">Kategoriya qo'shish</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategoriya nomi *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder="Kategoriya nomini kiriting..."
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowAddCategoryModal(false)} 
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200"
              >
                Bekor qilish
              </button>
              <button 
                onClick={() => {
                  handleAddCategory();
                  setShowAddCategoryModal(false);
                }} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
              >
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">Mahsulot qo'shish</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Категория - расширенная секция */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-500" />
                    Kategoriya
                  </label>
                  {form.category_id && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, category_id: '' })}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Tozalash
                    </button>
                  )}
                </div>

                {form.category_id && (
                  <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-sm text-gray-600">Tanlangan: </span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {categories.find(c => c._id === form.category_id)?.name || '—'}
                    </span>
                  </div>
                )}

                {/* Список категорий */}
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Kategoriyalar yo'q</p>
                  ) : (
                    categories.map((cat) => (
                      <div
                        key={cat._id}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${form.category_id === cat._id
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                          }`}
                        onClick={() => setForm({ ...form, category_id: cat._id })}
                      >
                        <span className="font-medium text-sm">{convertToLanguage(cat.name, language)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(cat);
                              setNewCategoryName(cat.name);
                              setShowEditCategoryModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${form.category_id === cat._id
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-gray-200 text-gray-500'
                              }`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat._id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${form.category_id === cat._id
                              ? 'hover:bg-red-400 text-white'
                              : 'hover:bg-red-100 text-red-500'
                              }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Добавить категорию */}
                {showAddCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Kategoriya nomi..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddCategoryInput(false); setNewCategoryName(''); }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInput(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Kategoriya yaratish
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('products.productName')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder={t('products.productName')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                  rows={2}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>
              {/* Штрих-код */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Hash className="w-4 h-4" /> Shtrix-kod
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    ref={barcodeInputRef}
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    onKeyDown={handleBarcodeKeyDown}
                    className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    placeholder="Skanerlang yoki kiriting"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                    title="Kod generatsiya qilish"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openBarcodeScanner('add')}
                    className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2"
                    title="Kamera bilan skanerlash"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                {form.barcode && (
                  <p className="mt-2 text-sm text-gray-500">Код: {form.barcode}</p>
                )}
              </div>

              {/* Currency Rate */}
              <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">Kurs: 1 $ =</span>
                  <span className="text-xs text-blue-500">(CBU)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={usdRate}
                    onChange={(e) => setUsdRate(parseFloat(e.target.value) || 12500)}
                    className="w-28 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-700">UZS</span>
                  <button
                    type="button"
                    onClick={fetchExchangeRate}
                    disabled={rateLoading}
                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    title="CBU'dan yangilash"
                  >
                    <RefreshCw className={`w-4 h-4 ${rateLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Tan narxi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline" /> Tan narxi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={form.cost_price_usd}
                      onChange={(e) => handleCostPriceUsdChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.cost_price_uzs}
                      onChange={(e) => handleCostPriceUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              {/* Sotish narxi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline" /> Sotish narxi *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={form.selling_price_usd}
                      onChange={(e) => handleSellingPriceUsdChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.selling_price_uzs}
                      onChange={(e) => handleSellingPriceUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Box className="w-4 h-4" /> Qoldiq
                </label>
                <input
                  type="number"
                  value={form.current_stock}
                  onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200">
                Bekor qilish
              </button>
              <button onClick={handleAddProduct} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">Mahsulotni tahrirlash</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Категория - расширенная секция */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-500" />
                    Kategoriya
                  </label>
                  {form.category_id && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, category_id: '' })}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Tozalash
                    </button>
                  )}
                </div>

                {form.category_id && (
                  <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-sm text-gray-600">Tanlangan: </span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {categories.find(c => c._id === form.category_id)?.name || '—'}
                    </span>
                  </div>
                )}

                {/* Список категорий */}
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Kategoriyalar yo'q</p>
                  ) : (
                    categories.map((cat) => (
                      <div
                        key={cat._id}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${form.category_id === cat._id
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-white hover:bg-gray-100 border border-gray-200'
                          }`}
                        onClick={() => setForm({ ...form, category_id: cat._id })}
                      >
                        <span className="font-medium text-sm">{convertToLanguage(cat.name, language)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory(cat);
                              setNewCategoryName(cat.name);
                              setShowEditCategoryModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${form.category_id === cat._id
                              ? 'hover:bg-white/20 text-white'
                              : 'hover:bg-gray-200 text-gray-500'
                              }`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat._id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${form.category_id === cat._id
                              ? 'hover:bg-red-400 text-white'
                              : 'hover:bg-red-100 text-red-500'
                              }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Добавить категорию */}
                {showAddCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Kategoriya nomi..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddCategoryInput(false); setNewCategoryName(''); }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryInput(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Kategoriya yaratish
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('products.productName')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder={t('products.productName')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                  rows={2}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>
              {/* Shtrix-kod */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Hash className="w-4 h-4" /> Shtrix-kod
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    onKeyDown={handleBarcodeKeyDown}
                    className="flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    placeholder="Skanerlang yoki kiriting"
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                    title="Kod generatsiya qilish"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openBarcodeScanner('edit')}
                    className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2"
                    title="Kamera bilan skanerlash"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                {form.barcode && (
                  <p className="mt-2 text-sm text-gray-500">Kod: {form.barcode}</p>
                )}
              </div>

              {/* Currency Rate */}
              <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">Kurs: 1 $ =</span>
                  <span className="text-xs text-blue-500">(CBU)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={usdRate}
                    onChange={(e) => setUsdRate(parseFloat(e.target.value) || 12500)}
                    className="w-28 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-700">UZS</span>
                  <button
                    type="button"
                    onClick={fetchExchangeRate}
                    disabled={rateLoading}
                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    title="CBU'dan yangilash"
                  >
                    <RefreshCw className={`w-4 h-4 ${rateLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Tan narxi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline" /> Tan narxi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={form.cost_price_usd}
                      onChange={(e) => handleCostPriceUsdChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.cost_price_uzs}
                      onChange={(e) => handleCostPriceUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              {/* Sotish narxi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline" /> Sotish narxi *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={form.selling_price_usd}
                      onChange={(e) => handleSellingPriceUsdChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.selling_price_uzs}
                      onChange={(e) => handleSellingPriceUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all pr-12"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Box className="w-4 h-4" /> Qoldiq
                </label>
                <input
                  type="number"
                  value={form.current_stock}
                  onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200">
                Bekor qilish
              </button>
              <button onClick={handleEditProduct} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Scanner Modal */}
      {showBarcodeScanner && (
        <ProductScanner
          isOpen={showBarcodeScanner}
          onClose={closeBarcodeScanner}
          onScanComplete={handleScanComplete}
        />
      )}

      {/* Barcode Print Modal */}
      {showBarcodeModal && selectedProductForBarcode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBarcodeModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-purple-500 to-indigo-600">
              <h3 className="text-xl font-bold text-white">Shtrix kod</h3>
              <button onClick={() => setShowBarcodeModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <p className="text-lg font-semibold text-gray-900 mb-2">{convertToLanguage(selectedProductForBarcode.name, language)}</p>
              <p className="text-sm text-gray-500 mb-4">{selectedProductForBarcode.sellingPrice.toLocaleString()} {t('common.sum')}</p>
              <div id="barcode-container" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <Barcode
                  value={selectedProductForBarcode.barcode || selectedProductForBarcode._id}
                  width={2}
                  height={60}
                  fontSize={14}
                  margin={5}
                  displayValue={true}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  const barcodeEl = document.getElementById('barcode-container');
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
                  const productPrice = Number(selectedProductForBarcode.sellingPrice || 0).toLocaleString('uz-UZ');
                  
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Chop etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditCategoryModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 bg-gradient-to-r from-blue-500 to-indigo-600 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Kategoriyani tahrirlash</h3>
              <button onClick={() => setShowEditCategoryModal(false)} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kategoriya nomi</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditCategory()}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kategoriya nomi..."
                autoFocus
              />
            </div>
            <div className="p-5 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowEditCategoryModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-medium border border-gray-200"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleEditCategory}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
