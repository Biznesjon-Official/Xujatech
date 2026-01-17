import React from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isUpdateAvailable, update } = usePWA();

  if (isOnline && !isUpdateAvailable) return null;

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 z-50 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span>Offline rejim - Ma'lumotlar keyinroq sinxronlanadi</span>
        </div>
      )}

      {/* Update Available Banner */}
      {isUpdateAvailable && (
        <div className="fixed top-0 left-0 right-0 bg-cyan-500 text-white px-4 py-2 z-50 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
          <RefreshCw className="w-4 h-4" />
          <span>Yangi versiya mavjud</span>
          <button
            onClick={update}
            className="px-3 py-1 bg-white text-cyan-600 rounded-lg font-semibold hover:bg-cyan-50 transition-colors"
          >
            Yangilash
          </button>
        </div>
      )}
    </>
  );
};

// Floating offline indicator (kichik)
export const OfflineBadge: React.FC = () => {
  const { isOnline } = usePWA();

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-all z-40 ${
        isOnline
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </>
      ) : (
        <>
          <CloudOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
