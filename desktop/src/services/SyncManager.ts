import axios from 'axios';
import { DatabaseManager } from './DatabaseManager';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  syncInProgress: boolean;
}

export class SyncManager {
  private databaseManager: DatabaseManager;
  private syncInterval: any = null;
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private apiBaseUrl: string;

  constructor(databaseManager: DatabaseManager) {
    this.databaseManager = databaseManager;
    this.apiBaseUrl = (process as any).env.API_BASE_URL || '/api';
  }

  async start(): Promise<void> {
    try {
      // Check initial connectivity
      await this.checkConnectivity();
      
      // Start periodic sync
      this.syncInterval = setInterval(() => {
        this.performSync();
      }, 5 * 60 * 1000); // Sync every 5 minutes
      
      // Perform initial sync if online
      if (this.isOnline) {
        await this.performSync();
      }
      
      console.log('Sync manager started');
    } catch (error) {
      console.error('Failed to start sync manager:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('Sync manager stopped');
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/health`, {
        timeout: 5000
      });
      this.isOnline = response.status === 200;
    } catch (error) {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  async performSync(): Promise<boolean> {
    if (this.syncInProgress) {
      return false;
    }

    this.syncInProgress = true;

    try {
      // Check connectivity first
      const isConnected = await this.checkConnectivity();
      if (!isConnected) {
        console.log('No internet connection, skipping sync');
        return false;
      }

      // Get pending operations
      const pendingOps = await this.databaseManager.query(`
        SELECT * FROM sync_operations 
        WHERE sync_status = 'pending' 
        ORDER BY timestamp ASC
        LIMIT 100
      `);

      if (pendingOps.length === 0) {
        console.log('No pending operations to sync');
        return true;
      }

      console.log(`Syncing ${pendingOps.length} operations`);

      // Process operations in batches
      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          
          // Mark as synced
          await this.databaseManager.query(`
            UPDATE sync_operations 
            SET sync_status = 'synced', synced_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `, [op.id]);
          
        } catch (error: any) {
          console.error(`Failed to sync operation ${op.id}:`, error);
          
          // Increment retry count
          await this.databaseManager.query(`
            UPDATE sync_operations 
            SET retry_count = retry_count + 1, error_message = ?
            WHERE id = ?
          `, [error.message, op.id]);
          
          // Mark as failed if too many retries
          if (op.retry_count >= 3) {
            await this.databaseManager.query(`
              UPDATE sync_operations 
              SET sync_status = 'failed' 
              WHERE id = ?
            `, [op.id]);
          }
        }
      }

      console.log('Sync completed successfully');
      return true;

    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOperation(operation: any): Promise<void> {
    const { table_name, record_id, operation: op, data_after } = operation;
    
    if (!data_after) {
      throw new Error('No data to sync');
    }

    const data = JSON.parse(data_after);
    
    // Map table names to API endpoints
    const endpointMap: Record<string, string> = {
      'sales': 'sales',
      'sale_items': 'sales/items',
      'payments': 'payments',
      'customers': 'customers',
      'stock_movements': 'inventory/movements'
    };

    const endpoint = endpointMap[table_name];
    if (!endpoint) {
      throw new Error(`No endpoint mapping for table: ${table_name}`);
    }

    const url = `${this.apiBaseUrl}/${endpoint}`;
    
    switch (op) {
      case 'INSERT':
        await axios.post(url, data);
        break;
      case 'UPDATE':
        await axios.put(`${url}/${record_id}`, data);
        break;
      case 'DELETE':
        await axios.delete(`${url}/${record_id}`);
        break;
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }

  async getStatus(): Promise<SyncStatus> {
    const pendingOps = await this.databaseManager.query(`
      SELECT COUNT(*) as count FROM sync_operations WHERE sync_status = 'pending'
    `);

    const lastSyncResult = await this.databaseManager.query(`
      SELECT synced_at FROM sync_operations 
      WHERE sync_status = 'synced' 
      ORDER BY synced_at DESC 
      LIMIT 1
    `);

    return {
      isOnline: this.isOnline,
      lastSync: lastSyncResult[0]?.synced_at ? new Date(lastSyncResult[0].synced_at) : null,
      pendingOperations: pendingOps[0]?.count || 0,
      syncInProgress: this.syncInProgress
    };
  }

  async addSyncOperation(tableName: string, recordId: string, operation: string, dataBefore?: any, dataAfter?: any): Promise<void> {
    await this.databaseManager.query(`
      INSERT INTO sync_operations (id, table_name, record_id, operation, data_before, data_after, timestamp, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')
    `, [
      `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      tableName,
      recordId,
      operation,
      dataBefore ? JSON.stringify(dataBefore) : null,
      dataAfter ? JSON.stringify(dataAfter) : null
    ]);
  }
}
