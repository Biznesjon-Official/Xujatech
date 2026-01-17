import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  Package,
  Calendar,
  User,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileText,
  DollarSign,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';

interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface ProductReturn {
  _id: string;
  saleId?: string;
  items: ReturnItem[];
  totalAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

interface Sale {
  _id: string;
  receiptNumber: string;
  items: any[];
  totalAmount: number;
  createdAt: string;
  customerName?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
}

const Returns: React.FC = () => {
  const { t } = useLanguage();
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
  
  // Form states
  const [returnType, setReturnType] = useState<'sale' | 'manual'>('manual');
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadReturns();
    loadProducts();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/returns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReturns(data.data || []);
      }
    } catch (error) {
      // Fallback to localStorage
      const saved = localStorage.getItem('productReturns');
      setReturns(saved ? JSON.parse(saved) : []);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
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
    }
  };

  const searchSales = async (query: string) => {
    if (!query || query.length < 2) {
      setSales([]);
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/sales/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSales(data.data || []);
      }
    } catch (error) {
      console.error('Search sales error:', error);
    }
  };

  const addProductToReturn = (product: Product) => {
    const existing = returnItems.find(item => item.productId === product._id);
    if (existing) {
      setReturnItems(returnItems.map(item => 
        item.productId === product._id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setReturnItems([...returnItems, {
        productId: product._id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
      }]);
    }
    setProductSearch('');
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setReturnItems(returnItems.filter(item => item.productId !== productId));
    } else {
      setReturnItems(returnItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ));
    }
  };

  const removeItem = (productId: string) => {
    setReturnItems(returnItems.filter(item => item.productId !== productId));
  };

  const getTotalAmount = () => {
    return returnItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmitReturn = async () => {
    if (returnItems.length === 0) {
      toast.error("Kamida bitta mahsulot qo'shing");
      return;
    }
    if (!reason) {
      toast.error("Qaytarish sababini kiriting");
      return;
    }

    const newReturn: ProductReturn = {
      _id: `return_${Date.now()}`,
      saleId: selectedSale?._id,
      items: returnItems,
      totalAmount: getTotalAmount(),
      reason,
      status: 'pending',
      customerName: customerName || selectedSale?.customerName,
      customerPhone,
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newReturn),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Qaytarish ro'yxatga olindi");
        loadReturns();
      } else {
        // Fallback to localStorage
        saveReturnLocal(newReturn);
      }
    } catch {
      saveReturnLocal(newReturn);
    }

    resetForm();
    setShowAddModal(false);
  };

  const saveReturnLocal = (newReturn: ProductReturn) => {
    const saved = localStorage.getItem('productReturns');
    const existing = saved ? JSON.parse(saved) : [];
    existing.unshift(newReturn);
    localStorage.setItem('productReturns', JSON.stringify(existing));
    setReturns(existing);
    toast.success("Qaytarish ro'yxatga olindi");
  };

  const resetForm = () => {
    setReturnType('manual');
    setSaleSearch('');
    setSelectedSale(null);
    setSales([]);
    setReturnItems([]);
    setReason('');
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setProductSearch('');
  };

  const handleApproveReturn = async (returnItem: ProductReturn) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/returns/${returnItem._id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Qaytarish tasdiqlandi, mahsulotlar omborga qaytarildi");
        loadReturns();
      } else {
        approveReturnLocal(returnItem);
      }
    } catch {
      approveReturnLocal(returnItem);
    }
    setShowDetailModal(false);
  };

  const approveReturnLocal = (returnItem: ProductReturn) => {
    const saved = localStorage.getItem('productReturns');
    const existing: ProductReturn[] = saved ? JSON.parse(saved) : [];
    const updated = existing.map(r => 
      r._id === returnItem._id ? { ...r, status: 'approved' as const } : r
    );
    localStorage.setItem('productReturns', JSON.stringify(updated));
    setReturns(updated);
    toast.success("Qaytarish tasdiqlandi");
  };

  const handleRejectReturn = async (returnItem: ProductReturn) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/returns/${returnItem._id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Qaytarish rad etildi");
        loadReturns();
      } else {
        rejectReturnLocal(returnItem);
      }
    } catch {
      rejectReturnLocal(returnItem);
    }
    setShowDetailModal(false);
  };

  const rejectReturnLocal = (returnItem: ProductReturn) => {
    const saved = localStorage.getItem('productReturns');
    const existing: ProductReturn[] = saved ? JSON.parse(saved) : [];
    const updated = existing.map(r => 
      r._id === returnItem._id ? { ...r, status: 'rejected' as const } : r
    );
    localStorage.setItem('productReturns', JSON.stringify(updated));
    setReturns(updated);
    toast.success("Qaytarish rad etildi");
  };

  const handleDeleteReturn = async (returnItem: ProductReturn) => {
    if (!window.confirm("Qaytarishni o'chirmoqchimisiz?")) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/returns/${returnItem._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success("Qaytarish o'chirildi");
        loadReturns();
      } else {
        deleteReturnLocal(returnItem);
      }
    } catch {
      deleteReturnLocal(returnItem);
    }
  };

  const deleteReturnLocal = (returnItem: ProductReturn) => {
    const saved = localStorage.getItem('productReturns');
    const existing: ProductReturn[] = saved ? JSON.parse(saved) : [];
    const filtered = existing.filter(r => r._id !== returnItem._id);
    localStorage.setItem('productReturns', JSON.stringify(filtered));
    setReturns(filtered);
    toast.success("Qaytarish o'chirildi");
  };

  const filteredReturns = returns.filter(r => 
    r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('uz-UZ');
  const formatMoney = (amount: number) => amount.toLocaleString('uz-UZ');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" /> {t('returns.approved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <AlertCircle className="w-3 h-3" /> {t('returns.rejected')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" /> {t('returns.pending')}
          </span>
        );
    }
  };

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    totalAmount: returns.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.totalAmount, 0),
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <RotateCcw className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('returns.title')}</h1>
              <p className="text-xs text-gray-500">{t('returns.returnDetails')}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={t('common.search') + '...'} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50 focus:bg-white transition-all" 
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/25"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('returns.addReturn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <RotateCcw className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('common.total')}</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('returns.pending')}</p>
                <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t('returns.approved')}</p>
                <p className="text-lg font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/80">{t('common.totalAmount')}</p>
                <p className="text-lg font-bold text-white">{formatMoney(stats.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 pb-6 overflow-auto">
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{t('returns.noReturns')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredReturns.map((returnItem) => (
                <div 
                  key={returnItem._id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-all"
                  onClick={() => { setSelectedReturn(returnItem); setShowDetailModal(true); }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      returnItem.status === 'approved' ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
                      returnItem.status === 'rejected' ? 'bg-gradient-to-br from-red-400 to-rose-500' :
                      'bg-gradient-to-br from-amber-400 to-orange-500'
                    }`}>
                      <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {returnItem.items.length} ta mahsulot
                      </p>
                      <p className="text-xs text-gray-500">
                        {returnItem.customerName || 'Noma\'lum mijoz'} • {formatDate(returnItem.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatMoney(returnItem.totalAmount)} so'm</p>
                      {getStatusBadge(returnItem.status)}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteReturn(returnItem); }} 
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 pl-13">
                    <span className="font-medium">Sabab:</span> {returnItem.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Return Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-orange-500 to-red-600 sticky top-0">
              <h3 className="text-xl font-bold text-white">{t('returns.addReturn')}</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Mijoz ma'lumotlari */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mijoz ismi</label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500" 
                    placeholder="Ism familiya"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                  <input 
                    type="tel" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500" 
                    placeholder="+998..."
                  />
                </div>
              </div>

              {/* Mahsulot qo'shish */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mahsulot qo'shish</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={productSearch} 
                    onChange={(e) => setProductSearch(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500" 
                    placeholder="Mahsulot nomi yoki shtrix kod..."
                  />
                </div>
                {productSearch && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200">
                    {products
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch))
                      .slice(0, 5)
                      .map(product => (
                        <div 
                          key={product._id} 
                          onClick={() => addProductToReturn(product)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{formatMoney(product.price)} so'm</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Tanlangan mahsulotlar */}
              {returnItems.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Qaytariladigan mahsulotlar</label>
                  <div className="space-y-2">
                    {returnItems.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-500">{formatMoney(item.price)} so'm</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button 
                            onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-bold text-orange-600 w-24 text-right">{formatMoney(item.total)}</p>
                        <button onClick={() => removeItem(item.productId)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-orange-100 rounded-xl">
                      <span className="font-semibold text-gray-700">Jami:</span>
                      <span className="text-xl font-bold text-orange-600">{formatMoney(getTotalAmount())} so'm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sabab */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qaytarish sababi *</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Tanlang...</option>
                  <option value="Nuqsonli mahsulot">Nuqsonli mahsulot</option>
                  <option value="Noto'g'ri mahsulot">Noto'g'ri mahsulot</option>
                  <option value="Mijoz fikrini o'zgartirdi">Mijoz fikrini o'zgartirdi</option>
                  <option value="Muddati o'tgan">Muddati o'tgan</option>
                  <option value="Boshqa">Boshqa</option>
                </select>
              </div>

              {/* Izoh */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qo'shimcha izoh</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 resize-none" 
                  rows={2}
                  placeholder="Izoh..."
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3 sticky bottom-0">
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200">Bekor</button>
              <button onClick={handleSubmitReturn} className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold">Saqlash</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReturn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className={`p-6 flex justify-between items-center ${
              selectedReturn.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
              selectedReturn.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
              'bg-gradient-to-r from-orange-500 to-amber-600'
            }`}>
              <div>
                <h3 className="text-xl font-bold text-white">Qaytarish tafsilotlari</h3>
                <p className="text-sm text-white/80">{formatDate(selectedReturn.createdAt)}</p>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedReturn(null); }} className="p-2 hover:bg-white/20 rounded-xl">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Status */}
              <div className="flex justify-center">
                {getStatusBadge(selectedReturn.status)}
              </div>

              {/* Mijoz */}
              {selectedReturn.customerName && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedReturn.customerName}</p>
                    {selectedReturn.customerPhone && <p className="text-xs text-gray-500">{selectedReturn.customerPhone}</p>}
                  </div>
                </div>
              )}

              {/* Mahsulotlar */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Mahsulotlar</h4>
                <div className="space-y-2">
                  {selectedReturn.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x {formatMoney(item.price)}</p>
                      </div>
                      <p className="font-bold text-orange-600">{formatMoney(item.total)} so'm</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Jami */}
              <div className="flex justify-between items-center p-4 bg-orange-100 rounded-xl">
                <span className="font-semibold text-gray-700">Jami summa:</span>
                <span className="text-2xl font-bold text-orange-600">{formatMoney(selectedReturn.totalAmount)} so'm</span>
              </div>

              {/* Sabab */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Qaytarish sababi:</p>
                <p className="font-medium text-gray-900">{selectedReturn.reason}</p>
              </div>

              {selectedReturn.notes && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Izoh:</p>
                  <p className="text-sm text-gray-700">{selectedReturn.notes}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 flex gap-3">
              {selectedReturn.status === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleRejectReturn(selectedReturn)} 
                    className="flex-1 px-4 py-3 text-red-600 bg-white rounded-xl font-semibold border border-red-200 hover:bg-red-50"
                  >
                    Rad etish
                  </button>
                  <button 
                    onClick={() => handleApproveReturn(selectedReturn)} 
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold"
                  >
                    Tasdiqlash
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setShowDetailModal(false); setSelectedReturn(null); }} 
                  className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200"
                >
                  Yopish
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
