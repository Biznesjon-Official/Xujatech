/**
 * Сервис обработки сканирования для POS
 * 
 * Логика как в реальных кассах:
 * скан → извлечение GTIN → поиск в СВОЕЙ базе → результат
 * 
 * НЕ использует внешние базы!
 */

import { handleScan, extractGTIN, extractSearchCode } from '../utils/scanner';
import apiService from './ApiService';

export interface FoundProduct {
  found: true;
  product: {
    id: string;
    barcode: string;
    name: string;
    sellingPrice: number;
    currentStock: number;
    unit?: string;
  };
  searchCode: string;
}

export interface NotFoundProduct {
  found: false;
  searchCode: string;
  message: string;
}

export type ScanSearchResult = FoundProduct | NotFoundProduct;

/**
 * Обрабатывает результат сканирования
 * Извлекает GTIN и ищет в базе
 */
export async function handleScanResult(rawCode: string): Promise<ScanSearchResult> {
  // 1. Извлекаем GTIN
  const gtin = extractGTIN(rawCode);
  const searchCode = gtin || extractSearchCode(rawCode);
  
  console.log('🔍 Scan:', rawCode);
  console.log('📦 GTIN:', gtin);
  console.log('🔎 Search code:', searchCode);
  
  if (!searchCode) {
    return {
      found: false,
      searchCode: rawCode,
      message: `Товар не найден. Код: ${rawCode}`,
    };
  }

  // 2. Ищем в базе
  try {
    // Пробуем найти по извлечённому коду
    let product = await apiService.getProductByBarcode(searchCode);
    
    // Если не нашли и есть GTIN — пробуем варианты
    if (!product && gtin) {
      // Без ведущих нулей
      const gtinNoZeros = gtin.replace(/^0+/, '');
      if (gtinNoZeros !== searchCode) {
        product = await apiService.getProductByBarcode(gtinNoZeros);
      }
      
      // EAN-13 (последние 13 цифр)
      if (!product && gtin.length === 14 && gtin.startsWith('0')) {
        const ean13 = gtin.substring(1);
        product = await apiService.getProductByBarcode(ean13);
      }
    }
    
    if (product) {
      console.log('✅ Found:', product.name);
      return {
        found: true,
        product: {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          sellingPrice: product.selling_price,
          currentStock: product.current_stock,
          unit: product.unit,
        },
        searchCode,
      };
    }
    
    console.log('❌ Not found');
    return {
      found: false,
      searchCode,
      message: `Товар не найден. Код: ${searchCode}`,
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      found: false,
      searchCode,
      message: `Ошибка поиска. Код: ${searchCode}`,
    };
  }
}

/**
 * Поиск по коду (для ручного ввода)
 */
export async function searchProductByCode(code: string): Promise<ScanSearchResult> {
  return handleScanResult(code);
}

export default {
  handleScanResult,
  searchProductByCode,
};
