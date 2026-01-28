/**
 * Yangi mahsulot qo'shish uchun skaner
 * 
 * Bazadan mahsulot qidirmaydi
 * Haqiqiylikni tekshirmaydi
 * Faqat kodni tahlil qiladi va formani to'ldiradi
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle, Loader2, Package, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../i18n';
import { startCameraScanner, stopCameraScanner, parseGS1Code, type GS1ParseResult } from '../../utils/scanner';

interface ProductScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: GS1ParseResult) => void;
}

// Skanerlash ovozi
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1800;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 100);
  } catch {}
};

const ProductScanner: React.FC<ProductScannerProps> = ({
  isOpen,
  onClose,
  onScanComplete,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<GS1ParseResult | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    let active = true;
    scannedRef.current = false;
    setScanning(true);
    setError(null);
    setScannedData(null);

    const start = async () => {
      try {
        if (!active || !videoRef.current) return;
        
        await startCameraScanner(videoRef.current, (raw) => {
          if (!active || scannedRef.current) return;
          
          // Bo'sh yoki juda qisqa kodlarni e'tiborsiz qoldirish
          if (!raw || raw.trim().length < 3) return;
          
          scannedRef.current = true;

          // Kodni tahlil qilish
          const parsed = parseGS1Code(raw);
          
          playBeep();
          setScannedData(parsed);
          setScanning(false);
          stopCameraScanner();
          
          toast.success(t('pos.codeScanned'), { duration: 2000 });
        });
      } catch (err: any) {
        console.error('Kamera xatoligi:', err);
        setScanning(false);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError(t('scanner.permissionDenied'));
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError(t('scanner.cameraNotFound'));
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError(t('scanner.cameraBusy'));
        } else if (err.name === 'OverconstrainedError') {
          setError(t('scanner.cameraNotSupported'));
        } else {
          setError(t('scanner.cameraError') + ': ' + (err.message || t('common.unknownError')));
        }
      }
    };

    start();

    return () => {
      active = false;
      stopCameraScanner();
      setScanning(false);
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (scannedData) {
      onScanComplete(scannedData);
      onClose();
    }
  };

  const handleRescan = async () => {
    setScannedData(null);
    scannedRef.current = false;
    setScanning(true);
    setError(null);
    
    if (videoRef.current) {
      try {
        await startCameraScanner(videoRef.current, (raw) => {
          if (scannedRef.current) return;
          if (!raw || raw.trim().length < 3) return;
          
          scannedRef.current = true;
          
          const parsed = parseGS1Code(raw);
          playBeep();
          setScannedData(parsed);
          setScanning(false);
          stopCameraScanner();
          toast.success(t('pos.codeScanned'), { duration: 2000 });
        });
      } catch (err: any) {
        setScanning(false);
        setError(t('scanner.cameraRestartError'));
      }
    }
  };

  const handleClose = () => {
    stopCameraScanner();
    setScanning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Sarlavha */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-white font-semibold">{t('pos.scanProduct')}</h2>
            <p className="text-white/70 text-xs">{t('products.addProduct')}</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Kontent */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error ? (
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-white/60 text-sm mb-4">{t('scanner.usePhysicalScanner')}</p>
            <button onClick={handleClose} className="px-4 py-2 bg-white/10 rounded-lg text-white">
              {t('common.close')}
            </button>
          </div>
        ) : scannedData ? (
          /* Skanerlash natijasi */
          <div className="w-full max-w-md mx-4 bg-gray-900 rounded-2xl overflow-hidden">
            <div className="p-4 bg-emerald-500/20 border-b border-emerald-500/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-semibold">{t('pos.codeScanned')}</p>
                  <p className="text-emerald-400/60 text-xs">{t('pos.dataReadyForForm')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Raw kod - asl o'qilgan ma'lumot */}
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400 text-sm">{t('pos.scannedCode')}</span>
                <span className="text-white font-mono text-sm break-all max-w-[200px] text-right">
                  {scannedData.raw}
                </span>
              </div>
              
              {/* GTIN / Barcode */}
              {scannedData.gtin && scannedData.gtin !== scannedData.raw && (
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">GTIN</span>
                  <span className="text-white font-mono text-sm">
                    {scannedData.gtin}
                  </span>
                </div>
              )}
              
              {/* Shtrix-kod (agar GTIN dan farq qilsa) */}
              {scannedData.barcode && scannedData.barcode !== scannedData.raw && scannedData.barcode !== scannedData.gtin && (
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">{t('products.barcode')}</span>
                  <span className="text-white font-mono text-sm">
                    {scannedData.barcode}
                  </span>
                </div>
              )}
              
              {/* Serial */}
              {scannedData.serial && (
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">{t('pos.serialNumber')}</span>
                  <span className="text-white font-mono text-sm">{scannedData.serial}</span>
                </div>
              )}
              
              {/* Batch */}
              {scannedData.batch && (
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">{t('pos.batch')}</span>
                  <span className="text-white font-mono text-sm">{scannedData.batch}</span>
                </div>
              )}
              
              {/* Expiry */}
              {scannedData.expiryFormatted && (
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400 text-sm">{t('pos.expiryDate')}</span>
                  <span className="text-white font-mono text-sm">{scannedData.expiryFormatted}</span>
                </div>
              )}
            </div>
            
            <div className="p-4 flex gap-3">
              <button
                onClick={handleRescan}
                className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600"
              >
                {t('pos.rescan')}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
              >
                {t('pos.addToForm')}
              </button>
            </div>
          </div>
        ) : (
          /* Kamera */
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Ramka */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-72 h-48">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              </div>
            </div>

            {/* Holat */}
            {scanning && (
              <div className="absolute bottom-24 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/70 rounded-full">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-white text-sm">{t('pos.scanning')}...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pastki qism */}
      {!scannedData && !error && (
        <div className="p-4 bg-black/80">
          <p className="text-center text-white/60 text-sm">
            {t('pos.pointCameraToBarcode')}
          </p>
          <p className="text-center text-white/40 text-xs mt-1">
            GS1 DataMatrix • EAN • QR • Code128
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductScanner;
