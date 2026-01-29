import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserPlus, Edit, Trash2, X, Eye, EyeOff, Search, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';

interface Cashier {
  _id: string;
  fullName: string;
  username: string;
  role: string;
  createdAt?: string;
}

const Cashiers: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: '', username: '', password: '' });

  useEffect(() => { loadCashiers(); }, []);

  const loadCashiers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        const cashierUsers = data.data.filter((u: any) => u.role === 'cashier');
        setCashiers(cashierUsers);
      }
    } catch (error) {
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashier = async () => {
    if (!form.fullName || !form.username || !form.password) {
      toast.error(t('errors.requiredField'));
      return;
    }
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'cashier' }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('cashiers.cashierSaved'));
        setShowAddModal(false);
        setForm({ fullName: '', username: '', password: '' });
        loadCashiers();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handleEditCashier = async () => {
    if (!editingCashier || !form.fullName) {
      toast.error(t('errors.requiredField'));
      return;
    }
    try {
      const updateData: any = { fullName: form.fullName };
      if (form.password) updateData.password = form.password;
      const response = await fetch(`/api/users/${editingCashier._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('cashiers.cashierSaved'));
        setShowEditModal(false);
        setEditingCashier(null);
        setForm({ fullName: '', username: '', password: '' });
        loadCashiers();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handleDeleteCashier = async (cashier: Cashier) => {
    if (!window.confirm(`${cashier.fullName} ${t('cashiers.confirmDelete')}`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/${cashier._id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('cashiers.cashierDeleted'));
        loadCashiers();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const openEditModal = (cashier: Cashier) => {
    setEditingCashier(cashier);
    setForm({ fullName: cashier.fullName, username: cashier.username, password: '' });
    setShowEditModal(true);
  };

  // Kassir panelga o'tish
  const openCashierPOS = (cashier: Cashier) => {
    // Kassir ma'lumotlarini localStorage ga saqlash
    localStorage.setItem('selectedCashier', JSON.stringify(cashier));
    // Kassir POS sahifasiga o'tish
    navigate(`/${cashier._id}/pos`);
  };

  const filteredCashiers = cashiers.filter((c) =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-100 px-3 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('cashiers.title')} className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" />
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">{cashiers.length}</span>
          <button onClick={() => { setForm({ fullName: '', username: '', password: '' }); setShowAddModal(true); }} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex-shrink-0">
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner spinner-lg"></div></div>
        ) : filteredCashiers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><User className="w-10 h-10 text-gray-300" /></div>
            <p className="text-gray-500 font-medium">{t('cashiers.noCashiers')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredCashiers.map((cashier) => (
              <div key={cashier._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="p-8 flex flex-col items-center">
                  <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                    <User className="w-14 h-14 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 text-center">{convertToLanguage(cashier.fullName, language)}</h3>
                  <p className="text-sm text-gray-500 mb-4">@{cashier.username}</p>
                  <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">{t('settings.cashier')}</span>
                </div>
                <div className="flex border-t border-gray-100">
                  <button onClick={() => openCashierPOS(cashier)} className="flex-1 flex items-center justify-center gap-2 py-3 text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Store className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('nav.pos')}</span>
                  </button>
                  <div className="w-px bg-gray-100"></div>
                  <button onClick={() => openEditModal(cashier)} className="flex-1 flex items-center justify-center gap-2 py-3 text-blue-600 hover:bg-blue-50 transition-colors">
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('common.edit')}</span>
                  </button>
                  <div className="w-px bg-gray-100"></div>
                  <button onClick={() => handleDeleteCashier(cashier)} className="flex-1 flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('common.delete')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('cashiers.addCashier')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="input-group">
                <label className="label">{t('cashiers.fullName')}</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" placeholder={t('cashiers.fullName')} />
              </div>
              <div className="input-group">
                <label className="label">{t('cashiers.username')}</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" placeholder="kassir1" />
              </div>
              <div className="input-group">
                <label className="label">{t('cashiers.password')}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn btn-md btn-secondary">{t('common.cancel')}</button>
              <button onClick={handleAddCashier} className="btn btn-md btn-primary">{t('common.add')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCashier && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{t('cashiers.editCashier')}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="input-group">
                <label className="label">{t('cashiers.fullName')}</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" />
              </div>
              <div className="input-group">
                <label className="label">{t('cashiers.username')}</label>
                <input type="text" value={form.username} disabled className="input bg-gray-100 text-gray-500" />
              </div>
              <div className="input-group">
                <label className="label">{t('cashiers.newPassword')} ({t('credit.optional')})</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pr-12" placeholder="..." />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowEditModal(false)} className="btn btn-md btn-secondary">{t('common.cancel')}</button>
              <button onClick={handleEditCashier} className="btn btn-md btn-primary">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashiers;
