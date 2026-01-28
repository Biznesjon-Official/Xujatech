/**
 * Cheklar tarixi sahifasi
 * Barcha cheklar ro'yxati va qidiruv
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Download, Eye, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';
import ReceiptsStats from '../components/Receipts/ReceiptsStats';
import ReceiptModal from '../components/Receipts/ReceiptModal';

interface Receipt {
  _id: string;
  cashierName: string;
  items: any[];
  total: number;
  status: string;
  source: string;
  createdAt: string;
  processedAt?: string;
  printedAt?: string;
}

const ReceiptsHistory: React.FC = () => {
  const { t, language } = useLanguage();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Cheklar ro'yxatini yuklash
  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/receipts/saved?source=mobile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReceipts(data.data || []);
        setFilteredReceipts(data.data || []);
      }
    } catch (error) {
      console.error('Cheklar yuklash xatosi:', error);
      toast.error('Cheklar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  // Filtrlar
  useEffect(() => {
    let filtered = [...receipts];

    // Qidiruv
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.cashierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r._id.includes(searchQuery)
      );
    }

    // Status filtri
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Sana filtri
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(r => {
        const receiptDate = new Date(r.createdAt);
        
        if (dateFilter === 'today') {
          return receiptDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return receiptDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return receiptDate >= monthAgo;
        }
        return true;
      });
    }

    setFilteredReceipts(filtered);
  }, [searchQuery, statusFilter, dateFilter, receipts]);

  // Status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      saved: { color: 'bg-blue-100 text-blue-700', text: 'Kutilmoqda' },
      processing: { color: 'bg-amber-100 text-amber-700', text: 'Jarayonda' },
      completed: { color: 'bg-emerald-100 text-emerald-700', text: 'To\'langan' },
      cancelled: { color: 'bg-red-100 text-red-700', text: 'Bekor qilingan' },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.saved;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cheklar tarixi</h1>
        <p className="text-gray-500">Telefondan kelgan barcha cheklar</p>
      </div>

      {/* Stats */}
      <ReceiptsStats />

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kassir yoki chek ID bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Barcha statuslar</option>
              <option value="saved">Kutilmoqda</option>
              <option value="processing">Jarayonda</option>
              <option value="completed">To'langan</option>
              <option value="cancelled">Bekor qilingan</option>
            </select>
          </div>

          {/* Date filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Barcha vaqt</option>
              <option value="today">Bugun</option>
              <option value="week">Hafta</option>
              <option value="month">Oy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Cheklar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Chek ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kassir</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mahsulotlar</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Summa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sana</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-gray-600">
                        #{receipt._id.slice(-6)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{receipt.cashierName}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">{receipt.items.length} ta</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="font-bold text-gray-900">
                        {receipt.total.toLocaleString()} so'm
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-600">
                        {new Date(receipt.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getStatusBadge(receipt.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedReceiptId(receipt._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ko'rish"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Receipt Modal */}
      {selectedReceiptId && (
        <ReceiptModal
          receiptId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
          onComplete={() => {
            fetchReceipts();
          }}
        />
      )}
    </div>
  );
};

export default ReceiptsHistory;
