import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  RefreshCw,
  User,
  CreditCard,
  Edit3,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Users,
  Box,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';

const API_URL = '/api';

interface CashierSummary {
  cashierId: string;
  cashierName: string;
  totalSales: number;
  totalSalesAmount: number;
  totalDebtGiven: number;
  totalDebtPaid: number;
  debtCount: number;
  debtEdits: number;
  debtDeletes: number;
}

interface ProductSold {
  name: string;
  quantity: number;
  totalAmount: number;
}

interface DebtGiven {
  customerName: string;
  customerPhone: string;
  amount: number;
  date: string;
  notes?: string;
}

interface DebtPaid {
  customerName: string;
  customerPhone: string;
  amount: number;
  date: string;
  notes?: string;
}

interface DebtEdit {
  customerName: string;
  customerPhone: string;
  previousAmount: number;
  newAmount: number;
  changeAmount: number;
  date: string;
  notes?: string;
}

interface DebtDelete {
  customerName: string;
  customerPhone: string;
  deletedAmount: number;
  date: string;
  notes?: string;
}

interface CashierDetail {
  cashier: { id: string; name: string; username: string };
  summary: {
    totalSalesCount: number;
    totalSalesAmount: number;
    totalProductsSold: number;
    totalDebtGiven: number;
    totalDebtPaid: number;
    totalDebtEdits: number;
    totalDebtDeletes: number;
  };
  productsSold: ProductSold[];
  debtsGiven: DebtGiven[];
  debtsPaid: DebtPaid[];
  debtEdits: DebtEdit[];
  debtDeletes: DebtDelete[];
}

type TabType = 'products' | 'debts';
type DebtSection = 'given' | 'paid' | 'edited' | 'deleted';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [cashierSummaries, setCashierSummaries] = useState<CashierSummary[]>([]);
  const [totals, setTotals] = useState({ totalSales: 0, totalAmount: 0, totalDebt: 0, totalDebtPaid: 0 });
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);
  const [cashierDetail, setCashierDetail] = useState<CashierDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [expandedDebtSection, setExpandedDebtSection] = useState<DebtSection | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  });

  useEffect(() => {
    loadCashiersSummary();
  }, [period]);

  useEffect(() => {
    if (selectedCashier) {
      loadCashierDetail(selectedCashier);
    }
  }, [selectedCashier, period]);

  const loadCashiersSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reports/cashiers/summary?period=${period}`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setCashierSummaries(data.data.cashiers);
        setTotals(data.data.totals);
      }
    } catch (error) {
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadCashierDetail = async (cashierId: string) => {
    try {
      const response = await fetch(`${API_URL}/reports/cashiers/${cashierId}/stats?period=${period}`, { headers: getHeaders() });
      const data = await response.json();
      if (data.success) {
        setCashierDetail(data.data);
      }
    } catch (error) {
      toast.error(t('errors.loadError'));
    }
  };

  const formatCurrency = (value: number) => value.toLocaleString('uz-UZ');
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredCashiers = cashierSummaries.filter((c) => c.cashierName.toLowerCase().includes(searchQuery.toLowerCase()));

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return t('statistics.today');
      case 'week': return t('statistics.week');
      case 'month': return t('statistics.month');
    }
  };


  // Cashier Detail View
  if (selectedCashier && cashierDetail) {
    return (
      <div className="min-h-full bg-gray-50/50">
        {/* Clean Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="px-6 py-5">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => { setSelectedCashier(null); setCashierDetail(null); setExpandedDebtSection(null); }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-900">{cashierDetail.cashier.name}</h1>
                <p className="text-sm text-gray-500">@{cashierDetail.cashier.username}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{getPeriodLabel()}</span>
              </div>
            </div>

            {/* KPI Cards - Modern SaaS Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sales Count */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {getPeriodLabel()}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{cashierDetail.summary.totalSalesCount}</p>
                <p className="text-sm text-gray-500">{t('statistics.totalSales')}</p>
              </div>

              {/* Sales Amount */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3 h-3" />
                    {t('common.sum')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(cashierDetail.summary.totalSalesAmount)}</p>
                <p className="text-sm text-gray-500">{t('statistics.totalAmount')}</p>
              </div>

              {/* Debt Given */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-rose-600" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                    <ArrowDownRight className="w-3 h-3" />
                    {t('statistics.givenDebt')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(cashierDetail.summary.totalDebtGiven)}</p>
                <p className="text-sm text-gray-500">{t('statistics.givenDebts')}</p>
              </div>

              {/* Debt Paid */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {t('debts.paid')}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(cashierDetail.summary.totalDebtPaid || 0)}</p>
                <p className="text-sm text-gray-500">{t('statistics.paidDebts')}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex px-6 gap-1 border-t border-gray-100">
            {[
              { key: 'products', label: t('nav.products'), icon: Package },
              { key: 'debts', label: t('statistics.debts'), icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('statistics.soldProducts')}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{t('common.total')}: {cashierDetail.summary.totalProductsSold} {t('common.pcs')}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>
              {cashierDetail.productsSold.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {cashierDetail.productsSold.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-semibold text-gray-600">
                          {idx + 1}
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{product.quantity} {t('common.pcs')}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(product.totalAmount)} {t('common.sum')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">{t('statistics.noProductsSold')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('statistics.noDataAvailable')}</p>
                </div>
              )}
            </div>
          )}


          {activeTab === 'debts' && (
            <div className="space-y-4">
              {/* Given Debts */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedDebtSection(expandedDebtSection === 'given' ? null : 'given')}
                  className="w-full p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-rose-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{t('statistics.givenDebts')}</h3>
                        <p className="text-sm text-gray-500">{formatCurrency(cashierDetail.summary.totalDebtGiven)} {t('common.sum')} • {cashierDetail.debtsGiven.length} {t('common.pcs')}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedDebtSection === 'given' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandedDebtSection === 'given' && (
                  <div className="border-t border-gray-100">
                    {cashierDetail.debtsGiven.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                        {cashierDetail.debtsGiven.map((debt, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-rose-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{debt.customerName}</p>
                                <p className="text-xs text-gray-400">{formatDate(debt.date)}</p>
                              </div>
                            </div>
                            <p className="font-semibold text-rose-600">{formatCurrency(debt.amount)} {t('common.sum')}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">{t('statistics.noDebtGiven')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Paid Debts */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedDebtSection(expandedDebtSection === 'paid' ? null : 'paid')}
                  className="w-full p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{t('statistics.paidDebts')}</h3>
                        <p className="text-sm text-gray-500">{formatCurrency(cashierDetail.summary.totalDebtPaid || 0)} {t('common.sum')} • {cashierDetail.debtsPaid?.length || 0} {t('common.pcs')}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedDebtSection === 'paid' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandedDebtSection === 'paid' && (
                  <div className="border-t border-gray-100">
                    {cashierDetail.debtsPaid && cashierDetail.debtsPaid.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                        {cashierDetail.debtsPaid.map((debt, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{debt.customerName}</p>
                                <p className="text-xs text-gray-400">{formatDate(debt.date)}</p>
                              </div>
                            </div>
                            <p className="font-semibold text-green-600">+{formatCurrency(debt.amount)} {t('common.sum')}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">{t('statistics.noDebtPaid')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edited Debts */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedDebtSection(expandedDebtSection === 'edited' ? null : 'edited')}
                  className="w-full p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Edit3 className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{t('statistics.editedDebts')}</h3>
                        <p className="text-sm text-gray-500">{cashierDetail.summary.totalDebtEdits} {t('statistics.edits')}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedDebtSection === 'edited' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandedDebtSection === 'edited' && (
                  <div className="border-t border-gray-100">
                    {cashierDetail.debtEdits.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                        {cashierDetail.debtEdits.map((edit, idx) => (
                          <div key={idx} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                  <Edit3 className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{edit.customerName}</p>
                                  <p className="text-xs text-gray-400">{formatDate(edit.date)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-400 line-through">{formatCurrency(edit.previousAmount)}</p>
                                <p className="font-semibold text-amber-600">{formatCurrency(edit.newAmount)} {t('common.sum')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">{t('statistics.noDebtEdited')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deleted Debts */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedDebtSection(expandedDebtSection === 'deleted' ? null : 'deleted')}
                  className="w-full p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{t('statistics.deletedDebts')}</h3>
                        <p className="text-sm text-gray-500">{cashierDetail.summary.totalDebtDeletes} {t('statistics.deletes')}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedDebtSection === 'deleted' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandedDebtSection === 'deleted' && (
                  <div className="border-t border-gray-100">
                    {cashierDetail.debtDeletes.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                        {cashierDetail.debtDeletes.map((del, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{del.customerName}</p>
                                <p className="text-xs text-gray-400">{formatDate(del.date)}</p>
                              </div>
                            </div>
                            <p className="font-semibold text-gray-500 line-through">{formatCurrency(del.deletedAmount)} {t('common.sum')}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">{t('statistics.noDebtDeleted')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }


  // Main Dashboard View - Modern SaaS Design
  return (
    <div className="min-h-full bg-gray-50/50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t('statistics.title')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('statistics.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(['today', 'week', 'month'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      period === p
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {p === 'today' ? t('statistics.today') : p === 'week' ? t('statistics.week') : t('statistics.month')}
                  </button>
                ))}
              </div>
              <button
                onClick={loadCashiersSummary}
                className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - SaaS Style */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Sales */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">{getPeriodLabel()}</span>
                </div>
              </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(totals.totalSales)}</p>
            <p className="text-sm text-gray-500">{t('statistics.totalSales')}</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-xs font-medium">{t('common.sum')}</span>
                </div>
              </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(totals.totalAmount)}</p>
            <p className="text-sm text-gray-500">{t('statistics.totalAmount')}</p>
          </div>

          {/* Total Debt Given */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6 text-rose-600" />
                </div>
                <div className="flex items-center gap-1 text-rose-600">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-xs font-medium">{t('statistics.givenDebt')}</span>
                </div>
              </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(totals.totalDebt)}</p>
            <p className="text-sm text-gray-500">{t('statistics.givenDebts')}</p>
          </div>

          {/* Total Debt Paid */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-gray-300 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">{t('debts.paid')}</span>
                </div>
              </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(totals.totalDebtPaid || 0)}</p>
            <p className="text-sm text-gray-500">{t('statistics.paidDebts')}</p>
          </div>
        </div>
      </div>

      {/* Cashiers List */}
      <div className="px-6 pb-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('statistics.searchCashier')}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">{t('common.loading')}...</p>
          </div>
        ) : filteredCashiers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-900 font-medium mb-1">{t('statistics.noCashiers')}</p>
            <p className="text-sm text-gray-500">{t('statistics.noDataAvailable')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCashiers.map((cashier) => (
              <button
                key={cashier.cashierId}
                onClick={() => setSelectedCashier(cashier.cashierId)}
                className="w-full bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-xl font-bold text-gray-600">{cashier.cashierName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{cashier.cashierName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                          <ShoppingCart className="w-3 h-3" />
                          {cashier.totalSales} {t('cashiers.sales')}
                        </span>
                        {cashier.totalDebtGiven > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium">
                            <CreditCard className="w-3 h-3" />
                            {formatCurrency(cashier.totalDebtGiven)}
                          </span>
                        )}
                        {(cashier.totalDebtPaid || 0) > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            {formatCurrency(cashier.totalDebtPaid || 0)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(cashier.totalSalesAmount)}</p>
                      <p className="text-sm text-gray-500">{t('common.sum')}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
