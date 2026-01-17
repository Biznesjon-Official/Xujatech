import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Store, 
  Receipt, 
  Save, 
  RefreshCw,
  Printer,
  Smartphone,
  Download,
  Wifi,
  WifiOff,
  Trash2,
  HardDrive,
  Cloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage, LanguageSwitcher } from '../i18n';
import { usePWA, useOfflineStorage } from '../hooks/usePWA';

// Sozlamalar interfeysi
interface ReceiptSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeLogo: string;
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showBarcode: boolean;
  paperWidth: number;
}

interface GeneralSettings {
  currency: string;
  taxRate: string;
  lowStockThreshold: string;
  autoSyncInterval: string;
}

type SettingsTab = 'general' | 'receipt' | 'printer' | 'language' | 'pwa';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();
  
  // PWA hooks
  const { isInstalled, isInstallable, isOnline, isUpdateAvailable, install, update, clearCache } = usePWA();
  const { syncOfflineData, isReady: offlineReady } = useOfflineStorage();
  const [syncing, setSyncing] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>('Hisoblanmoqda...');

  // General settings
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    currency: 'UZS',
    taxRate: '0',
    lowStockThreshold: '5',
    autoSyncInterval: '300'
  });

  // Receipt settings
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    storeName: 'XUJATECh Store',
    storeAddress: '',
    storePhone: '',
    storeLogo: '',
    headerText: 'Home Appliances',
    footerText: 'Thank you for your business!',
    showLogo: true,
    showBarcode: true,
    paperWidth: 80
  });

  // Sozlamalarni yuklash
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load general settings
      const generalRes = await fetch('/api/settings', { headers });
      const generalData = await generalRes.json();
      if (generalData.success) {
        setGeneralSettings({
          currency: generalData.data.currency || 'UZS',
          taxRate: generalData.data.tax_rate || '0',
          lowStockThreshold: generalData.data.low_stock_threshold || '5',
          autoSyncInterval: generalData.data.auto_sync_interval || '300'
        });
      }

      // Load receipt settings
      const receiptRes = await fetch('/api/settings/receipt', { headers });
      const receiptData = await receiptRes.json();
      if (receiptData.success) {
        setReceiptSettings(receiptData.data);
      }
    } catch (error) {
      console.error('Settings load error:', error);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  // Umumiy sozlamalarni saqlash
  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const settings = [
        { key: 'currency', value: generalSettings.currency },
        { key: 'tax_rate', value: generalSettings.taxRate },
        { key: 'low_stock_threshold', value: generalSettings.lowStockThreshold },
        { key: 'auto_sync_interval', value: generalSettings.autoSyncInterval }
      ];

      for (const setting of settings) {
        await fetch(`/api/settings/${setting.key}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ value: setting.value })
        });
      }

      toast.success(t('settings.settingsSaved'));
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  // Chek sozlamalarini saqlash
  const saveReceiptSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/receipt', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(receiptSettings)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(t('settings.settingsSaved'));
      } else {
        toast.error(data.message || t('errors.somethingWentWrong'));
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('errors.somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  // Tab'lar
  const tabs = [
    { id: 'general', label: t('settings.general'), icon: SettingsIcon },
    { id: 'receipt', label: t('settings.receipt'), icon: Receipt },
    { id: 'printer', label: t('settings.printer'), icon: Printer },
    { id: 'language', label: t('common.language'), icon: SettingsIcon },
    { id: 'pwa', label: 'PWA', icon: Smartphone }
  ];

  // Kesh hajmini hisoblash
  useEffect(() => {
    const calculateCacheSize = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
        setCacheSize(`${usedMB} MB / ${quotaMB} MB`);
      }
    };
    calculateCacheSize();
  }, []);

  // Offline ma'lumotlarni sinxronlash
  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncOfflineData();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Sinxronlash xatosi');
    } finally {
      setSyncing(false);
    }
  };

  // Keshni tozalash
  const handleClearCache = async () => {
    if (!window.confirm('Barcha keshlangan ma\'lumotlar o\'chiriladi. Davom etasizmi?')) return;
    
    try {
      await clearCache();
      toast.success('Kesh tozalandi');
      setCacheSize('0 MB');
    } catch (error) {
      toast.error('Keshni tozalashda xatolik');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">{t('common.loading')}...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('nav.settings')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('settings.title')}</p>
          </div>
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6 pb-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Store className="w-5 h-5 text-emerald-600" />
                </div>
                {t('settings.general')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valyuta
                  </label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="UZS">UZS - O'zbek so'mi</option>
                    <option value="USD">USD - AQSh dollari</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Soliq stavkasi (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={generalSettings.taxRate}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, taxRate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kam qolgan mahsulot chegarasi
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={generalSettings.lowStockThreshold}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, lowStockThreshold: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Avtomatik sinxronizatsiya (soniya)
                  </label>
                  <input
                    type="number"
                    min="60"
                    value={generalSettings.autoSyncInterval}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, autoSyncInterval: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveGeneralSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Settings */}
        {activeTab === 'receipt' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  {t('settings.receipt')}
                </h2>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Do'kon nomi
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.storeName}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, storeName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Manzil
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.storeAddress}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, storeAddress: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.storePhone}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, storePhone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sarlavha matni
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.headerText}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pastki matn
                  </label>
                  <input
                    type="text"
                    value={receiptSettings.footerText}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Qog'oz kengligi
                  </label>
                  <select
                    value={receiptSettings.paperWidth}
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, paperWidth: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value={58}>58mm</option>
                    <option value={80}>80mm</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={receiptSettings.showLogo}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, showLogo: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Logoni ko'rsatish</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={receiptSettings.showBarcode}
                      onChange={(e) => setReceiptSettings({ ...receiptSettings, showBarcode: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Shtrix-kodni ko'rsatish</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={saveReceiptSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                  {t('common.save')}
                </button>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">{t('settings.receipt')}</h2>
            <div 
              className="bg-gray-100 p-4 rounded-lg overflow-auto"
              style={{ maxHeight: '500px' }}
            >
              <div 
                className="bg-white border border-gray-300 p-4 font-mono text-sm mx-auto"
                style={{ width: receiptSettings.paperWidth === 58 ? '220px' : '300px' }}
              >
                <div className="text-center mb-3">
                  {receiptSettings.showLogo && <div className="text-2xl mb-1">🏪</div>}
                  <div className="font-bold">{receiptSettings.storeName}</div>
                  {receiptSettings.headerText && (
                    <div className="text-xs text-gray-600">{receiptSettings.headerText}</div>
                  )}
                  {receiptSettings.storeAddress && (
                    <div className="text-xs">{receiptSettings.storeAddress}</div>
                  )}
                  {receiptSettings.storePhone && (
                    <div className="text-xs">Tel: {receiptSettings.storePhone}</div>
                  )}
                </div>
                <div className="border-t border-dashed my-2"></div>
                <div className="text-xs">
                  <div>Chek: #SAMPLE001</div>
                  <div>Sana: {new Date().toLocaleDateString()}</div>
                </div>
                <div className="border-t border-dashed my-2"></div>
                <div className="text-xs">
                  <div>Namuna mahsulot</div>
                  <div className="flex justify-between">
                    <span>1 x 1,000,000</span>
                    <span>1,000,000</span>
                  </div>
                </div>
                <div className="border-t border-dashed my-2"></div>
                <div className="flex justify-between font-bold">
                  <span>{t('common.total')}:</span>
                  <span>1,000,000 UZS</span>
                </div>
                <div className="border-t border-dashed my-2"></div>
                {receiptSettings.showBarcode && (
                  <div className="text-center text-xs my-2">||||| SAMPLE001 |||||</div>
                )}
                {receiptSettings.footerText && (
                  <div className="text-center text-xs text-gray-600">{receiptSettings.footerText}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printer Settings */}
      {activeTab === 'printer' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Printer className="w-5 h-5 text-green-600" />
            {t('settings.printer')}
          </h2>
          
          <div className="text-center py-8 text-gray-500">
            <Printer className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>{t('common.notFound')}</p>
          </div>
        </div>
      )}

      {/* Language Settings */}
      {activeTab === 'language' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-xl">
                <SettingsIcon className="w-5 h-5 text-purple-600" />
              </div>
              {t('settings.language')}
            </h2>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-4">{t('settings.selectLanguage')}:</p>
            <LanguageSwitcher className="justify-start" />
          </div>
        </div>
      )}

      {/* PWA Settings */}
      {activeTab === 'pwa' && (
        <div className="space-y-6">
          {/* PWA Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="p-2 bg-cyan-100 rounded-xl">
                  <Smartphone className="w-5 h-5 text-cyan-600" />
                </div>
                PWA Holati
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* O'rnatilganlik */}
                <div className={`p-4 rounded-xl border-2 ${isInstalled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isInstalled ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">O'rnatilgan</p>
                      <p className={`text-lg font-bold ${isInstalled ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {isInstalled ? 'Ha' : 'Yo\'q'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Internet holati */}
                <div className={`p-4 rounded-xl border-2 ${isOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                      {isOnline ? <Wifi className="w-5 h-5 text-white" /> : <WifiOff className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Internet</p>
                      <p className={`text-lg font-bold ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kesh hajmi */}
                <div className="p-4 rounded-xl border-2 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500">
                      <HardDrive className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Kesh hajmi</p>
                      <p className="text-lg font-bold text-blue-600">{cacheSize}</p>
                    </div>
                  </div>
                </div>

                {/* Offline storage */}
                <div className={`p-4 rounded-xl border-2 ${offlineReady ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${offlineReady ? 'bg-purple-500' : 'bg-gray-400'}`}>
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Offline Storage</p>
                      <p className={`text-lg font-bold ${offlineReady ? 'text-purple-600' : 'text-gray-500'}`}>
                        {offlineReady ? 'Tayyor' : 'Yuklanmoqda'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PWA Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold">Amallar</h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* O'rnatish */}
              {!isInstalled && isInstallable && (
                <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                  <div className="flex items-center gap-3">
                    <Download className="w-6 h-6 text-cyan-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Ilovani o'rnatish</p>
                      <p className="text-sm text-gray-600">Qurilmangizga o'rnatib, tezroq kirish imkoniyatiga ega bo'ling</p>
                    </div>
                  </div>
                  <button
                    onClick={install}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-600 transition-colors"
                  >
                    O'rnatish
                  </button>
                </div>
              )}

              {/* Yangilash */}
              {isUpdateAvailable && (
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Yangi versiya mavjud</p>
                      <p className="text-sm text-gray-600">Ilovani yangilash uchun tugmani bosing</p>
                    </div>
                  </div>
                  <button
                    onClick={update}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Yangilash
                  </button>
                </div>
              )}

              {/* Sinxronlash */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Offline ma'lumotlarni sinxronlash</p>
                    <p className="text-sm text-gray-600">Offline rejimda saqlangan savdolarni serverga yuborish</p>
                  </div>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing || !isOnline}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Sinxronlash
                </button>
              </div>

              {/* Keshni tozalash */}
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Keshni tozalash</p>
                    <p className="text-sm text-gray-600">Barcha keshlangan ma'lumotlarni o'chirish</p>
                  </div>
                </div>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Tozalash
                </button>
              </div>
            </div>
          </div>

          {/* PWA Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-semibold">PWA haqida</h2>
            </div>
            
            <div className="p-6">
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>
                  <strong>Progressive Web App (PWA)</strong> - bu veb-ilova bo'lib, u mobil ilovalar kabi ishlaydi.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Qurilmangizga o'rnatish mumkin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Offline rejimda ishlaydi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Push bildirishnomalarni qo'llab-quvvatlaydi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Avtomatik yangilanadi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Tez yuklanadi (keshlash orqali)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Settings;
