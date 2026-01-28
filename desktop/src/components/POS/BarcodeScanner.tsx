/**
 * Компонент сканера для POS
 * Моментальная реакция + звук + toast
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../i18n';
import { startCameraScanner, stopCameraScanner } from '../../utils/scanner';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

// Звук сканирования (beep)
const playBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 100);
  } catch (e) {
    // Игнорируем если звук не поддерживается
  }
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);

  // Ref larni yangilash
  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    console.log('🎥 Scanner ochilmoqda...');
    let active = true;
    scannedRef.current = false;
    setScanning(true);
    setError(null);

    const start = async () => {
      try {
        console.log('📹 Kamera ishga tushirilmoqda...');
        await startCameraScanner(videoRef.current!, (code) => {
          if (!active || scannedRef.current) {
            console.log('⚠️ Kod o\'qildi lekin ignore qilindi (active:', active, 'scanned:', scannedRef.current, ')');
            return;
          }
          scannedRef.current = true;
          
          console.log('✅ Kod muvaffaqiyatli o\'qildi:', code);
          
          // Моментальная реакция
          playBeep();
          toast.success(t('pos.codeScanned') + `: ${code.substring(0, 20)}...`, { duration: 1500 });
          
          // Останавливаем и передаём
          stopCameraScanner();
          setScanning(false);
          onScanRef.current(code);
          onCloseRef.current();
        });
        console.log('✅ Kamera muvaffaqiyatli ishga tushdi');
      } catch (err: any) {
        console.error('❌ Kamera xatosi:', err);
        setScanning(false);
        if (err.name === 'NotAllowedError') {
          setError(t('scanner.permissionDenied'));
        } else if (err.name === 'NotFoundError') {
          setError(t('scanner.cameraNotFound'));
        } else {
          setError(t('scanner.cameraError'));
        }
      }
    };

    start();

    return () => {
      console.log('🛑 Scanner yopilmoqda (cleanup)');
      active = false;
      stopCameraScanner();
      setScanning(false);
    };
  }, [isOpen]); // onScan va onClose ni dependency dan olib tashladik

  const handleClose = () => {
    stopCameraScanner();
    setScanning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-lg">{t('pos.scanProduct')}</h2>
          {scanning && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 rounded-full">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-cyan-400 text-sm">{t('pos.scanning')}...</span>
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-white/60 text-sm mb-4">
              {t('scanner.usePhysicalScanner')}
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Рамка сканирования */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-72 h-48">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                
                {/* Анимированная линия */}
                <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
              </div>
            </div>

            {/* Подсказка внизу */}
            <div className="absolute bottom-20 left-0 right-0 text-center">
              <p className="text-white/80 text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                {t('pos.pointCameraToBarcode')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-black/80">
        <div className="text-center">
          <p className="text-white/40 text-xs">
            GS1 DataMatrix • EAN • QR • Code128
          </p>
        </div>
      </div>

      {/* CSS для анимации */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; opacity: 1; }
          50% { top: calc(100% - 4px); opacity: 0.5; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
