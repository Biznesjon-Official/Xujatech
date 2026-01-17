import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import path from 'path';
import isDev from 'electron-is-dev';

import { DatabaseManager } from './services/DatabaseManager';
import { HardwareManager } from './services/HardwareManager';
import { SyncManager } from './services/SyncManager';

// Initialize electron store for settings
const store = new Store();

class XUJATEChPOS {
  private mainWindow: BrowserWindow | null = null;
  private databaseManager: DatabaseManager;
  private hardwareManager: HardwareManager;
  private syncManager: SyncManager;

  constructor() {
    this.databaseManager = new DatabaseManager();
    this.hardwareManager = new HardwareManager();
    this.syncManager = new SyncManager(this.databaseManager);
    
    this.initializeApp();
  }

  private initializeApp(): void {
    // Handle app ready
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIPC();
      this.initializeServices();
      
      // Auto updater (production only)
      if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // Handle app quit
    app.on('before-quit', async () => {
      await this.cleanup();
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '../assets/icon.png'),
      title: 'XUJATECh POS System',
      show: false // Don't show until ready
    });

    // Load the app
    const startUrl = isDev 
      ? '/api' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    this.mainWindow.loadURL(startUrl);

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      
      // Open DevTools in development
      if (isDev) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Sale',
            accelerator: 'F1',
            click: () => this.sendToRenderer('menu:new-sale')
          },
          {
            label: 'Hold Sale',
            accelerator: 'F2',
            click: () => this.sendToRenderer('menu:hold-sale')
          },
          { type: 'separator' },
          {
            label: 'Settings',
            accelerator: 'F10',
            click: () => this.sendToRenderer('menu:settings')
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: 'Alt+F4',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'Sales',
        submenu: [
          {
            label: 'Customer Search',
            accelerator: 'F4',
            click: () => this.sendToRenderer('menu:customer-search')
          },
          {
            label: 'Payment',
            accelerator: 'F5',
            click: () => this.sendToRenderer('menu:payment')
          },
          {
            label: 'Returns',
            accelerator: 'F6',
            click: () => this.sendToRenderer('menu:returns')
          }
        ]
      },
      {
        label: 'Inventory',
        submenu: [
          {
            label: 'Stock In',
            click: () => this.sendToRenderer('menu:stock-in')
          },
          {
            label: 'Stock Out',
            click: () => this.sendToRenderer('menu:stock-out')
          },
          {
            label: 'Stock Adjustment',
            click: () => this.sendToRenderer('menu:stock-adjustment')
          }
        ]
      },
      {
        label: 'Reports',
        submenu: [
          {
            label: 'Daily Sales',
            click: () => this.sendToRenderer('menu:daily-sales')
          },
          {
            label: 'Inventory Report',
            click: () => this.sendToRenderer('menu:inventory-report')
          },
          {
            label: 'Customer Debts',
            click: () => this.sendToRenderer('menu:customer-debts')
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => this.showAbout()
          },
          {
            label: 'Check for Updates',
            click: () => autoUpdater.checkForUpdatesAndNotify()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIPC(): void {
    // Database operations
    ipcMain.handle('db:query', async (_event: Electron.IpcMainInvokeEvent, query: string, params?: any[]) => {
      return await this.databaseManager.query(query, params);
    });

    ipcMain.handle('db:transaction', async (_event: Electron.IpcMainInvokeEvent, operations: any[]) => {
      return await this.databaseManager.transaction(operations);
    });

    // Hardware operations
    ipcMain.handle('hardware:print-receipt', async (_event: Electron.IpcMainInvokeEvent, receiptData: any) => {
      return await this.hardwareManager.printReceipt(receiptData);
    });

    ipcMain.handle('hardware:open-cash-drawer', async (_event: Electron.IpcMainInvokeEvent) => {
      return await this.hardwareManager.openCashDrawer();
    });

    ipcMain.handle('hardware:scan-barcode', async (_event: Electron.IpcMainInvokeEvent) => {
      return await this.hardwareManager.scanBarcode();
    });

    // Sync operations
    ipcMain.handle('sync:status', async (_event: Electron.IpcMainInvokeEvent) => {
      return await this.syncManager.getStatus();
    });

    ipcMain.handle('sync:manual', async (_event: Electron.IpcMainInvokeEvent) => {
      return await this.syncManager.performSync();
    });

    // Settings
    ipcMain.handle('settings:get', (_event: Electron.IpcMainInvokeEvent, key: string) => {
      return store.get(key);
    });

    ipcMain.handle('settings:set', (_event: Electron.IpcMainInvokeEvent, key: string, value: any) => {
      store.set(key, value);
      return true;
    });

    // File operations
    ipcMain.handle('file:select-backup-location', async (_event: Electron.IpcMainInvokeEvent) => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory']
      });
      return result.filePaths[0];
    });

    ipcMain.handle('file:backup-database', async (_event: Electron.IpcMainInvokeEvent, location: string) => {
      return await this.databaseManager.backup(location);
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      await this.databaseManager.initialize();
      
      // Initialize hardware
      await this.hardwareManager.initialize();
      
      // Start sync manager
      await this.syncManager.start();
      
      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      
      // Show error dialog
      dialog.showErrorBox(
        'Initialization Error',
        'Failed to initialize application services. Please check the logs and try again.'
      );
    }
  }

  private sendToRenderer(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  private showAbout(): void {
    dialog.showMessageBox(this.mainWindow!, {
      type: 'info',
      title: 'About XUJATECh POS',
      message: 'XUJATECh POS System',
      detail: `Version: ${app.getVersion()}\nA comprehensive POS and inventory management system for home appliance stores.`
    });
  }

  private async cleanup(): Promise<void> {
    try {
      // Stop sync manager
      await this.syncManager.stop();
      
      // Close database connections
      await this.databaseManager.close();
      
      // Cleanup hardware connections
      await this.hardwareManager.cleanup();
      
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Create application instance
new XUJATEChPOS();
