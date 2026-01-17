/**
 * Сканирование через физический сканер (USB/Bluetooth)
 * Работает через перехват клавиатурного ввода
 * Сканер отправляет символы + Enter в конце
 */

import type { ScanCallback, StopFunction } from './types';

let buffer = '';
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

// Таймаут сброса буфера (мс) - если между нажатиями больше этого времени, буфер сбрасывается
const BUFFER_TIMEOUT = 100;

/**
 * Инициализирует слушатель для физического сканера
 * @param onScan - callback при успешном сканировании
 * @returns функция для отключения слушателя
 */
export function initKeyboardScanner(onScan: ScanCallback): StopFunction {
  // Очищаем предыдущий обработчик если есть
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
  }

  buffer = '';

  keydownHandler = (e: KeyboardEvent) => {
    // Игнорируем если фокус в input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Сбрасываем таймаут
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (e.key === 'Enter') {
      // Enter = конец сканирования
      if (buffer.length > 3) {
        onScan(buffer);
      }
      buffer = '';
    } else if (e.key.length === 1) {
      // Добавляем символ в буфер
      buffer += e.key;

      // Автосброс буфера через таймаут (защита от случайного ввода)
      timeoutId = setTimeout(() => {
        buffer = '';
      }, BUFFER_TIMEOUT);
    }
  };

  window.addEventListener('keydown', keydownHandler);

  return () => {
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    buffer = '';
  };
}

/**
 * Останавливает слушатель клавиатуры
 */
export function stopKeyboardScanner(): void {
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  buffer = '';
}
