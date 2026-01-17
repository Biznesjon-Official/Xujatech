/**
 * Universal skanerlash uchun React-hook
 * Klaviatura (skaner-pistolet) va kameradan kiritishni qo'llab-quvvatlaydi
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ScanResult } from '../utils/universalScanner/types';
import { handleScan, extractSearchCode } from '../utils/universalScanner';

interface UseUniversalScannerOptions {
  enabled?: boolean;
  keyboardTimeout?: number;  // Bosishlar orasidagi kutish vaqti (ms)
  onScan?: (result: ScanResult, searchCode: string | null) => void;
  onError?: (error: string) => void;
  excludeInputs?: boolean;   // input/textarea da kiritishni e'tiborsiz qoldirish
}

interface UseUniversalScannerReturn {
  lastScan: ScanResult | null;
  lastSearchCode: string | null;
  isScanning: boolean;
  processScan: (raw: string) => ScanResult;
  clearLastScan: () => void;
}

/**
 * Klaviaturadan skanerlashni qayta ishlash uchun hook
 */
export function useUniversalScanner(
  options: UseUniversalScannerOptions = {}
): UseUniversalScannerReturn {
  const {
    enabled = true,
    keyboardTimeout = 50,
    onScan,
    onError,
    excludeInputs = true,
  } = options;

  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [lastSearchCode, setLastSearchCode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Skanerlash satrini qayta ishlash
   */
  const processScan = useCallback((raw: string): ScanResult => {
    const result = handleScan(raw);
    const searchCode = extractSearchCode(raw);

    setLastScan(result);
    setLastSearchCode(searchCode);

    if (onScan) {
      onScan(result, searchCode);
    }

    if (!result.isValid && result.status === 'INVALID_FORMAT' && onError) {
      onError('Kod formati noto\'g\'ri');
    }

    return result;
  }, [onScan, onError]);

  /**
   * Oxirgi natijani tozalash
   */
  const clearLastScan = useCallback(() => {
    setLastScan(null);
    setLastSearchCode(null);
  }, []);

  /**
   * Tugma bosish hodisasini qayta ishlash (skaner-pistolet uchun)
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // input/textarea da fokus bo'lsa e'tiborsiz qoldirish
      if (excludeInputs) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Modifikatorlarni e'tiborsiz qoldirish
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Enter - skanerlashni yakunlash
      if (e.key === 'Enter') {
        if (bufferRef.current.length > 0) {
          e.preventDefault();
          setIsScanning(false);
          processScan(bufferRef.current);
          bufferRef.current = '';
        }
        return;
      }

      // Belgi bufferga qo'shiladi
      if (e.key.length === 1) {
        setIsScanning(true);
        bufferRef.current += e.key;

        // Taymerni qayta o'rnatish
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Avtomatik yakunlash uchun taymer o'rnatish
        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length > 0) {
            setIsScanning(false);
            processScan(bufferRef.current);
            bufferRef.current = '';
          }
        }, keyboardTimeout);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, keyboardTimeout, excludeInputs, processScan]);

  return {
    lastScan,
    lastSearchCode,
    isScanning,
    processScan,
    clearLastScan,
  };
}

export default useUniversalScanner;
