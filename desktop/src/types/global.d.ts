/// <reference types="react" />
/// <reference types="react-dom" />

// Global type definitions for Electron app

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

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      API_BASE_URL?: string;
      REACT_APP_API_BASE_URL?: string;
    }

    interface Process {
      emit(event: string | symbol, ...args: any[]): boolean;
      env: ProcessEnv;
      platform: string;
    }

    interface Global {
      process: Process;
    }
  }

  var process: NodeJS.Process;
  var __dirname: string;
  var __filename: string;
}

// Electron types
declare module 'electron' {
  export interface IpcMainInvokeEvent {
    // Add any additional properties if needed
  }
}

// Module declarations for packages without types
declare module 'electron-is-dev' {
  const isDev: boolean;
  export default isDev;
}

declare module 'node-thermal-printer' {
  export enum PrinterTypes {
    EPSON = 'epson',
    STAR = 'star'
  }

  export enum CharacterSet {
    PC852_LATIN2 = 'PC852_LATIN2'
  }

  export enum BreakLine {
    WORD = 'word'
  }

  export interface PrinterOptions {
    timeout?: number;
  }

  export interface ThermalPrinterConfig {
    type: PrinterTypes;
    interface: string;
    characterSet?: CharacterSet;
    removeSpecialCharacters?: boolean;
    lineCharacter?: string;
    breakLine?: BreakLine;
    options?: PrinterOptions;
  }

  export class ThermalPrinter {
    constructor(config: ThermalPrinterConfig);
    isPrinterConnected(): Promise<boolean>;
    clear(): void;
    alignCenter(): void;
    alignLeft(): void;
    setTextSize(width: number, height: number): void;
    setTextNormal(): void;
    println(text: string): void;
    drawLine(): void;
    cut(): void;
    openCashDrawer(): void;
    execute(): Promise<void>;
  }
}

export {};
