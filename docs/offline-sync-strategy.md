# Offline-to-Online Synchronization Strategy

## Overview

The XUJATECh POS system implements an **offline-first architecture** that ensures business continuity even without internet connectivity. The system maintains a local SQLite database that mirrors critical data from the central PostgreSQL server.

## Synchronization Architecture

### Data Flow Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local SQLite  │◄──►│  Sync Manager   │◄──►│ PostgreSQL API  │
│   (Offline DB)  │    │   (Conflict     │    │ (Master Server) │
│                 │    │   Resolution)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   POS Client    │    │   Sync Queue    │    │  Other Clients  │
│  (UI Layer)     │    │ (Pending Ops)   │    │ (Other Stores)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Local Database Schema (SQLite)

### Core Tables (Mirrored from Server)
```sql
-- Exact mirror of server tables with additional sync metadata
CREATE TABLE products_local (
    id TEXT PRIMARY KEY,
    barcode TEXT,
    name TEXT NOT NULL,
    category_id TEXT,
    cost_price REAL,
    selling_price REAL,
    current_stock INTEGER,
    -- Sync metadata
    last_sync TIMESTAMP,
    sync_version INTEGER,
    is_dirty BOOLEAN DEFAULT 0,
    created_offline BOOLEAN DEFAULT 0
);

-- Sync tracking table
CREATE TABLE sync_operations (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    data_before TEXT, -- JSON snapshot before change
    data_after TEXT,  -- JSON snapshot after change
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'pending', -- pending, synced, conflict, failed
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);
```

## Synchronization Process

### 1. Initial Data Download
```typescript
interface InitialSyncProcess {
  // Download essential data for offline operation
  downloadMasterData(): Promise<void> {
    // 1. Download all products and categories
    // 2. Download active customers
    // 3. Download current user permissions
    // 4. Download system settings
    // 5. Set up local database
  }
}
```

### 2. Real-time Sync (Online Mode)
```typescript
interface RealtimeSync {
  // Immediate sync for critical operations
  syncSale(sale: Sale): Promise<SyncResult> {
    // 1. Save to local DB
    // 2. Immediately sync to server
    // 3. Update local inventory
    // 4. Handle conflicts if any
  }
}
```

### 3. Batch Sync (Offline Recovery)
```typescript
interface BatchSync {
  // Process accumulated offline changes
  syncPendingOperations(): Promise<SyncResult[]> {
    // 1. Get all pending operations
    // 2. Sort by timestamp and dependencies
    // 3. Upload in batches
    // 4. Handle conflicts
    // 5. Update local data with server response
  }
}
```

## Conflict Resolution Strategy

### 1. Conflict Types and Resolution

#### A. Inventory Conflicts
```typescript
interface InventoryConflict {
  type: 'stock_shortage';
  localStock: number;
  serverStock: number;
  saleQuantity: number;
  
  resolution: 'server_wins' | 'manual_review' | 'partial_fulfillment';
}

// Resolution Logic:
// - If server stock >= sale quantity: Allow sale
// - If server stock < sale quantity: Flag for manual review
// - If server stock = 0: Reject sale, notify user
```

#### B. Price Conflicts
```typescript
interface PriceConflict {
  type: 'price_change';
  localPrice: number;
  serverPrice: number;
  salePrice: number;
  
  resolution: 'use_sale_price' | 'use_server_price' | 'manual_review';
}

// Resolution Logic:
// - Always honor the price at time of sale
// - Update local prices for future sales
// - Log price discrepancies for audit
```

#### C. Customer Data Conflicts
```typescript
interface CustomerConflict {
  type: 'customer_data' | 'debt_mismatch';
  localData: Customer;
  serverData: Customer;
  
  resolution: 'merge_data' | 'server_wins' | 'manual_review';
}

// Resolution Logic:
// - Merge non-conflicting fields
// - Server wins for debt amounts
// - Manual review for significant discrepancies
```

### 2. Conflict Resolution Algorithm
```typescript
class ConflictResolver {
  async resolveConflict(conflict: SyncConflict): Promise<Resolution> {
    switch (conflict.type) {
      case 'inventory':
        return this.resolveInventoryConflict(conflict);
      case 'price':
        return this.resolvePriceConflict(conflict);
      case 'customer':
        return this.resolveCustomerConflict(conflict);
      default:
        return { action: 'manual_review', reason: 'Unknown conflict type' };
    }
  }
  
  private async resolveInventoryConflict(conflict: InventoryConflict): Promise<Resolution> {
    // Check business rules
    if (conflict.serverStock >= conflict.saleQuantity) {
      return { action: 'accept', adjustments: ['update_local_stock'] };
    }
    
    // Check if partial fulfillment is acceptable
    if (conflict.serverStock > 0) {
      return { 
        action: 'partial_accept', 
        adjustments: ['reduce_quantity', 'update_local_stock'],
        newQuantity: conflict.serverStock
      };
    }
    
    return { action: 'reject', reason: 'Insufficient stock' };
  }
}
```

## Data Synchronization Priorities

### Priority Levels
1. **Critical (Immediate)**: Sales transactions, payments, inventory updates
2. **High (Within 5 minutes)**: Customer updates, product price changes
3. **Medium (Within 1 hour)**: Reports, analytics data
4. **Low (Daily)**: System logs, audit trails

### Sync Scheduling
```typescript
interface SyncScheduler {
  // Immediate sync for critical operations
  syncImmediate(operation: SyncOperation): Promise<void>;
  
  // Scheduled sync for non-critical data
  scheduleSync(operation: SyncOperation, priority: Priority): void;
  
  // Background sync when idle
  backgroundSync(): Promise<void>;
}
```

## Network Optimization

### 1. Data Compression
```typescript
interface DataCompression {
  // Compress large payloads
  compressData(data: any): Promise<CompressedData>;
  
  // Delta sync - only send changes
  createDelta(oldData: any, newData: any): Delta;
}
```

### 2. Bandwidth Management
```typescript
interface BandwidthManager {
  // Detect connection quality
  getConnectionQuality(): ConnectionQuality;
  
  // Adjust sync frequency based on connection
  adjustSyncFrequency(quality: ConnectionQuality): void;
  
  // Prioritize critical data on slow connections
  prioritizeData(operations: SyncOperation[]): SyncOperation[];
}
```

## Error Handling and Recovery

### 1. Retry Logic
```typescript
interface RetryStrategy {
  maxRetries: number;
  backoffMultiplier: number;
  maxBackoffTime: number;
  
  shouldRetry(error: SyncError, attempt: number): boolean;
  getRetryDelay(attempt: number): number;
}

// Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
```

### 2. Failure Recovery
```typescript
interface FailureRecovery {
  // Handle permanent failures
  handlePermanentFailure(operation: SyncOperation): Promise<void>;
  
  // Rollback local changes if needed
  rollbackOperation(operation: SyncOperation): Promise<void>;
  
  // Manual intervention required
  flagForManualReview(operation: SyncOperation, reason: string): Promise<void>;
}
```

## Monitoring and Diagnostics

### 1. Sync Status Dashboard
```typescript
interface SyncStatus {
  lastSuccessfulSync: Date;
  pendingOperations: number;
  failedOperations: number;
  conflictsRequiringAttention: number;
  connectionStatus: 'online' | 'offline' | 'limited';
  syncInProgress: boolean;
}
```

### 2. Sync Logs
```typescript
interface SyncLog {
  timestamp: Date;
  operation: string;
  status: 'success' | 'failure' | 'conflict';
  details: string;
  duration: number;
  dataSize: number;
}
```

## Implementation Timeline

### Phase 1: Basic Offline Support (Week 1-2)
- Local SQLite database setup
- Basic CRUD operations offline
- Simple sync queue implementation

### Phase 2: Conflict Resolution (Week 3-4)
- Conflict detection algorithms
- Basic resolution strategies
- Manual conflict review interface

### Phase 3: Advanced Sync (Week 5-6)
- Delta synchronization
- Bandwidth optimization
- Advanced retry logic

### Phase 4: Monitoring & Polish (Week 7-8)
- Sync status dashboard
- Performance optimization
- Error handling improvements

## Testing Strategy

### 1. Offline Scenarios
- Complete network disconnection
- Intermittent connectivity
- Slow/unreliable connections
- Server downtime

### 2. Conflict Scenarios
- Simultaneous edits from multiple clients
- Inventory race conditions
- Price changes during offline sales
- Customer data modifications

### 3. Performance Testing
- Large data synchronization
- High-frequency operations
- Memory usage optimization
- Battery impact (mobile)