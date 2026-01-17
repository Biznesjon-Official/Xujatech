import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  Camera,
  Box,
  Tag,
  Hash,
  DollarSign,
  RefreshCw,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';
import ProductScanner from '../components/POS/ProductScanner';
import { type GS1ParseResult } from '../utils/scanner';

interface WarehouseProduct {
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
  warehouseStock: number;
  minimumStock: number;
  unit: string;
}

interface Category {
  _id: string;
  name: string;
}

const Warehouses: React.FC = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WarehouseProduct | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'add' | 'edit'>('add');

  // Category management
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Currency exchange rate
  const [usdRate, setUsdRate] = useState(12500);
  const [rateLoading, setRateLoading] = useState(false);

  // Barcode input ref
  const barcodeInputRef = useRef<HTMLInputElement>(null);

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
    warehouse_stock: '',
    minimum_stock: '5',
    unit: 'dona',
  });

  // CBU API'dan valyuta kursini olish
  const fetchExchangeRate = async () => {
    setRateLoading(true);
    try {
      const response = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
      const data = await response.json();
      const usdCurrency = data.find((item: any) => item.Ccy === 'USD');
      if (usdCurrency) {
        setUsdRate(Math.round(parseFloat(usdCurrency.Rate)));
      }
    } catch (error) {
      console.error('Valyuta kursini olishda xatolik:', error);
    } finally {
      setRateLoading(false);
    }
  };

  // Handle barcode key down
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const barcode = form.barcode.trim();
      if (barcode.length >= 3) {
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

  // Handle USD price change
  const handleCostPriceUsdChange = (value: string) => {
    const usdValue = parseFloat(value) || 0;
    setForm({
      ...form,
      cost_price_usd: value,
      cost_price_uzs: usdValue ? Math.round(usdValue * usdRate).toString() : '',
    });
  };

  const handleCostPriceUzsChange = (value: string) => {
    const uzsValue = parseFloat(value) || 0;
    setForm({
      ...form,
      cost_price_uzs: value,
      cost_price_usd: uzsValue ? (uzsValue / usdRate).toFixed(2) : '',
    });
  };

  const handleSellingPriceUsdChange = (value: string) => {
    const usdValue = parseFloat(value) || 0;
    setForm({
      ...form,
      selling_price_usd: value,
      selling_price_uzs: usdValue ? Math.round(usdValue * usdRate).toString() : '',
    });
  };

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
    fetchExchangeRate();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/warehouses/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Load warehouse products error:', error);
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

  // Category management functions
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

  const generateBarcode = () => {
    const barcode = Date.now().toString();
    setForm({ ...form, barcode });
    toast.success('Shtrix-kod yaratildi');
  };

  const openBarcodeScanner = (target: 'add' | 'edit') => {
    setScannerTarget(target);
    setShowBarcodeScanner(true);
  };

  const handleScanComplete = (data: GS1ParseResult) => {
    const rawCode = data.raw || '';
    const numericCode = rawCode.replace(/\D/g, '');
    let barcode = data.gtin || numericCode || data.barcode || rawCode;
    if (barcode.length < 8 && rawCode.length >= 8) {
      barcode = rawCode;
    }
    if (scannerTarget === 'add') {
      setForm(prev => ({ ...prev, barcode }));
      toast.success(`Shtrix-kod: ${barcode}`);
    } else if (editingProduct) {
      setEditingProduct({ ...editingProduct, barcode });
      toast.success(`Shtrix-kod: ${barcode}`);
    }
  };

  const handleAddProduct = async () => {
    if (!form.name || (!form.selling_price_uzs && !form.selling_price_usd)) {
      toast.error("Mahsulot nomi va narxi kiritilishi shart");
      return;
    }
    const barcodeToUse = form.barcode || Date.now().toString();
    const finalCostPrice = parseFloat(form.cost_price_uzs) || 0;
    const finalSellingPrice = parseFloat(form.selling_price_uzs) || 0;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/warehouses/products', {
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
          warehouseStock: parseInt(form.warehouse_stock) || 0,
          minimumStock: parseInt(form.minimum_stock) || 5,
          unit: form.unit || 'dona',
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Mahsulot omborga qo'shildi");
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
      toast.error("Mahsulot nomi va narxi kiritilishi shart");
      return;
    }
    const finalCostPrice = parseFloat(form.cost_price_uzs) || 0;
    const finalSellingPrice = parseFloat(form.selling_price_uzs) || 0;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/warehouses/products/${editingProduct._id}`, {
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
          warehouseStock: parseInt(form.warehouse_stock) || 0,
          minimumStock: parseInt(form.minimum_stock) || 5,
          unit: form.unit,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Mahsulot yangilandi");
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

  const handleDeleteProduct = async (product: WarehouseProduct) => {
    if (!window.confirm(`"${convertToLanguage(product.name, language)}" - o'chirmoqchimisiz?`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/warehouses/products/${product._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Mahsulot o'chirildi");
        loadProducts();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const openEditModal = (product: WarehouseProduct) => {
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
      warehouse_stock: product.warehouseStock.toString(),
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
      warehouse_stock: '',
      minimum_stock: '5',
      unit: 'dona',
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const lowStockCount = products.filter(p => p.warehouseStock <= p.minimumStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.warehouseStock), 0);


  // Category section component for modals
  const CategorySection = () => (
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

      {showAddCategoryInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
            placeholder="Kategoriya nomi..."
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setShowAddCategoryInput(false); setNewCategoryName(''); }}
            className="px-4 py-2.5 bg-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-300"
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
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('warehouses.searchProducts')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
            />
          </div>
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-100/80 rounded-xl text-xs font-semibold text-gray-600">
            <Warehouse className="w-3.5 h-3.5" />
            {products.length}
          </span>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-emerald-100 font-medium">{t('warehouses.warehouseStock')}</p>
                <p className="text-lg sm:text-xl font-bold text-white">{products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-blue-100 font-medium">{t('warehouses.totalValue')}</p>
                <p className="text-lg sm:text-xl font-bold text-white">{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-amber-500/20 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-amber-100 font-medium">{t('warehouses.lowStock')}</p>
                <p className="text-lg sm:text-xl font-bold text-white">{lowStockCount}</p>
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
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/60 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Warehouse className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">{t('warehouses.noProducts')}</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <Box className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{convertToLanguage(product.name, language)}</p>
                        <span className="px-2 py-1 bg-emerald-100 rounded-lg text-emerald-700 text-xs font-bold">
                          #{product.barcode || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-bold text-gray-900">{product.sellingPrice.toLocaleString()} <span className="text-xs font-normal text-gray-500">so'm</span></p>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          product.warehouseStock <= product.minimumStock ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.warehouseStock} {product.unit}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => openEditModal(product)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product)} className="p-2.5 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Shtrix-kod</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Mahsulot</th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Narxi</th>
                      <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Omborda</th>
                      <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-9 px-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl font-bold text-emerald-700 text-sm">
                            {product.barcode || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Box className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate max-w-[200px]">{convertToLanguage(product.name, language)}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.categoryId?.name ? convertToLanguage(product.categoryId.name, language) : 'Kategoriyasiz'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <p className="font-bold text-gray-900 text-lg">{product.sellingPrice.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">so'm</p>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-semibold ${
                            product.warehouseStock <= product.minimumStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {product.warehouseStock} {product.unit}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEditModal(product)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteProduct(product)} className="p-2.5 text-rose-600 hover:bg-rose-100 rounded-xl">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>


      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">Omborga mahsulot qo'shish</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Category Section */}
              <CategorySection />

              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mahsulot nomi *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder="Mahsulot nomini kiriting"
                />
              </div>

              {/* Description */}
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

              {/* Barcode */}
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
                    className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    title="Kod generatsiya qilish"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openBarcodeScanner('add')}
                    className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                    title="Kamera bilan skanerlash"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                {form.barcode && <p className="mt-2 text-sm text-gray-500">Kod: {form.barcode}</p>}
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

              {/* Cost Price */}
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

              {/* Selling Price */}
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

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Box className="w-4 h-4" /> Ombordagi qoldiq
                </label>
                <input
                  type="number"
                  value={form.warehouse_stock}
                  onChange={(e) => setForm({ ...form, warehouse_stock: e.target.value })}
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
              {/* Category Section */}
              <CategorySection />

              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mahsulot nomi *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                  rows={2}
                />
              </div>

              {/* Barcode */}
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
                  />
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openBarcodeScanner('edit')}
                    className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Currency Rate */}
              <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">Kurs: 1 $ =</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={usdRate}
                    onChange={(e) => setUsdRate(parseFloat(e.target.value) || 12500)}
                    className="w-28 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm text-center font-semibold"
                  />
                  <span className="text-sm font-medium text-blue-700">UZS</span>
                  <button
                    type="button"
                    onClick={fetchExchangeRate}
                    disabled={rateLoading}
                    className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${rateLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Cost Price */}
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
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.cost_price_uzs}
                      onChange={(e) => handleCostPriceUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              {/* Selling Price */}
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
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">USD</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.selling_price_uzs}
                      onChange={(e) => handleSellingPriceUzsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">UZS</span>
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Box className="w-4 h-4" /> Ombordagi qoldiq
                </label>
                <input
                  type="number"
                  value={form.warehouse_stock}
                  onChange={(e) => setForm({ ...form, warehouse_stock: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold border border-gray-200">
                Bekor qilish
              </button>
              <button onClick={handleEditProduct} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowEditCategoryModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Kategoriyani tahrirlash</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditCategory()}
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowEditCategoryModal(false)} className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">
                Bekor qilish
              </button>
              <button onClick={handleEditCategory} className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600">
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <ProductScanner
          isOpen={showBarcodeScanner}
          onScanComplete={handleScanComplete}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
};

export default Warehouses;
