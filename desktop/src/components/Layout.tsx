import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { useLanguage } from '../i18n';
import { convertToLanguage } from '../utils/transliterate';
import PendingReceiptsMonitor from './Receipts/PendingReceiptsMonitor';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CreditCard,
  Building2,
  Truck,
  Warehouse,
  RotateCcw,
  History,
  FileText,
} from 'lucide-react';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { pendingOperations } = useSelector((state: RootState) => state.sync);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, labelKey: 'statistics.title', roles: ['admin', 'manager', 'cashier'] },
    { path: '/admin/cashiers', icon: UserCog, labelKey: 'cashiers.title', roles: ['admin', 'manager'] },
    { path: '/admin/branches', icon: Building2, labelKey: 'branches.title', roles: ['admin', 'manager'] },
    { path: '/admin/warehouses', icon: Warehouse, labelKey: 'warehouses.title', roles: ['admin', 'manager'] },
    { path: '/admin/products', icon: Package, labelKey: 'nav.products', roles: ['admin', 'manager'] },
    { path: '/admin/deliveries', icon: Truck, labelKey: 'deliveries.title', roles: ['admin', 'manager'] },
    { path: '/admin/returns', icon: RotateCcw, labelKey: 'returns.title', roles: ['admin', 'manager'] },
    { path: '/admin/debts', icon: CreditCard, labelKey: 'debts.title', roles: ['admin', 'manager'] },
    { path: '/admin/receipts', icon: FileText, labelKey: 'Cheklar', roles: ['admin', 'manager'] },
    { path: '/admin/history', icon: History, labelKey: 'Tarix', roles: ['admin', 'manager'] },
    { path: '/admin/customers', icon: Users, labelKey: 'nav.customers', roles: ['admin', 'manager', 'cashier'] },
    { path: '/admin/settings', icon: Settings, labelKey: 'nav.settings', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter((item) => user && item.roles.includes(user.role));

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find((item) => item.path === location.pathname);
    return currentItem ? t(currentItem.labelKey) : t('common.appName');
  };

  if (!isAuthenticated || !user) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen h-[100dvh] bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar hidden md:flex w-64 bg-white flex-col border-r border-gray-100">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">{t('common.appName')}</h1>
              <p className="text-[11px] text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-semibold text-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{convertToLanguage(user.fullName, language)}</p>
              <p className="text-[11px] text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <div className="space-y-0.5">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-emerald-100' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm flex-1">{t(item.labelKey)}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setLanguage('lat')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                language === 'lat'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lotin
            </button>
            <button
              onClick={() => setLanguage('cyr')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                language === 'cyr'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Кирилл
            </button>
          </div>

          {pendingOperations > 0 && (
            <div className="px-3 py-2 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700 font-medium">
                {pendingOperations} ta sinxronlanmagan
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 z-40 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-gray-900">{getCurrentPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Compact Language Switcher */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setLanguage('lat')}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                  language === 'lat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Lat
              </button>
              <button
                onClick={() => setLanguage('cyr')}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all ${
                  language === 'cyr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Кир
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors active:scale-95"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide Menu */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[280px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-100 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 font-semibold">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{convertToLanguage(user.fullName, language)}</p>
                <p className="text-[11px] text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="py-3 px-2 flex-1 overflow-y-auto">
          <div className="space-y-0.5">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                    isActive ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{t(item.labelKey)}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white safe-area-bottom">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 rounded-xl font-semibold hover:bg-red-100 transition-colors active:scale-[0.98] text-sm"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden h-[52px]" />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>

      {/* Pending Receipts Monitor */}
      <PendingReceiptsMonitor />
    </div>
  );
};

export default Layout;
