/**
 * Парсер кодов для POS
 * Правильная обработка GS1 DataMatrix с управляющими символами
 */

import type { ScanCodeType, ScanResult } from './types';

/**
 * Извлекает GTIN из любого формата кода
 * ПРАВИЛЬНАЯ ВЕРСИЯ для реальных GS1 DataMatrix
 */
export function extractGTIN(raw: string): string | null {
  if (!raw) return null;
  
  // Убираем GS (ASCII 29) и другие управляющие символы
  const cleaned = raw.replace(/[\x1D\x00-\x1F]/g, '');
  
  // 1. Ищем AI 01 + 14 цифр (GS1 DataMatrix / Digital Link)
  const match = cleaned.match(/01(\d{14})/);
  if (match) {
    return match[1];
  }
  
  // 2. GS1 Digital Link URL
  if (cleaned.startsWith('http')) {
    const urlMatch = cleaned.match(/\/01\/(\d{14})/);
    if (urlMatch) return urlMatch[1];
    
    try {
      const url = new URL(cleaned);
      const gtin = url.searchParams.get('01');
      if (gtin && /^\d{14}$/.test(gtin)) return gtin;
    } catch {}
  }
  
  // 3. EAN-13 → GTIN-14
  if (/^\d{13}$/.test(cleaned)) {
    return '0' + cleaned;
  }
  
  // 4. EAN-8 → GTIN-14
  if (/^\d{8}$/.test(cleaned)) {
    return '000000' + cleaned;
  }
  
  // 5. Уже GTIN-14
  if (/^\d{14}$/.test(cleaned)) {
    return cleaned;
  }
  
  // 6. GTIN-12 (UPC-A) → GTIN-14
  if (/^\d{12}$/.test(cleaned)) {
    return '00' + cleaned;
  }
  
  return null;
}

/**
 * Определяет тип кода
 */
export function detectCodeType(raw: string): ScanCodeType {
  if (!raw) return 'QR';
  
  const cleaned = raw.replace(/[\x1D\x00-\x1F]/g, '');
  
  if (cleaned.startsWith('http')) return 'GS1_DL';
  if (/01\d{14}/.test(cleaned)) return 'GS1_DM';
  if (/^\d{8,14}$/.test(cleaned)) return 'BARCODE';
  
  return 'QR';
}

/**
 * Главная функция обработки сканирования
 */
export function handleScan(raw: string): ScanResult {
  const type = detectCodeType(raw);
  const gtin = extractGTIN(raw);
  
  return {
    type,
    raw,
    gtin: gtin || undefined,
  };
}

/**
 * Извлекает код для поиска в базе
 */
export function extractSearchCode(raw: string): string {
  const gtin = extractGTIN(raw);
  
  if (gtin) {
    return gtin;
  }
  
  // Для QR/текста — ищем числовой код
  const cleaned = raw.replace(/[\x1D\x00-\x1F]/g, '');
  const numericMatch = cleaned.match(/\d{8,14}/);
  if (numericMatch) {
    return numericMatch[0];
  }
  
  return cleaned.trim();
}

/**
 * Форматирует результат
 */
export function formatScanResult(result: ScanResult): {
  type: string;
  status: string;
} {
  const typeLabels: Record<ScanCodeType, string> = {
    'GS1_DL': 'GS1 Digital Link',
    'GS1_DM': 'GS1 DataMatrix',
    'BARCODE': 'Штрих-код',
    'QR': 'QR-код',
  };
  
  return {
    type: typeLabels[result.type],
    status: 'Код считан',
  };
}
