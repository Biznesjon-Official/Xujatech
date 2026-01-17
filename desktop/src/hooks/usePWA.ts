import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    installPrompt: null,
  });

  // PWA o'rnatilganligini tekshirish
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setState(prev => ({ ...prev, isInstalled: isStandalone || isIOSStandalone }));
    };

    checkInstalled();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
    };
  }, []);

  // Install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e as BeforeInstallPromptEvent,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Online/Offline status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker update
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });
      });
    }
  }, []);

  // O'rnatish funksiyasi
  const install = useCallback(async () => {
    if (!state.installPrompt) return false;

    try {
      await state.installPrompt.prompt();
      const { outcome } = await state.installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
          installPrompt: null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA o\'rnatish xatosi:', error);
      return false;
    }
  }, [state.installPrompt]);

  // Yangilash funksiyasi
  const update = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  }, []);

  // Keshni tozalash
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      return true;
    }
    return false;
  }, []);

  return {
    ...state,
    install,
    update,
    clearCache,
  };
}

// Offline ma'lumotlarni saqlash uchun IndexedDB helper
const DB_NAME = 'xujatech-pos-offline';
const DB_VERSION = 1;

interface OfflineStore {
  sales: any[];
  products: any[];
  customers: any[];
}

export function useOfflineStorage() {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB ochilmadi');
    };

    request.onsuccess = () => {
      setDb(request.result);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Offline savdolar
      if (!database.objectStoreNames.contains('offlineSales')) {
        database.createObjectStore('offlineSales', { keyPath: 'id', autoIncrement: true });
      }

      // Keshlangan mahsulotlar
      if (!database.objectStoreNames.contains('cachedProducts')) {
        const productStore = database.createObjectStore('cachedProducts', { keyPath: '_id' });
        productStore.createIndex('barcode', 'barcode', { unique: false });
      }

      // Keshlangan mijozlar
      if (!database.objectStoreNames.contains('cachedCustomers')) {
        database.createObjectStore('cachedCustomers', { keyPath: '_id' });
      }

      // Sinxronlash holati
      if (!database.objectStoreNames.contains('syncStatus')) {
        database.createObjectStore('syncStatus', { keyPath: 'key' });
      }
    };

    return () => {
      db?.close();
    };
  }, []);

  // Offline savdo qo'shish
  const addOfflineSale = useCallback(async (sale: any) => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineSales'], 'readwrite');
      const store = transaction.objectStore('offlineSales');
      const request = store.add({
        ...sale,
        createdAt: new Date().toISOString(),
        synced: false,
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Offline savdolarni olish
  const getOfflineSales = useCallback(async () => {
    if (!db) return [];

    return new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction(['offlineSales'], 'readonly');
      const store = transaction.objectStore('offlineSales');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Mahsulotlarni keshlash
  const cacheProducts = useCallback(async (products: any[]) => {
    if (!db) return;

    const transaction = db.transaction(['cachedProducts'], 'readwrite');
    const store = transaction.objectStore('cachedProducts');

    // Avval tozalash
    store.clear();

    // Yangi ma'lumotlarni qo'shish
    products.forEach(product => {
      store.add(product);
    });
  }, [db]);

  // Keshlangan mahsulotlarni olish
  const getCachedProducts = useCallback(async () => {
    if (!db) return [];

    return new Promise<any[]>((resolve, reject) => {
      const transaction = db.transaction(['cachedProducts'], 'readonly');
      const store = transaction.objectStore('cachedProducts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Barcode bo'yicha mahsulot topish
  const findProductByBarcode = useCallback(async (barcode: string) => {
    if (!db) return null;

    return new Promise<any>((resolve, reject) => {
      const transaction = db.transaction(['cachedProducts'], 'readonly');
      const store = transaction.objectStore('cachedProducts');
      const index = store.index('barcode');
      const request = index.get(barcode);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Sinxronlash
  const syncOfflineData = useCallback(async () => {
    if (!navigator.onLine) return { success: false, message: 'Offline' };

    try {
      const offlineSales = await getOfflineSales();
      const unsyncedSales = offlineSales.filter(s => !s.synced);

      if (unsyncedSales.length === 0) {
        return { success: true, message: 'Sinxronlanadigan ma\'lumot yo\'q' };
      }

      const token = localStorage.getItem('accessToken');
      let syncedCount = 0;

      for (const sale of unsyncedSales) {
        try {
          const response = await fetch('/api/sales', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(sale),
          });

          if (response.ok) {
            // Sinxronlangan deb belgilash
            if (db) {
              const transaction = db.transaction(['offlineSales'], 'readwrite');
              const store = transaction.objectStore('offlineSales');
              store.put({ ...sale, synced: true });
            }
            syncedCount++;
          }
        } catch (error) {
          console.error('Savdo sinxronlash xatosi:', error);
        }
      }

      return {
        success: true,
        message: `${syncedCount}/${unsyncedSales.length} savdo sinxronlandi`,
      };
    } catch (error) {
      return { success: false, message: 'Sinxronlash xatosi' };
    }
  }, [db, getOfflineSales]);

  return {
    addOfflineSale,
    getOfflineSales,
    cacheProducts,
    getCachedProducts,
    findProductByBarcode,
    syncOfflineData,
    isReady: !!db,
  };
}
