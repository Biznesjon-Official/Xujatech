/**
 * API Service
 * Online va Offline rejimlarni boshqarish
 */

import offlineStorage, { Product, Customer, PendingSale } from './OfflineStorage';

const API_URL = '/api';

class ApiService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private listeners: ((online: boolean) => void)[] = [];

  constructor() {
    // Online/offline holatini kuzatish
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));

    // Dastlabki holat
    this.checkConnection();
  }

  private setOnline(status: boolean) {
    this.isOnline = status;
    this.listeners.forEach((fn) => fn(status));

    if (status) {
      // Online bo'lganda sinxronizatsiya
      this.syncPendingData();
    }
  }

  onStatusChange(callback: (online: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  getStatus() {
    return { isOnline: this.isOnline, syncInProgress: this.syncInProgress };
  }

  // Server bilan aloqani tekshirish
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`, { method: 'GET' });
      const online = response.ok;
      this.setOnline(online);
      return online;
    } catch {
      this.setOnline(false);
      return false;
    }
  }

  // Auth header
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    };
  }

  // ==================== PRODUCTS ====================

  async getProducts(search?: string): Promise<Product[]> {
    if (this.isOnline) {
      try {
        const url = search ? `${API_URL}/products?search=${search}` : `${API_URL}/products`;
        const response = await fetch(url, { headers: this.getHeaders() });
        const data = await response.json();

        if (data.success) {
          // Backend'dan kelgan ma'lumotlarni frontend formatiga o'zgartirish
          const products = data.data.map((p: any) => ({
            id: p._id,
            barcode: p.barcode || '',
            name: p.name,
            selling_price: p.sellingPrice,
            current_stock: p.currentStock,
            purchase_price: p.purchasePrice,
            unit: p.unit,
          }));
          // Offline uchun saqlash
          await offlineStorage.saveProducts(products);
          return products;
        }
      } catch (error) {
        console.error('API error, falling back to offline:', error);
      }
    }

    // Offline rejim
    if (search) {
      return offlineStorage.searchProducts(search);
    }
    return offlineStorage.getProducts();
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    if (this.isOnline) {
      try {
        const response = await fetch(`${API_URL}/products/barcode/${barcode}`, {
          headers: this.getHeaders(),
        });
        const data = await response.json();

        if (data.success && data.data) {
          // Backend'dan kelgan ma'lumotni frontend formatiga o'zgartirish
          const p = data.data;
          return {
            id: p._id,
            barcode: p.barcode || '',
            name: p.name,
            selling_price: p.sellingPrice,
            cost_price: p.purchasePrice || 0,
            current_stock: p.currentStock,
            purchase_price: p.purchasePrice,
            unit: p.unit,
          };
        }
      } catch (error) {
        console.error('API error, falling back to offline:', error);
      }
    }

    // Offline rejim
    return offlineStorage.getProductByBarcode(barcode);
  }

  // ==================== CUSTOMERS ====================

  async getCustomers(search?: string): Promise<Customer[]> {
    if (this.isOnline) {
      try {
        const url = search
          ? `${API_URL}/customers/search?q=${search}`
          : `${API_URL}/customers`;
        const response = await fetch(url, { headers: this.getHeaders() });
        const data = await response.json();

        if (data.success) {
          const customers = data.data.customers || data.data;
          await offlineStorage.saveCustomers(customers);
          return customers;
        }
      } catch (error) {
        console.error('API error, falling back to offline:', error);
      }
    }

    // Offline rejim
    if (search) {
      return offlineStorage.searchCustomers(search);
    }
    return offlineStorage.getCustomers();
  }

  // ==================== SALES ====================

  async createSale(saleData: {
    customerId?: string;
    cashierId?: string;
    items: any[];
    payments: any[];
    discountAmount: number;
    notes?: string;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    const saleId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const totalAmount = saleData.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity - (item.discountAmount || 0),
      0
    );

    // Offline sotuvni saqlash
    const pendingSale: PendingSale = {
      id: saleId,
      items: saleData.items,
      payments: saleData.payments,
      customer_id: saleData.customerId,
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      synced: false,
    };

    if (this.isOnline) {
      try {
        const response = await fetch(`${API_URL}/sales`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(saleData),
        });
        const data = await response.json();

        if (data.success) {
          // Stock'ni yangilash
          for (const item of saleData.items) {
            await offlineStorage.updateProductStock(item.productId, item.quantity);
          }
          return data;
        } else {
          // API xatosi - offline saqlash
          await offlineStorage.savePendingSale(pendingSale);
          return { success: true, data: { id: saleId, offline: true } };
        }
      } catch (error) {
        console.error('API error, saving offline:', error);
        // API xatosi - offline saqlash
        await offlineStorage.savePendingSale(pendingSale);
        return { success: true, data: { id: saleId, saleNumber: saleId, offline: true }, message: 'Sotuv offline saqlandi' };
      }
    }

    // Offline rejim - local saqlash
    await offlineStorage.savePendingSale(pendingSale);

    // Local stock'ni yangilash
    for (const item of saleData.items) {
      await offlineStorage.updateProductStock(item.productId, item.quantity);
    }

    return {
      success: true,
      data: { id: saleId, saleNumber: saleId, offline: true },
      message: 'Sotuv offline saqlandi',
    };
  }

  // ==================== SYNC ====================

  async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    // Agar token yo'q bo'lsa, sync qilmaydi
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No auth token, skipping sync');
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync...');

    try {
      // Pending sotuvlarni sinxronizatsiya
      const pendingSales = await offlineStorage.getPendingSales();
      console.log(`Found ${pendingSales.length} pending sales`);

      for (const sale of pendingSales) {
        try {
          const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
              customerId: sale.customer_id,
              items: sale.items,
              payments: sale.payments,
              discountAmount: 0,
              notes: `Offline sale synced: ${sale.id}`,
            }),
          });

          const data = await response.json();
          if (data.success) {
            await offlineStorage.markSaleAsSynced(sale.id);
            console.log(`Sale ${sale.id} synced successfully`);
          } else if (response.status === 400) {
            // Validation xatosi - bu sotuvni o'chirib tashlaymiz
            console.error(`Sale ${sale.id} validation failed, removing from queue:`, data.message);
            await offlineStorage.markSaleAsSynced(sale.id);
          }
        } catch (error) {
          console.error(`Failed to sync sale ${sale.id}:`, error);
        }
      }

      // Ma'lumotlarni yangilash
      await this.refreshData();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async refreshData(): Promise<void> {
    if (!this.isOnline) return;

    // Agar token yo'q bo'lsa, refresh qilmaydi
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No auth token, skipping data refresh');
      return;
    }

    try {
      // Mahsulotlarni yangilash
      const productsRes = await fetch(`${API_URL}/products`, { headers: this.getHeaders() });
      const productsData = await productsRes.json();
      if (productsData.success) {
        // Backend formatidan frontend formatiga o'zgartirish
        const products = productsData.data.map((p: any) => ({
          id: p._id || p.id,
          barcode: p.barcode || '',
          name: p.name,
          selling_price: p.sellingPrice || p.selling_price,
          cost_price: p.purchasePrice || p.cost_price || 0,
          current_stock: p.currentStock ?? p.current_stock ?? 0,
          category_id: p.categoryId || p.category_id,
          category_name: p.category_name,
          unit: p.unit,
        }));
        await offlineStorage.saveProducts(products);
      }

      // Mijozlarni yangilash
      const customersRes = await fetch(`${API_URL}/customers`, { headers: this.getHeaders() });
      const customersData = await customersRes.json();
      if (customersData.success) {
        await offlineStorage.saveCustomers(customersData.data.customers || customersData.data);
      }

      console.log('Data refreshed from server');
    } catch (error) {
      // Token noto'g'ri yoki muddati o'tgan bo'lishi mumkin
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('Network error during refresh, will retry later');
      } else {
        console.error('Refresh error:', error || 'Unknown error');
      }
    }
  }

  // ==================== REPORTS (Online only) ====================

  async getDailySales(date: string): Promise<any> {
    if (!this.isOnline) {
      return { success: false, message: 'Offline rejimda mavjud emas' };
    }

    try {
      const response = await fetch(`${API_URL}/reports/sales/daily?date=${date}`, {
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch {
      return { success: false, message: 'Server bilan aloqa yo\'q' };
    }
  }

  async getInventoryStock(lowStock?: boolean): Promise<any> {
    if (!this.isOnline) {
      // Offline - local ma'lumotlardan
      const products = await offlineStorage.getProducts();
      if (lowStock) {
        return {
          success: true,
          data: products.filter((p) => p.current_stock <= 5),
        };
      }
      return { success: true, data: products };
    }

    try {
      const url = lowStock
        ? `${API_URL}/inventory/stock?lowStock=true`
        : `${API_URL}/inventory/stock`;
      const response = await fetch(url, { headers: this.getHeaders() });
      return await response.json();
    } catch {
      return { success: false, message: 'Server bilan aloqa yo\'q' };
    }
  }

  async getCustomerStats(): Promise<any> {
    if (!this.isOnline) {
      const customers = await offlineStorage.getCustomers();
      const totalDebt = customers.reduce((sum, c) => sum + c.current_debt, 0);
      return {
        success: true,
        data: {
          totalCustomers: customers.length,
          totalDebt,
          customersWithDebt: customers.filter((c) => c.current_debt > 0).length,
        },
      };
    }

    try {
      const response = await fetch(`${API_URL}/customers/stats`, {
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch {
      return { success: false, message: 'Server bilan aloqa yo\'q' };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
