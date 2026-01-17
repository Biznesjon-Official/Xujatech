# API Endpoints

## Authentication & Users

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/change-password
```

### User Management
```
GET    /api/users                    # List users (admin only)
POST   /api/users                    # Create user (admin only)
GET    /api/users/:id                # Get user details
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Delete user (admin only)
GET    /api/users/profile            # Get current user profile
PUT    /api/users/profile            # Update current user profile
```

## Product Management

### Categories
```
GET    /api/categories               # List all categories
POST   /api/categories               # Create category
GET    /api/categories/:id           # Get category details
PUT    /api/categories/:id           # Update category
DELETE /api/categories/:id           # Delete category
```

### Suppliers
```
GET    /api/suppliers                # List suppliers
POST   /api/suppliers                # Create supplier
GET    /api/suppliers/:id            # Get supplier details
PUT    /api/suppliers/:id            # Update supplier
DELETE /api/suppliers/:id            # Delete supplier
GET    /api/suppliers/:id/balance    # Get supplier balance
POST   /api/suppliers/:id/payment    # Record supplier payment
```

### Products
```
GET    /api/products                 # List products with filters
POST   /api/products                 # Create product
GET    /api/products/:id             # Get product details
PUT    /api/products/:id             # Update product
DELETE /api/products/:id             # Delete product
GET    /api/products/barcode/:code   # Get product by barcode
GET    /api/products/low-stock       # Get low stock products
POST   /api/products/:id/variants    # Add product variant
PUT    /api/products/variants/:id    # Update product variant
```

## Customer Management

### Customers
```
GET    /api/customers                # List customers
POST   /api/customers                # Create customer
GET    /api/customers/:id            # Get customer details
PUT    /api/customers/:id            # Update customer
DELETE /api/customers/:id            # Delete customer
GET    /api/customers/search         # Search customers by phone/name
GET    /api/customers/:id/debt       # Get customer debt details
POST   /api/customers/:id/payment    # Record debt payment
```

## Sales & POS

### Sales
```
GET    /api/sales                    # List sales with filters
POST   /api/sales                    # Create new sale
GET    /api/sales/:id                # Get sale details
PUT    /api/sales/:id                # Update sale (limited)
DELETE /api/sales/:id                # Cancel sale
POST   /api/sales/:id/return         # Process return
GET    /api/sales/:id/receipt        # Get receipt data
POST   /api/sales/:id/print          # Print receipt
```

### Payments
```
GET    /api/payments                 # List payments
POST   /api/payments                 # Record payment
GET    /api/payments/:id             # Get payment details
```

## Inventory Management

### Stock Operations
```
GET    /api/inventory/stock          # Current stock levels
POST   /api/inventory/adjustment     # Stock adjustment
GET    /api/inventory/movements      # Stock movement history
POST   /api/inventory/transfer       # Transfer between locations
```

### Purchase Orders
```
GET    /api/purchase-orders          # List purchase orders
POST   /api/purchase-orders          # Create purchase order
GET    /api/purchase-orders/:id      # Get PO details
PUT    /api/purchase-orders/:id      # Update PO
POST   /api/purchase-orders/:id/receive # Receive items
```

## Reports

### Sales Reports
```
GET    /api/reports/sales/daily      # Daily sales report
GET    /api/reports/sales/period     # Sales by date range
GET    /api/reports/sales/cashier    # Sales by cashier
GET    /api/reports/sales/product    # Sales by product
GET    /api/reports/profit           # Profit analysis
```

### Inventory Reports
```
GET    /api/reports/inventory/stock  # Stock report
GET    /api/reports/inventory/low    # Low stock report
GET    /api/reports/inventory/movements # Stock movement report
```

### Financial Reports
```
GET    /api/reports/debts/customers  # Customer debt report
GET    /api/reports/debts/suppliers  # Supplier debt report
GET    /api/reports/payments         # Payment report
```

## System & Configuration

### Settings
```
GET    /api/settings                 # Get all settings
PUT    /api/settings                 # Update settings
GET    /api/settings/:key            # Get specific setting
PUT    /api/settings/:key            # Update specific setting
```

### Synchronization
```
POST   /api/sync/upload              # Upload offline changes
GET    /api/sync/download            # Download server changes
GET    /api/sync/status              # Get sync status
POST   /api/sync/resolve-conflict    # Resolve sync conflict
```

### System
```
GET    /api/system/info              # System information
POST   /api/system/backup            # Create backup
GET    /api/system/health            # Health check
```

## Request/Response Examples

### Login Request
```json
POST /api/auth/login
{
  "username": "cashier1",
  "password": "password123",
  "deviceId": "WIN-DESKTOP-001",
  "deviceType": "windows"
}
```

### Login Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "cashier1",
      "fullName": "John Doe",
      "role": "cashier"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600
  }
}
```

### Create Sale Request
```json
POST /api/sales
{
  "customerId": "uuid-or-null",
  "items": [
    {
      "productId": "uuid",
      "variantId": "uuid-or-null",
      "quantity": 2,
      "unitPrice": 150000,
      "discountAmount": 0
    }
  ],
  "payments": [
    {
      "method": "cash",
      "amount": 300000
    }
  ],
  "discountAmount": 0,
  "notes": ""
}
```

### Product Search Response
```json
GET /api/products/barcode/1234567890
{
  "success": true,
  "data": {
    "id": "uuid",
    "barcode": "1234567890",
    "name": "Samsung Refrigerator RT38K5032S8",
    "sellingPrice": 2500000,
    "currentStock": 5,
    "category": {
      "id": "uuid",
      "name": "Refrigerator"
    },
    "variants": [
      {
        "id": "uuid",
        "variantName": "Silver",
        "barcode": "1234567890-SLV",
        "sellingPrice": 2500000,
        "currentStock": 3
      }
    ]
  }
}
```