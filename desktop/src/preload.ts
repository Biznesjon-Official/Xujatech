import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  dbQuery: (query: string, params?: any[]) => ipcRenderer.invoke('db:query', query, params),
  dbTransaction: (operations: any[]) => ipcRenderer.invoke('db:transaction', operations),

  // Hardware operations
  printReceipt: (receiptData: any) => ipcRenderer.invoke('hardware:print-receipt', receiptData),
  openCashDrawer: () => ipcRenderer.invoke('hardware:open-cash-drawer'),
  scanBarcode: () => ipcRenderer.invoke('hardware:scan-barcode'),

  // Sync operations
  getSyncStatus: () => ipcRenderer.invoke('sync:status'),
  performManualSync: () => ipcRenderer.invoke('sync:manual'),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),

  // File operations
  selectBackupLocation: () => ipcRenderer.invoke('file:select-backup-location'),
  backupDatabase: (location: string) => ipcRenderer.invoke('file:backup-database', location),

  // Menu events
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu:new-sale', () => callback('new-sale'));
    ipcRenderer.on('menu:hold-sale', () => callback('hold-sale'));
    ipcRenderer.on('menu:customer-search', () => callback('customer-search'));
    ipcRenderer.on('menu:payment', () => callback('payment'));
    ipcRenderer.on('menu:returns', () => callback('returns'));
    ipcRenderer.on('menu:settings', () => callback('settings'));
    ipcRenderer.on('menu:stock-in', () => callback('stock-in'));
    ipcRenderer.on('menu:stock-out', () => callback('stock-out'));
    ipcRenderer.on('menu:stock-adjustment', () => callback('stock-adjustment'));
    ipcRenderer.on('menu:daily-sales', () => callback('daily-sales'));
    ipcRenderer.on('menu:inventory-report', () => callback('inventory-report'));
    ipcRenderer.on('menu:customer-debts', () => callback('customer-debts'));
  },

  // Barcode scanner events
  onBarcodeScanned: (callback: (barcode: string) => void) => {
    process.on('barcode-scanned', callback);
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      dbQuery: (query: string, params?: any[]) => Promise<any>;
      dbTransaction: (operations: any[]) => Promise<any>;
      printReceipt: (receiptData: any) => Promise<boolean>;
      openCashDrawer: () => Promise<boolean>;
      scanBarcode: () => Promise<string | null>;
      getSyncStatus: () => Promise<any>;
      performManualSync: () => Promise<boolean>;
      getSetting: (key: string) => Promise<any>;
      setSetting: (key: string, value: any) => Promise<boolean>;
      selectBackupLocation: () => Promise<string>;
      backupDatabase: (location: string) => Promise<boolean>;
      onMenuAction: (callback: (action: string) => void) => void;
      onBarcodeScanned: (callback: (barcode: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
