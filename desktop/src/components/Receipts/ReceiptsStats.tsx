/**
 * Cheklar statistikasi
 * Bugungi, haftalik va oylik cheklar statistikasi
 */

import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../i18n';
import { convertToLanguage } from '../../utils/transliterate';

interface Stats {
  today: number;
  week: number;
  month: number;
  completed: number;
}

const ReceiptsStats: React.FC = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    today: 0,
    week: 0,
    month: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Bugungi cheklar
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const response = await fetch('/api/receipts/saved?source=mobile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const receipts = data.data || [];
          
          const todayCount = receipts.filter((r: any) => 
            new Date(r.createdAt) >= today
          ).length;
          
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekCount = receipts.filter((r: any) => 
            new Date(r.createdAt) >= weekAgo
          ).length;
          
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          const monthCount = receipts.filter((r: any) => 
            new Date(r.createdAt) >= monthAgo
          ).length;
          
          const completedCount = receipts.filter((r: any) => 
            r.status === 'completed'
          ).length;
          
          setStats({
            today: todayCount,
            week: weekCount,
            month: monthCount,
            completed: completedCount,
          });
        }
      } catch (error) {
        console.error('Stats yuklash xatosi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Har 30 soniyada yangilash
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
            <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Bugungi cheklar */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
          <Clock className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{stats.today}</p>
        <p className="text-sm text-white/80">{convertToLanguage('Bugungi cheklar', language)}</p>
      </div>

      {/* Haftalik */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.week}</p>
        <p className="text-sm text-gray-500">{convertToLanguage('Haftalik', language)}</p>
      </div>

      {/* Oylik */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-amber-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.month}</p>
        <p className="text-sm text-gray-500">{convertToLanguage('Oylik', language)}</p>
      </div>

      {/* To'langan */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
          <CheckCircle className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{stats.completed}</p>
        <p className="text-sm text-white/80">{convertToLanguage("To'langan", language)}</p>
      </div>
    </div>
  );
};

export default ReceiptsStats;
