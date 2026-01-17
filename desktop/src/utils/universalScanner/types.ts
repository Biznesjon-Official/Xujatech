/**
 * Universal Scanner Types
 */

export type ScanStatus = 
  | 'VALID'
  | 'INVALID_FORMAT'
  | 'UNKNOWN_FORMAT'
  | 'EMPTY';

export interface ScanResult {
  raw: string;
  isValid: boolean;
  status: ScanStatus;
  type: 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'QR' | 'UNKNOWN';
  data: {
    barcode?: string;
    gtin?: string;
    serialNumber?: string;
    batchNumber?: string;
    expiryDate?: string;
    [key: string]: string | undefined;
  };
}
