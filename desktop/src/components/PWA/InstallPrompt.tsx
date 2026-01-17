import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface InstallPromptProps {
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onDismiss }) => {
  const { isInstallable, isInstalled, install } = usePWA();
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS tekshirish
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Ko'rsatish kerakligini tekshirish
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    if (!isInstalled && (isInstallable || iOS) && (!dismissed || daysPassed > 7)) {
      setTimeout(() => setShow(true), 3000);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    onDismiss?.();
  };

  if (!show || isInstalled) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyan-500 to-teal-600 p-6 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-cyan-500" viewBox="0 0 100 100">
                <rect width="100" height="100" rx="20" fill="currentColor" opacity="0.1"/>
                <path d="M30 25h40a5 5 0 015 5v40a5 5 0 01-5 5H30a5 5 0 01-5-5V30a5 5 0 015-5z" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path d="M35 40h30M35 50h30M35 60h15" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="60" cy="60" r="5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">XUJATECH POS</h2>
              <p className="text-white/80 text-sm">Ilovani o'rnating</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Ilovani qurilmangizga o'rnatib, tezroq kirish va offline rejimda ishlash imkoniyatiga ega bo'ling.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-cyan-600" />
              </div>
              <span>Bosh ekrandan tez kirish</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-4 h-4 text-emerald-600" />
              </div>
              <span>To'liq ekran rejimi</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4 text-purple-600" />
              </div>
              <span>Offline rejimda ishlash</span>
            </div>
          </div>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">iOS da o'rnatish:</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Safari da <Share className="w-4 h-4 inline text-blue-500" /> tugmasini bosing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>"Add to Home Screen" ni tanlang</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>"Add" tugmasini bosing</span>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Keyinroq
            </button>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                O'rnatish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
