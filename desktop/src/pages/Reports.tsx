import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Download,
  DollarSign,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';

type ReportType = 'daily' | 'cashier' | 'profit' | 'debt';

interface DailySalesReport {
  total_sales: number;
  total_revenue: number;
  total_profit: number;
}

interface CashierReport {
  cashier_name: string;
  total_sales: number;
  total_revenue: number;
}

interface DebtReport {
  id: string;
  full_name: string;
  phone: string;
  current_debt: number;
}

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [dailyReport, setDailyReport] = useState<DailySalesReport | null>(null);
  const [cashierReport, setCashierReport] = useState<CashierReport[]>([]);
  const [debtReport, setDebtReport] = useState<DebtReport[]>([]);
  const [profitSummary, setProfitSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
  });
  const { t } = useLanguage();

  useEffect(() => {
    loadReport();
  }, [activeReport, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      switch (activeReport) {
        case 'daily':
          const dailyRes = await fetch(
            `/api/reports/sales/daily?date=${endDate}`,
            { headers }
          );
          const dailyData = await dailyRes.json();
          if (dailyData.success) setDailyReport(dailyData.data.summary);
          break;
        case 'cashier':
          const cashierRes = await fetch(
            `/api/reports/sales/cashier?startDate=${startDate}&endDate=${endDate}`,
            { headers }
          );
          const cashierData = await cashierRes.json();
          if (cashierData.success) setCashierReport(cashierData.data);
          break;
        case 'profit':
          const profitRes = await fetch(
            `/api/reports/profit?startDate=${startDate}&endDate=${endDate}`,
            { headers }
          );
          const profitData = await profitRes.json();
          if (profitData.success) setProfitSummary(profitData.data);
          break;
        case 'debt':
          const debtRes = await fetch(`/api/reports/debts`, { headers });
          const debtData = await debtRes.json();
          if (debtData.success) setDebtReport(debtData.data);
          break;
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'daily', label: t('reports.dailyReport'), icon: Calendar },
    { id: 'cashier', label: t('settings.cashier'), icon: Users },
    { id: 'profit', label: t('reports.profitReport'), icon: TrendingUp },
    { id: 'debt', label: t('customers.debt'), icon: CreditCard },
  ];

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('nav.reports')}</h1>
          <p className="text-sm text-gray-500 hidden sm:block">{t('reports.salesReport')}</p>
        </div>
        <button
          onClick={() => toast.success(t('common.success'))}
          className="btn btn-sm btn-secondary"
        >
          <Download className="w-4 h-4" />
          <span>{t('common.export')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          {/* Report Type Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveReport(type.id as ReportType)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  activeReport === type.id
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>

          {/* Date Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input flex-1"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input flex-1"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : (
          <div className="card-body">
            {/* Daily Report */}
            {activeReport === 'daily' && dailyReport && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">{t('reports.totalSales')}</p>
                      <p className="text-2xl font-bold text-green-800">{dailyReport.total_sales || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="text-sm text-emerald-600">{t('reports.totalRevenue')}</p>
                      <p className="text-2xl font-bold text-emerald-800">
                        {((dailyReport.total_revenue || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-teal-600" />
                    <div>
                      <p className="text-sm text-teal-600">{t('reports.totalProfit')}</p>
                      <p className="text-2xl font-bold text-teal-800">
                        {((dailyReport.total_profit || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cashier Report */}
            {activeReport === 'cashier' && (
              <div className="report-table-container">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">{t('settings.cashier')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('reports.totalSales')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('reports.totalRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cashierReport.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-3 font-medium">{item.cashier_name}</td>
                        <td className="px-3 py-3 text-right">{item.total_sales}</td>
                        <td className="px-3 py-3 text-right text-green-600 font-medium">
                          {(item.total_revenue / 1000000).toFixed(1)}M
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cashierReport.length === 0 && (
                  <p className="text-center text-gray-500 py-8">{t('common.notFound')}</p>
                )}
              </div>
            )}

            {/* Profit Report */}
            {activeReport === 'profit' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium">{t('reports.totalRevenue')}</p>
                  <p className="text-xl font-bold text-green-800">
                    {(profitSummary.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-red-600 font-medium">{t('common.total')}</p>
                  <p className="text-xl font-bold text-red-800">
                    {(profitSummary.totalCost / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 font-medium">{t('reports.totalProfit')}</p>
                  <p className="text-xl font-bold text-emerald-800">
                    {(profitSummary.totalProfit / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <p className="text-xs text-teal-600 font-medium">%</p>
                  <p className="text-xl font-bold text-teal-800">
                    {profitSummary.profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Debt Report */}
            {activeReport === 'debt' && (
              <div className="report-table-container">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">{t('pos.customer')}</th>
                      <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">{t('customers.phone')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('customers.debt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {debtReport.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-3">
                          <div className="font-medium">{item.full_name}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{item.phone || '-'}</div>
                        </td>
                        <td className="px-3 py-3 text-gray-600 hidden sm:table-cell">{item.phone || '-'}</td>
                        <td className="px-3 py-3 text-right text-red-600 font-medium">
                          {(item.current_debt / 1000000).toFixed(1)}M
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {debtReport.length === 0 && (
                  <p className="text-center text-gray-500 py-8">{t('customers.noDebt')}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
