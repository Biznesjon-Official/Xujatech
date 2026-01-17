import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Phone, Edit, Trash2, X, DollarSign, MapPin, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';

interface Customer {
  _id: string;
  fullName: string;
  phone?: string;
  address?: string;
  currentDebt: number;
  debtLimit: number;
  totalPurchases: number;
}

const Customers: React.FC = () => {
  const { t, language } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'debtors'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayDebtModal, setShowPayDebtModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', debtLimit: '0' });
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setCustomers(data.data || []);
    } catch (error) {
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!form.fullName) { toast.error(t('errors.requiredField')); return; }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: form.fullName, phone: form.phone, address: form.address, debtLimit: parseFloat(form.debtLimit) || 0 }),
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
    }
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer || !form.fullName) { toast.error(t('errors.requiredField')); return; }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: form.fullName, phone: form.phone, address: form.address, debtLimit: parseFloat(form.debtLimit) || 0 }),
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
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
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

  const handlePayDebt = async () => {
    if (!editingCustomer || !payAmount) { toast.error(t('errors.requiredField')); return; }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/customers/${editingCustomer._id}/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(payAmount) }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('debts.debtPaid'));
        setShowPayDebtModal(false);
        setEditingCustomer(null);
        setPayAmount('');
        loadCustomers();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const resetForm = () => setForm({ fullName: '', phone: '', address: '', debtLimit: '0' });

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({ fullName: customer.fullName, phone: customer.phone || '', address: customer.address || '', debtLimit: customer.debtLimit.toString() });
    setShowEditModal(true);
  };

  const openPayDebtModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setPayAmount('');
    setShowPayDebtModal(true);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone && c.phone.includes(searchQuery));
    if (activeTab === 'debtors') return matchesSearch && c.currentDebt > 0;
    return matchesSearch;
  });

  const totalDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);
  const debtorsCount = customers.filter((c) => c.currentDebt > 0).length;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Modern Header with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder={t('customers.title')} 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all duration-200 placeholder:text-gray-400" 
            />
          </div>
          <div className="hidden sm:flex bg-gray-100/80 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setActiveTab('all')} 
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {customers.length}
            </button>
            <button 
              onClick={() => setActiveTab('debtors')} 
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === 'debtors' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {debtorsCount}
            </button>
          </div>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }} 
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-blue-100 font-medium">{t('customers.title')}</p>
                <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="group relative overflow-hidden bg-gradient-to-br from-rose-500 to-red-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-rose-100 font-medium">{t('customers.debt')}</p>
                <p className="text-lg sm:text-xl font-bold text-white tracking-tight">{totalDebt.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-6 overflow-auto">
        <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500 font-medium">{t('common.loading')}...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{t('customers.noCustomers')}</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <div key={customer._id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{customer.fullName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900 truncate">{convertToLanguage(customer.fullName, language)}</p>
                            {customer.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" />{customer.phone}
                              </p>
                            )}
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 px-2 py-1 rounded-lg ${customer.currentDebt > 0 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>
                            {customer.currentDebt.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{t('customers.debtLimit')}: {customer.debtLimit.toLocaleString()}</span>
                          <div className="flex items-center gap-1">
                            {customer.currentDebt > 0 && (
                              <button 
                                onClick={() => openPayDebtModal(customer)} 
                                className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => openEditModal(customer)} 
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCustomer(customer)} 
                              className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('customers.customerName')}</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('customers.phone')}</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('customers.debt')}</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('customers.debtLimit')}</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                            <span className="text-white font-bold">{customer.fullName.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{convertToLanguage(customer.fullName, language)}</p>
                            {customer.address && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {convertToLanguage(customer.address, language)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {customer.phone ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="p-1.5 bg-gray-100 rounded-lg">
                              <Phone className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium">{customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${customer.currentDebt > 0 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>
                          {customer.currentDebt.toLocaleString()} {t('common.sum')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-gray-600 font-medium">{customer.debtLimit.toLocaleString()} {t('common.sum')}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {customer.currentDebt > 0 && (
                            <button 
                              onClick={() => openPayDebtModal(customer)} 
                              className="p-2.5 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all duration-200 hover:scale-105" 
                              title={t('customers.payDebt')}
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => openEditModal(customer)} 
                            className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-105" 
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(customer)} 
                            className="p-2.5 text-rose-600 hover:bg-rose-100 rounded-xl transition-all duration-200 hover:scale-105" 
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600">
              <h3 className="text-xl font-bold text-white">{t('customers.addCustomer')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.customerName')} *</label>
                <input 
                  type="text" 
                  value={form.fullName} 
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                  placeholder={t('customers.customerName')} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.phone')}</label>
                <input 
                  type="text" 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                  placeholder="+998901234567" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.address')}</label>
                <input 
                  type="text" 
                  value={form.address} 
                  onChange={(e) => setForm({ ...form, address: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                  placeholder={t('customers.address')} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.debtLimit')}</label>
                <input 
                  type="number" 
                  value={form.debtLimit} 
                  onChange={(e) => setForm({ ...form, debtLimit: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                  placeholder="0" 
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)} 
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleAddCustomer} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{t('customers.editCustomer')}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.customerName')} *</label>
                <input 
                  type="text" 
                  value={form.fullName} 
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.phone')}</label>
                <input 
                  type="text" 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.address')}</label>
                <input 
                  type="text" 
                  value={form.address} 
                  onChange={(e) => setForm({ ...form, address: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('customers.debtLimit')}</label>
                <input 
                  type="number" 
                  value={form.debtLimit} 
                  onChange={(e) => setForm({ ...form, debtLimit: e.target.value })} 
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleEditCustomer} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {showPayDebtModal && editingCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">{t('customers.payDebt')}</h3>
              <button onClick={() => setShowPayDebtModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                  <span className="text-white font-bold text-xl">{editingCustomer.fullName.charAt(0).toUpperCase()}</span>
                </div>
                <p className="font-semibold text-gray-900">{editingCustomer.fullName}</p>
                <p className="text-3xl font-bold text-rose-600 mt-2">{editingCustomer.currentDebt.toLocaleString()} {t('common.sum')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('debts.currentDebt')}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('debts.paymentAmount')}</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                  className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" 
                  placeholder="0" 
                  autoFocus 
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => setPayAmount(Math.floor(editingCustomer.currentDebt / 2).toString())} 
                  className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  50%
                </button>
                <button 
                  onClick={() => setPayAmount(editingCustomer.currentDebt.toString())} 
                  className="flex-1 py-3 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-all"
                >
                  {t('common.all')}
                </button>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setShowPayDebtModal(false)} 
                className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handlePayDebt} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                {t('customers.payDebt')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
