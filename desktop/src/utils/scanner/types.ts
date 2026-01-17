/**
 * Типы для модуля сканирования
 */

export type ScanCodeType = 'GS1_DL' | 'GS1_DM' | 'BARCODE' | 'QR';

export interface ScanResult {
  type: ScanCodeType;
  gtin?: string;
  serial?: string;
  batch?: string;
  expiry?: string;
  raw: string;
}

export type ScanCallback = (raw: string) => void;
export type StopFunction = () => void;
