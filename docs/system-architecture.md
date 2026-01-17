# System Architecture

## 1. High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Windows POS   │    │   Android POS   │    │   Web Admin     │
│   (Electron)    │    │ (React Native)  │    │   (React)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Gateway           │
                    │   (Node.js + Express)     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   PostgreSQL Database     │
                    │   (Master Data Store)     │
                    └───────────────────────────┘
```

## 2. Client Architecture (Offline-First)

```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                   │
├─────────────────────────────────────────────────────────┤
│  UI Layer (React/React Native)                          │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                   │
│  - POS Operations  - Inventory  - Customer Management   │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer                                      │
│  - Local SQLite DB  - Sync Manager  - API Client       │
├─────────────────────────────────────────────────────────┤
│  Hardware Integration Layer                             │
│  - Barcode Scanner  - Receipt Printer  - Cash Drawer   │
└─────────────────────────────────────────────────────────┘
```

## 3. Data Flow

### Online Mode
1. User action → Local SQLite → API Server → PostgreSQL
2. Real-time sync with conflict resolution

### Offline Mode
1. User action → Local SQLite → Sync Queue
2. When online: Sync Queue → API Server → PostgreSQL

## 4. Security Architecture

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: AES-256 for sensitive data
- **API Security**: Rate limiting, input validation, CORS
- **Local Security**: Encrypted local database