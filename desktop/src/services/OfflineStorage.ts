/**
 * Offline Storage Service
 * LocalStorage va IndexedDB orqali offline ma'lumotlarni boshqarish
 */

// Ma'lumotlar interfeyslari
export interface Product {
  id: string;
  barcode: string;
  name: string;
  selling_price: number;
  cost_price?: number;
  current_stock: number;
  category_id?: string;
  category_name?: string;
  purchase_price?: number;
  unit?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone?: string;
  current_debt: number;
  discount_percentage: number;
}

export interface PendingSale {
  id: string;
  items: any[];
  payments: any[];
  customer_id?: string;
  total_amount: number;
  created_at: string;
  synced: boolean;
}

export interface SyncOperation {
  id: string;
  type: 'sale' | 'customer' | 'product';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retries: number;
}

// Сохранённый чек (для мобильного режима)
export interface SavedReceipt {
  id: string;
  cashierId?: string;
  cashierName?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    barcode?: string;
  }[];
  total: number;
  status: 'saved' | 'completed' | 'cancelled';
  source: 'mobile' | 'desktop';
  createdAt: string;
  customerId?: string;
  customerName?: string;
  synced?: boolean;
}

class OfflineStorage {
  private dbName = 'xujatech_pos_offline';
  private dbVersion = 2; // Увеличена версия для добавления saved_receipts store
  private db: IDBDatabase | null = null;

  // IndexedDB ni ishga tushirish
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('barcode', 'barcode', { unique: true });
          productStore.createIndex('name', 'name', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('phone', 'phone', { unique: false });
        }

        // Pending sales store
        if (!db.objectStoreNames.contains('pending_sales')) {
          const salesStore = db.createObjectStore('pending_sales', { keyPath: 'id' });
          salesStore.createIndex('synced', 'synced', { unique: false });
        }

        // Sync operations store
        if (!db.objectStoreNames.contains('sync_operations')) {
          db.createObjectStore('sync_operations', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Saved receipts store (для мобильного режима)
        if (!db.objectStoreNames.contains('saved_receipts')) {
          const receiptsStore = db.createObjectStore('saved_receipts', { keyPath: 'id' });
          receiptsStore.createIndex('status', 'status', { unique: false });
          receiptsStore.createIndex('synced', 'synced', { unique: false });
          receiptsStore.createIndex('source', 'source', { unique: false });
        }
      };
    });
  }

  // ==================== PRODUCTS ====================

  async saveProducts(products: Product[]): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    // Avval eski mahsulotlarni tozalash (o'chirilganlarni olib tashlash uchun)
    store.clear();

    for (const product of products) {
      // MongoDB _id ni id ga o'zgartirish
      const productToSave = {
        ...product,
        id: product.id || (product as any)._id,
      };
      if (productToSave.id) {
        store.put(productToSave);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getProducts(): Promise<Product[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('products', 'readonly');
    const store = tx.objectStore('products');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const index = store.index('barcode');

    return new Promise((resolve, reject) => {
      const request = index.get(barcode);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.barcode?.toLowerCase().includes(lowerQuery)
    );
  }

  async updateProductStock(productId: string, quantity: number): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    return new Promise((resolve, reject) => {
      const request = store.get(productId);
      request.onsuccess = () => {
        const product = request.result;
        if (product) {
          product.current_stock -= quantity;
          store.put(product);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== CUSTOMERS ====================

  async saveCustomers(customers: Customer[]): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('customers', 'readwrite');
    const store = tx.objectStore('customers');

    for (const customer of customers) {
      // MongoDB _id ni id ga o'zgartirish
      const customerToSave = {
        ...customer,
        id: customer.id || (customer as any)._id,
      };
      if (customerToSave.id) {
        store.put(customerToSave);
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCustomers(): Promise<Customer[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('customers', 'readonly');
    const store = tx.objectStore('customers');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const customers = await this.getCustomers();
    const lowerQuery = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(lowerQuery) ||
        c.phone?.includes(query)
    );
  }

  // ==================== PENDING SALES ====================

  async savePendingSale(sale: PendingSale): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('pending_sales', 'readwrite');
    const store = tx.objectStore('pending_sales');
    store.put(sale);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPendingSales(): Promise<PendingSale[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('pending_sales', 'readonly');
    const store = tx.objectStore('pending_sales');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.filter((s: PendingSale) => !s.synced));
      request.onerror = () => reject(request.error);
    });
  }

  async markSaleAsSynced(saleId: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('pending_sales', 'readwrite');
    const store = tx.objectStore('pending_sales');

    return new Promise((resolve, reject) => {
      const request = store.get(saleId);
      request.onsuccess = () => {
        const sale = request.result;
        if (sale) {
          sale.synced = true;
          store.put(sale);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deletePendingSale(saleId: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('pending_sales', 'readwrite');
    const store = tx.objectStore('pending_sales');
    store.delete(saleId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== SYNC OPERATIONS ====================

  async addSyncOperation(operation: SyncOperation): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('sync_operations', 'readwrite');
    const store = tx.objectStore('sync_operations');
    store.put(operation);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSyncOperations(): Promise<SyncOperation[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('sync_operations', 'readonly');
    const store = tx.objectStore('sync_operations');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncOperation(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('sync_operations', 'readwrite');
    const store = tx.objectStore('sync_operations');
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==================== SETTINGS ====================

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    store.put({ key, value });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== SAVED RECEIPTS (Мобильный режим) ====================

  async saveSavedReceipt(receipt: SavedReceipt): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('saved_receipts', 'readwrite');
    const store = tx.objectStore('saved_receipts');
    store.put(receipt);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSavedReceipts(): Promise<SavedReceipt[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('saved_receipts', 'readonly');
    const store = tx.objectStore('saved_receipts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getSavedReceiptById(id: string): Promise<SavedReceipt | null> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('saved_receipts', 'readonly');
    const store = tx.objectStore('saved_receipts');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSavedReceipt(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('saved_receipts', 'readwrite');
    const store = tx.objectStore('saved_receipts');
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async updateSavedReceiptStatus(id: string, status: 'saved' | 'completed' | 'cancelled'): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('saved_receipts', 'readwrite');
    const store = tx.objectStore('saved_receipts');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const receipt = request.result;
        if (receipt) {
          receipt.status = status;
          store.put(receipt);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getUnsyncedSavedReceipts(): Promise<SavedReceipt[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('saved_receipts', 'readonly');
    const store = tx.objectStore('saved_receipts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const receipts = request.result || [];
        resolve(receipts.filter((r: SavedReceipt) => !r.synced && r.status === 'saved'));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markSavedReceiptAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('saved_receipts', 'readwrite');
    const store = tx.objectStore('saved_receipts');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const receipt = request.result;
        if (receipt) {
          receipt.synced = true;
          store.put(receipt);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async syncSavedReceipts(): Promise<void> {
    const unsyncedReceipts = await this.getUnsyncedSavedReceipts();
    
    for (const receipt of unsyncedReceipts) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/receipts/saved', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(receipt),
        });

        if (response.ok) {
          await this.markSavedReceiptAsSynced(receipt.id);
        }
      } catch (error) {
        console.error(`Ошибка синхронизации чека ${receipt.id}:`, error);
      }
    }
  }

  // ==================== UTILITY ====================

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    const stores = ['products', 'customers', 'pending_sales', 'sync_operations'];
    
    for (const storeName of stores) {
      const tx = this.db!.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
    }
  }

  async getStats(): Promise<{ products: number; customers: number; pendingSales: number }> {
    const products = await this.getProducts();
    const customers = await this.getCustomers();
    const pendingSales = await this.getPendingSales();

    return {
      products: products.length,
      customers: customers.length,
      pendingSales: pendingSales.length,
    };
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage;
