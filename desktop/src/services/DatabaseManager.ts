import path from 'path';
import fs from 'fs';

export interface DatabaseOperation {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'select';
  data?: any;
  where?: any;
}

interface DatabaseStore {
  users: any[];
  categories: any[];
  suppliers: any[];
  products: any[];
  product_variants: any[];
  customers: any[];
  sales: any[];
  sale_items: any[];
  payments: any[];
  stock_movements: any[];
  sync_operations: any[];
  settings: any[];
}

export class DatabaseManager {
  private dbPath: string;
  private store: DatabaseStore;

  constructor() {
    // Use app data path or fallback to current directory
    const userDataPath = process.env.APPDATA || process.env.HOME || '.';
    const appDataPath = path.join(userDataPath, 'xujatech-pos');
    this.dbPath = path.join(appDataPath, 'database.json');
    this.store = this.getEmptyStore();
  }

  private getEmptyStore(): DatabaseStore {
    return {
      users: [],
      categories: [],
      suppliers: [],
      products: [],
      product_variants: [],
      customers: [],
      sales: [],
      sale_items: [],
      payments: [],
      stock_movements: [],
      sync_operations: [],
      settings: []
    };
  }

  async initialize(): Promise<void> {
    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        this.store = JSON.parse(data);
      } else {
        this.store = this.getEmptyStore();
        this.insertDefaultData();
        this.save();
      }
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private save(): void {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.store, null, 2));
  }

  private insertDefaultData(): void {
    // Default categories
    this.store.categories = [
      { id: 'cat-tv', name: 'Television', description: 'TV and related products', is_active: 1 },
      { id: 'cat-fridge', name: 'Refrigerator', description: 'Refrigerators and freezers', is_active: 1 },
      { id: 'cat-washer', name: 'Washing Machine', description: 'Washing machines', is_active: 1 },
      { id: 'cat-ac', name: 'Air Conditioner', description: 'Air conditioning units', is_active: 1 }
    ];

    // Default settings
    this.store.settings = [
      { key: 'store_name', value: 'XUJATECh Store', description: 'Store name' },
      { key: 'store_address', value: '', description: 'Store address' },
      { key: 'store_phone', value: '', description: 'Store phone' },
      { key: 'currency', value: 'UZS', description: 'Currency' },
      { key: 'tax_rate', value: '0', description: 'Tax rate' }
    ];
  }

  async query(table: string, where?: any): Promise<any[]> {
    const data = (this.store as any)[table] || [];
    if (!where) return data;
    
    return data.filter((item: any) => {
      return Object.keys(where).every(key => item[key] === where[key]);
    });
  }

  async insert(table: string, data: any): Promise<any> {
    if (!(this.store as any)[table]) {
      (this.store as any)[table] = [];
    }
    (this.store as any)[table].push(data);
    this.save();
    return data;
  }

  async update(table: string, where: any, data: any): Promise<number> {
    const items = (this.store as any)[table] || [];
    let count = 0;
    
    items.forEach((item: any, index: number) => {
      const matches = Object.keys(where).every(key => item[key] === where[key]);
      if (matches) {
        (this.store as any)[table][index] = { ...item, ...data };
        count++;
      }
    });
    
    this.save();
    return count;
  }

  async delete(table: string, where: any): Promise<number> {
    const items = (this.store as any)[table] || [];
    const initialLength = items.length;
    
    (this.store as any)[table] = items.filter((item: any) => {
      return !Object.keys(where).every(key => item[key] === where[key]);
    });
    
    this.save();
    return initialLength - (this.store as any)[table].length;
  }

  async transaction(operations: DatabaseOperation[]): Promise<any[]> {
    const results = [];
    for (const op of operations) {
      switch (op.operation) {
        case 'insert':
          results.push(await this.insert(op.table, op.data));
          break;
        case 'update':
          results.push(await this.update(op.table, op.where, op.data));
          break;
        case 'delete':
          results.push(await this.delete(op.table, op.where));
          break;
        case 'select':
          results.push(await this.query(op.table, op.where));
          break;
      }
    }
    return results;
  }

  async backup(location: string): Promise<boolean> {
    try {
      const backupPath = path.join(location, `xujatech_backup_${Date.now()}.json`);
      fs.copyFileSync(this.dbPath, backupPath);
      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    this.save();
  }
}
