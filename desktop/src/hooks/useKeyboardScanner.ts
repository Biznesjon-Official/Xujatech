/**
 * Хук для физического сканера (USB/Bluetooth)
 * Автоматически слушает ввод с клавиатуры
 */

import { useEffect, useRef, useCallback } from 'react';
import { handleScan, extractSearchCode, type ScanResult } from '../utils/scanner';

interface UseKeyboardScannerOptions {
  enabled?: boolean;
  onScan: (code: string, result: ScanResult) => void;
  bufferTimeout?: number; // Таймаут между нажатиями (мс)
}

export function useKeyboardScanner({
  enabled = true,
  onScan,
  bufferTimeout = 100,
}: UseKeyboardScannerOptions) {
  const bufferRef = useRef('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Игнорируем если фокус в input/textarea
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Сбрасываем таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (e.key === 'Enter') {
      // Enter = конец сканирования
      if (bufferRef.current.length > 3) {
        const raw = bufferRef.current;
        
        // Защита от дублей (один и тот же код в течение 1 секунды)
        const now = Date.now();
        if (raw !== lastScanRef.current || now - lastScanTimeRef.current > 1000) {
          lastScanRef.current = raw;
          lastScanTimeRef.current = now;
          
          const result = handleScan(raw);
          const searchCode = extractSearchCode(raw);
          onScan(searchCode, result);
        }
      }
      bufferRef.current = '';
    } else if (e.key.length === 1) {
      // Добавляем символ в буфер
      bufferRef.current += e.key;

      // Автосброс буфера через таймаут
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, bufferTimeout);
    }
  }, [onScan, bufferTimeout]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      bufferRef.current = '';
    };
  }, [enabled, handleKeyDown]);

  // Функция для ручного сброса буфера
  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { resetBuffer };
}

export default useKeyboardScanner;
