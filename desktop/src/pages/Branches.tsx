import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  MapPin,
  Phone,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';

interface Branch {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  isMain: boolean;
}

const Branches: React.FC = () => {
  const { t, language } = useLanguage();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    isMain: false,
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/branches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (error) {
      console.error('Load branches error:', error);
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!form.name) {
      toast.error(t('branches.enterName'));
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('branches.branchSaved'));
        setShowAddModal(false);
        resetForm();
        loadBranches();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handleEditBranch = async () => {
    if (!editingBranch || !form.name) {
      toast.error(t('branches.enterName'));
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/branches/${editingBranch._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('branches.branchSaved'));
        setShowEditModal(false);
        setEditingBranch(null);
        resetForm();
        loadBranches();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!window.confirm(`"${convertToLanguage(branch.name, language)}" - ${t('branches.confirmDelete')}`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/branches/${branch._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('branches.branchDeleted'));
        loadBranches();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      toast.error(t('errors.somethingWentWrong'));
    }
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      isMain: branch.isMain,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({ name: '', address: '', phone: '', isMain: false });
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('branches.title')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
            />
          </div>
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gray-100/80 rounded-xl text-xs font-semibold text-gray-600">
            <Building2 className="w-3.5 h-3.5" />
            {branches.length}
          </span>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">{t('common.loading')}...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/60 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">{t('branches.noBranches')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredBranches.map((branch) => (
              <div
                key={branch._id}
                className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  branch.isMain ? 'border-emerald-200 ring-2 ring-emerald-500/20' : 'border-gray-200/60'
                }`}
              >
                {/* Card Header */}
                <div className={`p-5 ${branch.isMain ? 'bg-gradient-to-r from-emerald-50 to-teal-50' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        branch.isMain 
                          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/30' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/20'
                      }`}>
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{convertToLanguage(branch.name, language)}</h3>
                          {branch.isMain && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {branch.isMain && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mt-1">
                            {t('branches.mainBranch')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {branch.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{convertToLanguage(branch.address, language)}</span>
                    </div>
                  )}
                  
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(branch)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('common.edit')}</span>
                  </button>
                  <div className="w-px bg-gray-100"></div>
                  <button
                    onClick={() => handleDeleteBranch(branch)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600">
              <h3 className="text-xl font-bold text-white">{t('branches.addBranch')}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('branches.branchName')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder={t('branches.example')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('branches.address')}</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder={t('branches.enterAddress')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('branches.phone')}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <label className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isMain}
                  onChange={(e) => setForm({ ...form, isMain: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded-lg border-gray-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">{t('branches.mainBranch')}</span>
                  <p className="text-xs text-gray-500 mt-0.5">Asosiy filial sifatida belgilash</p>
                </div>
              </label>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200">
                {t('common.cancel')}
              </button>
              <button onClick={handleAddBranch} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBranch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{t('branches.editBranch')}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('branches.branchName')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('branches.address')}</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('branches.phone')}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <label className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
                <input
                  type="checkbox"
                  checked={form.isMain}
                  onChange={(e) => setForm({ ...form, isMain: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded-lg border-gray-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">{t('branches.mainBranch')}</span>
                  <p className="text-xs text-gray-500 mt-0.5">Asosiy filial sifatida belgilash</p>
                </div>
              </label>
            </div>
            <div className="p-6 bg-gray-50 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 font-semibold transition-all border border-gray-200">
                {t('common.cancel')}
              </button>
              <button onClick={handleEditBranch} className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
