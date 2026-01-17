/**
 * Universal Scanner - barcha turdagi shtrix-kodlarni qayta ishlash
 */

import { ScanResult, ScanStatus } from './types';

/**
 * Shtrix-kod turini aniqlash
 */
function detectBarcodeType(code: string): ScanResult['type'] {
  const cleaned = code.replace(/\s/g, '');
  
  if (/^\d{13}$/.test(cleaned)) return 'EAN13';
  if (/^\d{8}$/.test(cleaned)) return 'EAN8';
  if (/^\d{12}$/.test(cleaned)) return 'UPC';
  if (/^[A-Za-z0-9\-\.\/\+\%\$\s]+$/.test(cleaned)) return 'CODE128';
  
  return 'UNKNOWN';
}

/**
 * EAN/UPC checksum tekshirish
 */
function validateChecksum(code: string): boolean {
  const digits = code.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}

/**
 * Skanerlangan kodni qayta ishlash
 */
export function handleScan(raw: string): ScanResult {
  const trimmed = raw.trim();
  
  if (!trimmed) {
    return {
      raw,
      isValid: false,
      status: 'EMPTY',
      type: 'UNKNOWN',
      data: {}
    };
  }

  const type = detectBarcodeType(trimmed);
  let isValid = true;
  let status: ScanStatus = 'VALID';

  // EAN/UPC uchun checksum tekshirish
  if (['EAN13', 'EAN8', 'UPC'].includes(type)) {
    isValid = validateChecksum(trimmed);
    status = isValid ? 'VALID' : 'INVALID_FORMAT';
  }

  return {
    raw,
    isValid,
    status,
    type,
    data: {
      barcode: trimmed
    }
  };
}

/**
 * Qidiruv uchun kod ajratib olish
 */
export function extractSearchCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  
  // Faqat raqamlar va harflarni qoldirish
  return trimmed.replace(/[^a-zA-Z0-9]/g, '') || null;
}

export * from './types';
