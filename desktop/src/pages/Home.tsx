import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';
import {
  User,
  Settings,
  Lock,
  Eye,
  EyeOff,
  ShoppingCart,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage, LanguageSwitcher } from '../i18n';
import { ThemeToggle } from '../context/ThemeContext';
import { convertToLanguage } from '../utils/transliterate';

interface Cashier {
  _id: string;
  fullName: string;
  username: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, language } = useLanguage();

  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loadingCashiers, setLoadingCashiers] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Kassir login modal
  const [showCashierLogin, setShowCashierLogin] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [cashierPassword, setCashierPassword] = useState('');
  const [showCashierPassword, setShowCashierPassword] = useState(false);
  const [cashierLoginLoading, setCashierLoginLoading] = useState(false);

  // Admin login modal
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  useEffect(() => {
    loadCashiers();
  }, []);

  const loadCashiers = async () => {
    setLoadingCashiers(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        const cashierUsers = data.data.filter((u: any) => u.role === 'cashier');
        setCashiers(cashierUsers);
      }
    } catch (error) {
      console.error('Load cashiers error:', error);
    } finally {
      setLoadingCashiers(false);
    }
  };

  const handleCashierClick = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setCashierPassword('');
    setShowCashierPassword(false);
    setShowCashierLogin(true);
  };

  const handleCashierLogin = async () => {
    if (!selectedCashier || !cashierPassword) {
      toast.error(t('home.enterPassword'));
      return;
    }
    setCashierLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedCashier.username, password: cashierPassword }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('selectedCashier', JSON.stringify(selectedCashier));
        toast.success(`${t('home.welcome')}, ${convertToLanguage(selectedCashier.fullName, language)}!`);
        setShowCashierLogin(false);
        navigate(`/${selectedCashier._id}/pos`);
      } else {
        toast.error(t('home.wrongPassword'));
      }
    } catch (error) {
      toast.error(t('home.errorOccurred'));
    } finally {
      setCashierLoginLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminUsername || !adminPassword) {
      toast.error(t('home.enterLoginPassword'));
      return;
    }
    setAdminLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.data.user.role !== 'admin' && data.data.user.role !== 'manager') {
          toast.error(t('home.adminRequired'));
          return;
        }
        localStorage.setItem('accessToken', data.data.accessToken);
        dispatch(loginSuccess(data.data.user));
        toast.success(t('home.adminWelcome'));
        setShowAdminLogin(false);
        navigate('/admin');
      } else {
        toast.error(t('home.loginOrPasswordWrong'));
      }
    } catch (error) {
      toast.error(t('home.errorOccurred'));
    } finally {
      setAdminLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 relative overflow-x-hidden overflow-y-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">{t('common.appName')}</h1>
                <p className="text-[10px] sm:text-xs text-white/70 hidden sm:block">{t('home.subtitle')}</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <button
                onClick={() => { setAdminUsername(''); setAdminPassword(''); setShowAdminLogin(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-semibold text-sm shadow-lg shadow-black/10"
              >
                <Settings className="w-4 h-4" />
                <span>{t('home.adminPanel')}</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white/10 backdrop-blur-md border-t border-white/10 animate-fadeIn">
            <div className="px-4 py-3 space-y-2">
              <LanguageSwitcher className="justify-center" />
              <button
                onClick={() => { setAdminUsername(''); setAdminPassword(''); setShowAdminLogin(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-600 rounded-xl font-semibold shadow-lg text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>{t('home.adminPanel')}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>{t('home.fastSystem')}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            {t('home.selectCashier')}
          </h2>
          <p className="text-white/80 text-sm sm:text-base max-w-md mx-auto">
            {t('home.selectCashierDesc')}
          </p>
        </div>

        {/* Cashiers Grid */}
        {loadingCashiers ? (
          <div className="flex justify-center py-16">
            <div className="spinner spinner-lg spinner-white"></div>
          </div>
        ) : cashiers.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-white/50" />
            </div>
            <p className="text-white/90 text-base sm:text-lg font-medium mb-1">{t('home.noCashiers')}</p>
            <p className="text-white/60 text-sm">{t('home.addCashierHint')}</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-4xl w-full">
              {cashiers.map((cashier, index) => (
                <button
                  key={cashier._id}
                  onClick={() => handleCashierClick(cashier)}
                  className="group bg-white rounded-2xl shadow-xl shadow-black/10 overflow-hidden text-left transition-all duration-300 hover:shadow-2xl hover:shadow-black/15 hover:-translate-y-1 animate-scaleIn w-full active:scale-[0.98]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-5 sm:p-6 flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-300 group-hover:scale-105">
                        <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 text-center">{convertToLanguage(cashier.fullName, language)}</h3>
                    <p className="text-xs text-gray-500 mb-3">@{cashier.username}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Lock className="w-3 h-3" />
                      <span className="font-medium">{t('home.loginWithPassword')}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Kassir Login Modal */}
      {showCashierLogin && selectedCashier && (
        <div className="modal-overlay" onClick={() => setShowCashierLogin(false)}>
          <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-swipe-indicator sm:hidden" />
            <div className="gradient-primary p-6 sm:p-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-0.5">{convertToLanguage(selectedCashier.fullName, language)}</h3>
              <p className="text-emerald-100 text-sm">@{selectedCashier.username}</p>
            </div>
            <div className="p-5">
              <div className="input-group mb-5">
                <label className="label">{t('login.password')}</label>
                <div className="relative">
                  <input
                    type={showCashierPassword ? 'text' : 'password'}
                    value={cashierPassword}
                    onChange={(e) => setCashierPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCashierLogin()}
                    className="input pr-11"
                    placeholder={t('home.enterPassword')}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCashierPassword(!showCashierPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  >
                    {showCashierPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => setShowCashierLogin(false)} className="btn btn-md btn-secondary flex-1">
                  {t('common.cancel')}
                </button>
                <button onClick={handleCashierLogin} disabled={cashierLoginLoading} className="btn btn-md btn-primary flex-1">
                  {cashierLoginLoading ? <div className="spinner spinner-sm spinner-white" /> : <><Lock className="w-4 h-4" /> {t('login.signIn')}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="modal-overlay" onClick={() => setShowAdminLogin(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-swipe-indicator sm:hidden" />
            {/* Header with gradient */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="relative px-6 py-8 text-center text-white">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                  <Settings className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-1">{t('home.adminPanel')}</h3>
                <p className="text-slate-400 text-sm">{t('home.managementSystem')}</p>
              </div>
            </div>
            
            {/* Form */}
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">{t('login.username')}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-gray-900 text-sm"
                    placeholder="admin"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">{t('login.password')}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-gray-900 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button 
                  onClick={() => setShowAdminLogin(false)} 
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-semibold transition-all active:scale-[0.98] text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleAdminLogin} 
                  disabled={adminLoginLoading} 
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg shadow-slate-900/25 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                  {adminLoginLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {t('login.signIn')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
