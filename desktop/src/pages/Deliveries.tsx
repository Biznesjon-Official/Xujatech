import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  X,
  Package,
  Phone,
  Calendar,
  Trash2,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';

interface Product {
  _id: string;
  name: string;
  barcode?: string;
  currentStock: number;
  purchasePrice: number;
  unit: string;
}

interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  totalPrice: number;
}

interface Delivery {
  _id: string;
  supplierName: string;
  supplierPhone?: string;
  items: DeliveryItem[];
  totalAmount: number;
  notes?: string;
  deliveryDate: string;
  createdAt: string;
}

interface MonthlyStats {
  totalDeliveries: number;
  totalAmount: number;
  totalItems: number;
}

const Deliveries: React.FC = () => {
  const { t } = useLanguage();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalDeliveries: 0,
    totalAmount: 0,
    totalItems: 0,
  });

  // Form state
  const [form, setForm] = useState({
    supplierName: '',
    supplierPhone: '',
    notes: '',
    deliveryDate: new Date().toISOString().split('T')[0],
  });
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; productName: string; quantity: number; purchasePrice: number }[]
  >([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Yangi mahsulot qo'shish
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    unit: 'dona',
  });

  useEffect(() => {
    loadDeliveries();
    loadProducts();
    loadMonthlyStats();
  }, []);

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/deliveries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDeliveries(data.data || []);
      }
    } catch (error) {
      console.error('Load deliveries error:', error);
      toast.error('Xatolik yuz berdi');
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

  const loadMonthlyStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/deliveries/stats/monthly', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMonthlyStats(data.data.summary);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleAddDelivery = async () => {
    if (!form.supplierName.trim()) {
      toast.error("Ta'minotchi nomini kiriting");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Kamida bitta mahsulot qo'shing");
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierName: form.supplierName,
          supplierPhone: form.supplierPhone,
          notes: form.notes,
          deliveryDate: form.deliveryDate,
          items: selectedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(t('deliveries.deliverySaved'));
        setShowAddModal(false);
        resetForm();
        loadDeliveries();
        loadProducts();
        loadMonthlyStats();
      } else {
        toast.error(data.message || 'Xatolik');
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleDeleteDelivery = async (delivery: Delivery) => {
    if (!window.confirm("Bu yetkazib berishni o'chirmoqchimisiz? Ombor qoldiqlari qaytariladi.")) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/deliveries/${delivery._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success("O'chirildi");
        loadDeliveries();
        loadProducts();
        loadMonthlyStats();
      } else {
        toast.error(data.message || 'Xatolik');
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const resetForm = () => {
    setForm({
      supplierName: '',
      supplierPhone: '',
      notes: '',
      deliveryDate: new Date().toISOString().split('T')[0],
    });
    setSelectedItems([]);
    setProductSearch('');
    setShowNewProductForm(false);
    setNewProductForm({ name: '', barcode: '', purchasePrice: '', sellingPrice: '', unit: 'dona' });
  };

  // Yangi mahsulot yaratish va ro'yxatga qo'shish
  const handleCreateNewProduct = async () => {
    if (!newProductForm.name.trim()) {
      toast.error('Mahsulot nomini kiriting');
      return;
    }
    if (!newProductForm.sellingPrice) {
      toast.error('Sotish narxini kiriting');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProductForm.name,
          barcode: newProductForm.barcode || undefined,
          purchasePrice: parseFloat(newProductForm.purchasePrice) || 0,
          sellingPrice: parseFloat(newProductForm.sellingPrice) || 0,
          currentStock: 0,
          unit: newProductForm.unit,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Mahsulot yaratildi");
        
        // Yangi mahsulotni ro'yxatga qo'shish
        const newProduct = data.data;
        setSelectedItems([
          ...selectedItems,
          {
            productId: newProduct._id,
            productName: newProduct.name,
            quantity: 1,
            purchasePrice: parseFloat(newProductForm.purchasePrice) || 0,
          },
        ]);
        
        // Formni tozalash
        setShowNewProductForm(false);
        setNewProductForm({ name: '', barcode: '', purchasePrice: '', sellingPrice: '', unit: 'dona' });
        setProductSearch('');
        
        // Mahsulotlar ro'yxatini yangilash
        loadProducts();
      } else {
        toast.error(data.message || 'Xatolik');
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const addProductToList = (product: Product) => {
    if (selectedItems.find((item) => item.productId === product._id)) {
      toast.error('Bu mahsulot allaqachon qo\'shilgan');
      return;
    }

    setSelectedItems([
      ...selectedItems,
      {
        productId: product._id,
        productName: product.name,
        quantity: 1,
        purchasePrice: product.purchasePrice,
      },
    ]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const updateItemPrice = (productId: string, price: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.productId === productId ? { ...item, purchasePrice: Math.max(0, price) } : item
      )
    );
  };

  const removeItemFromList = (productId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.productId !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(productSearch))
  );

  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.items.some((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatMoney = (amount: number) => amount.toLocaleString('uz-UZ');

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
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('deliveries.addDelivery')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-100">{t('deliveries.monthlyDeliveries')}</p>
                <p className="text-xl font-bold">{monthlyStats.totalDeliveries}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-100">{t('deliveries.monthlyExpense')}</p>
                <p className="text-xl font-bold">{formatMoney(monthlyStats.totalAmount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-amber-100">{t('deliveries.products')}</p>
                <p className="text-xl font-bold">{monthlyStats.totalItems}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/60">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t('deliveries.noDeliveries')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeliveries.map((delivery) => (
              <div
                key={delivery._id}
                className="bg-white rounded-2xl border border-gray-200/60 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{delivery.supplierName}</p>
                      {delivery.supplierPhone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {delivery.supplierPhone}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(delivery.deliveryDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatMoney(delivery.totalAmount)} so'm
                    </p>
                    <p className="text-xs text-gray-500">{delivery.items.length} mahsulot</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {delivery.items.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600"
                      >
                        {item.productName} × {item.quantity}
                      </span>
                    ))}
                    {delivery.items.length > 3 && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-xs">
                        +{delivery.items.length - 3} ta
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleDeleteDelivery(delivery)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600">
              <h3 className="text-xl font-bold text-white">{t('deliveries.addDelivery')}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Supplier Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('deliveries.supplierName')} *
                  </label>
                  <input
                    type="text"
                    value={form.supplierName}
                    onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masalan: Shivaki"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('deliveries.supplierPhone')}</label>
                  <input
                    type="tel"
                    value={form.supplierPhone}
                    onChange={(e) => setForm({ ...form, supplierPhone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="+998..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('deliveries.deliveryDate')}</label>
                <input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('deliveries.products')} *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('deliveries.searchProducts')}
                  />
                  {showProductDropdown && productSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                      {/* Yangi mahsulot qo'shish tugmasi */}
                      <div
                        onClick={() => {
                          setShowNewProductForm(true);
                          setShowProductDropdown(false);
                          setNewProductForm({ ...newProductForm, name: productSearch });
                        }}
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-200 flex items-center gap-2 text-indigo-600"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Yangi mahsulot qo'shish: "{productSearch}"</span>
                      </div>
                      
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">{t('common.noResults')}</div>
                      ) : (
                        filteredProducts.slice(0, 10).map((product) => (
                          <div
                            key={product._id}
                            onClick={() => addProductToList(product)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              Qoldiq: {product.currentStock} {product.unit} | Narx:{' '}
                              {formatMoney(product.purchasePrice)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {/* Yangi mahsulot formasi */}
                {showNewProductForm && (
                  <div className="bg-indigo-50 rounded-xl p-4 space-y-3 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-indigo-700">Yangi mahsulot</h4>
                      <button
                        onClick={() => setShowNewProductForm(false)}
                        className="p-1 hover:bg-indigo-100 rounded-lg"
                      >
                        <X className="w-4 h-4 text-indigo-600" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newProductForm.name}
                      onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="Mahsulot nomi *"
                    />
                    <input
                      type="text"
                      value={newProductForm.barcode}
                      onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="Shtrix-kod (ixtiyoriy)"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={newProductForm.purchasePrice}
                        onChange={(e) => setNewProductForm({ ...newProductForm, purchasePrice: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Olish narxi"
                      />
                      <input
                        type="number"
                        value={newProductForm.sellingPrice}
                        onChange={(e) => setNewProductForm({ ...newProductForm, sellingPrice: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="Sotish narxi *"
                      />
                    </div>
                    <select
                      value={newProductForm.unit}
                      onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="dona">Dona</option>
                      <option value="kg">Kg</option>
                      <option value="litr">Litr</option>
                      <option value="metr">Metr</option>
                      <option value="pachka">Pachka</option>
                    </select>
                    <button
                      onClick={handleCreateNewProduct}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Mahsulot yaratish va qo'shish
                    </button>
                  </div>
                )}
              </div>

              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(item.productId, parseInt(e.target.value) || 1)
                          }
                          className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-center"
                          min="1"
                        />
                        <span className="text-xs text-gray-500">×</span>
                        <input
                          type="number"
                          value={item.purchasePrice}
                          onChange={(e) =>
                            updateItemPrice(item.productId, parseInt(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-center"
                          min="0"
                        />
                        <button
                          onClick={() => removeItemFromList(item.productId)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Jami:</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatMoney(calculateTotal())} so'm
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Izoh</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl font-semibold border border-gray-200"
              >
                Bekor
              </button>
              <button
                onClick={handleAddDelivery}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold"
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

export default Deliveries;
