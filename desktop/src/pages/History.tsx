import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Search,
  Calendar,
  ShoppingCart,
  CreditCard,
  User,
  Phone,
  Package,
  DollarSign,
  Clock,
  Filter,
  ChevronDown,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  _id: string;
  receiptNumber: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'debt';
  customerName?: string;
  customerPhone?: string;
  cashierId?: string;
  cashierName?: string;
  createdAt: string;
}

interface DebtHistoryItem {
  _id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  action: 'added' | 'paid' | 'deleted';
  amount: number;
  previousAmount: number;
  newAmount: number;
  notes?: string;
  receivedBy?: string;
  createdAt: string;
}

const History: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'debts'>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Sales
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  
  // Debt history
  const [debtHistory, setDebtHistory] = useState<DebtHistoryItem[]>([]);
  const [debtLoading, setDebtLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSales();
    } else {
      loadDebtHistory();
    }
  }, [activeTab, dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart, end: now };
      default:
        return { start: null, end: null };
    }
  };

  const loadSales = async () => {
    setSalesLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const { start, end } = getDateRange();
      let url = '/api/sales';
      if (start && end) {
        url += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setSales(data.data || []);
      }
    } catch (error) {
      console.error('Load sales error:', error);
      toast.error('Sotuvlarni yuklashda xatolik');
    } finally {
      setSalesLoading(false);
    }
  };

  const loadDebtHistory = async () => {
    setDebtLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customers/debt-logs/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        let logs = data.data || [];
        
        // Filter by date
        const { start, end } = getDateRange();
        if (start && end) {
          logs = logs.filter((log: DebtHistoryItem) => {
            const logDate = new Date(log.createdAt);
            return logDate >= start && logDate <= end;
          });
        }
        
        setDebtHistory(logs);
      }
    } catch (error) {
      console.error('Load debt history error:', error);
    } finally {
      setDebtLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const query = searchQuery.toLowerCase();
    return (
      sale.receiptNumber?.toLowerCase().includes(query) ||
      sale.customerName?.toLowerCase().includes(query) ||
      sale.items.some(item => item.productName.toLowerCase().includes(query))
    );
  });

  const filteredDebtHistory = debtHistory.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.customerName?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ') + ' ' + date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatMoney = (amount: number) => amount.toLocaleString('uz-UZ');

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return convertToLanguage('Naqd', language);
      case 'card': return convertToLanguage('Karta', language);
      case 'transfer': return convertToLanguage("O'tkazma", language);
      case 'debt': return convertToLanguage('Qarz', language);
      default: return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-emerald-100 text-emerald-700';
      case 'card': return 'bg-blue-100 text-blue-700';
      case 'transfer': return 'bg-purple-100 text-purple-700';
      case 'debt': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Stats
  const salesStats = {
    total: filteredSales.length,
    totalAmount: filteredSales.reduce((sum, s) => sum + s.totalAmount, 0),
    cash: filteredSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0),
    card: filteredSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.totalAmount, 0),
  };

  const debtStats = {
    totalAdded: filteredDebtHistory.filter(d => d.action === 'added').reduce((sum, d) => sum + Math.abs(d.amount || d.newAmount - d.previousAmount), 0),
    totalPaid: filteredDebtHistory.filter(d => d.action === 'paid').reduce((sum, d) => sum + Math.abs(d.amount || d.previousAmount - d.newAmount), 0),
    addedCount: filteredDebtHistory.filter(d => d.action === 'added').length,
    paidCount: filteredDebtHistory.filter(d => d.action === 'paid').length,
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sales'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {convertToLanguage('Sotuv tarixi', language)}
            </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'debts'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {convertToLanguage('Qarz tarixi', language)}
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={convertToLanguage('Qidirish', language) + '...'} 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all" 
              />
            </div>
            
            {/* Date Filter */}
            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {dateFilter === 'today' ? convertToLanguage('Bugun', language) : 
                   dateFilter === 'week' ? convertToLanguage('Hafta', language) : 
                   dateFilter === 'month' ? convertToLanguage('Oy', language) : convertToLanguage('Hammasi', language)}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 min-w-[150px]">
                  {[
                    { value: 'today', label: convertToLanguage('Bugun', language) },
                    { value: 'week', label: convertToLanguage('Hafta', language) },
                    { value: 'month', label: convertToLanguage('Oy', language) },
                    { value: 'all', label: convertToLanguage('Hammasi', language) },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => { setDateFilter(option.value as any); setShowDatePicker(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        dateFilter === option.value ? 'text-emerald-600 font-medium bg-emerald-50' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 py-4">
        {activeTab === 'sales' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-200/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{convertToLanguage('Jami sotuvlar', language)}</p>
                  <p className="text-lg font-bold text-gray-900">{salesStats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{convertToLanguage('Naqd', language)}</p>
                  <p className="text-lg font-bold text-emerald-600">{formatMoney(salesStats.cash)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{convertToLanguage('Karta', language)}</p>
                  <p className="text-lg font-bold text-blue-600">{formatMoney(salesStats.card)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/80">{convertToLanguage('Umumiy summa', language)}</p>
                  <p className="text-lg font-bold text-white">{formatMoney(salesStats.totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-200/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Berilgan qarzlar</p>
                  <p className="text-lg font-bold text-red-600">{debtStats.addedCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-200/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">To'langan qarzlar</p>
                  <p className="text-lg font-bold text-emerald-600">{debtStats.paidCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/80">Berilgan qarzlar</p>
                  <p className="text-lg font-bold text-white">{formatMoney(debtStats.totalAdded)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/80">To'langan qarzlar</p>
                  <p className="text-lg font-bold text-white">{formatMoney(debtStats.totalPaid)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 pb-6 overflow-auto">
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
          {/* SOTUV TARIXI */}
          {activeTab === 'sales' && (
            <>
              {salesLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">{convertToLanguage('Sotuvlar topilmadi', language)}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredSales.map((sale) => (
                    <div key={sale._id} className="p-4 hover:bg-gray-50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">#{sale.receiptNumber}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodColor(sale.paymentMethod)}`}>
                              {getPaymentMethodLabel(sale.paymentMethod)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {formatDate(sale.createdAt)}
                            {sale.customerName && (
                              <>
                                <span>•</span>
                                <User className="w-3 h-3" />
                                {convertToLanguage(sale.customerName, language)}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatMoney(sale.totalAmount)} so'm</p>
                          <p className="text-xs text-gray-500">{sale.items.length} ta mahsulot</p>
                        </div>
                      </div>
                      
                      {/* Mahsulotlar */}
                      <div className="mt-3 pl-13 space-y-1">
                        {sale.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.productName} x{item.quantity}
                            </span>
                            <span className="text-gray-900 font-medium">{formatMoney(item.total)}</span>
                          </div>
                        ))}
                        {sale.items.length > 3 && (
                          <p className="text-xs text-gray-400">+{sale.items.length - 3} ta mahsulot</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* QARZ TARIXI */}
          {activeTab === 'debts' && (
            <>
              {debtLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredDebtHistory.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Qarz tarixi topilmadi</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDebtHistory.map((item) => {
                    const isPayment = item.action === 'paid';
                    const amount = Math.abs(item.amount || (isPayment ? item.previousAmount - item.newAmount : item.newAmount - item.previousAmount));
                    
                    return (
                      <div 
                        key={item._id} 
                        className={`p-4 hover:bg-gray-50 transition-all ${
                          isPayment ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isPayment 
                              ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                              : 'bg-gradient-to-br from-red-400 to-rose-500'
                          }`}>
                            {isPayment ? (
                              <TrendingDown className="w-5 h-5 text-white" />
                            ) : (
                              <TrendingUp className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {item.customerName || 'Noma\'lum mijoz'}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isPayment ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {isPayment ? "To'lov" : "Qarz"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.createdAt)}
                              {item.customerPhone && (
                                <>
                                  <span>•</span>
                                  <Phone className="w-3 h-3" />
                                  {item.customerPhone}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isPayment ? 'text-emerald-600' : 'text-red-600'}`}>
                              {isPayment ? '-' : '+'}{formatMoney(amount)} so'm
                            </p>
                            <p className="text-xs text-gray-500">
                              Qoldiq: {formatMoney(item.newAmount)} so'm
                            </p>
                          </div>
                        </div>
                        
                        {/* Qo'shimcha ma'lumotlar */}
                        {(item.notes || item.receivedBy) && (
                          <div className="mt-2 pl-13 space-y-1">
                            {item.receivedBy && (
                              <p className="text-sm text-gray-600">
                                <span className="text-gray-400">Qabul qildi:</span> {item.receivedBy}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-sm text-gray-500">{item.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
