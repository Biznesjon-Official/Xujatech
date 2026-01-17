# POS UI Design & User Experience

## Main POS Interface Layout

### Windows Desktop Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ XUJATECh POS                    [User: John Doe - Cashier]  [Offline] [Exit] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────┐  ┌─────────────────────────────────────────────┐ │
│ │     Product Search      │  │              Sale Items                     │ │
│ │                         │  │                                             │ │
│ │ [Barcode Scanner Input] │  │ Item 1: Samsung TV 55"        2 x 1,500,000│ │
│ │ ┌─────────────────────┐ │  │ Item 2: LG Refrigerator       1 x 2,200,000│ │
│ │ │ Scan or type barcode│ │  │                                             │ │
│ │ └─────────────────────┘ │  │                               Subtotal: ... │ │
│ │                         │  │                               Discount: ... │ │
│ │ [Quick Categories]      │  │                               Tax: ...      │ │
│ │ [TV] [Fridge] [Washer]  │  │                               Total: ...    │ │
│ │ [AC] [Other]            │  │                                             │ │
│ │                         │  │ [Remove Item] [Edit Qty] [Add Discount]    │ │
│ └─────────────────────────┘  └─────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────┐  ┌─────────────────────────────────────────────┐ │
│ │     Customer Info       │  │              Payment                        │ │
│ │                         │  │                                             │ │
│ │ Customer: [Search]      │  │ Payment Method:                             │ │
│ │ Name: Walk-in Customer  │  │ ○ Cash    ○ Card    ○ Click/Payme  ○ Debt  │ │
│ │ Phone: +998901234567    │  │                                             │ │
│ │ Debt: 0 UZS            │  │ Amount Received: [____________]             │ │
│ │ Discount: 0%           │  │ Change: 0 UZS                              │ │
│ │                         │  │                                             │ │
│ │ [New Customer]          │  │ [COMPLETE SALE] [HOLD] [CANCEL]            │ │
│ └─────────────────────────┘  └─────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Sales] [Inventory] [Customers] [Reports] [Settings]        Status: Ready   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Android Mobile Layout (Portrait)
```
┌─────────────────────────────────┐
│ XUJATECh POS    [≡] [Sync] [⚙] │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ [📷] Scan Barcode           │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ Enter barcode or search │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
│                                 │
│ Quick Categories:               │
│ [TV] [Fridge] [Washer] [AC]     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Current Sale Items          │ │
│ │                             │ │
│ │ Samsung TV 55"              │ │
│ │ 2 x 1,500,000 = 3,000,000  │ │
│ │ [Edit] [Remove]             │ │
│ │                             │ │
│ │ LG Refrigerator             │ │
│ │ 1 x 2,200,000 = 2,200,000  │ │
│ │ [Edit] [Remove]             │ │
│ │                             │ │
│ │ ─────────────────────────── │ │
│ │ Subtotal: 5,200,000 UZS     │ │
│ │ Discount: 0 UZS             │ │
│ │ Total: 5,200,000 UZS        │ │
│ └─────────────────────────────┘ │
│                                 │
│ Customer: Walk-in [Change]      │
│                                 │
│ [💰 PAYMENT] [📋 HOLD] [❌ CLEAR] │
│                                 │
├─────────────────────────────────┤
│ [🏠] [📦] [👥] [📊] [⚙]        │
└─────────────────────────────────┘
```

## Key UI Components

### 1. Barcode Scanner Integration
```typescript
interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError: (error: string) => void;
  autoFocus: boolean;
}

// Windows: USB/Serial scanner input
// Android: Camera-based scanning with ZXing
```

### 2. Product Search Component
```typescript
interface ProductSearchResult {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  variants?: ProductVariant[];
}

// Features:
// - Real-time search as you type
// - Barcode lookup
// - Category filtering
// - Stock level indicators
// - Quick add to cart
```

### 3. Shopping Cart Component
```typescript
interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
}

// Features:
// - Quantity adjustment
// - Item-level discounts
// - Remove items
// - Price override (manager permission)
```

### 4. Payment Processing
```typescript
interface PaymentMethod {
  type: 'cash' | 'card' | 'click' | 'payme' | 'debt';
  amount: number;
  reference?: string;
}

// Features:
// - Multiple payment methods per sale
// - Split payments
// - Change calculation
// - Receipt generation
```

## Screen Flows

### 1. Normal Sale Flow
```
Start Sale → Scan/Search Products → Add to Cart → 
Select Customer → Choose Payment → Process Payment → 
Print Receipt → Complete Sale
```

### 2. Customer Debt Sale Flow
```
Start Sale → Add Items → Search Customer → 
Check Credit Limit → Add to Debt → 
Print Receipt → Update Customer Balance
```

### 3. Return Processing Flow
```
Returns → Search Original Sale → Select Items → 
Process Return → Update Inventory → 
Process Refund → Print Return Receipt
```

## Keyboard Shortcuts (Windows)

- `F1` - New Sale
- `F2` - Hold Current Sale
- `F3` - Recall Held Sale
- `F4` - Customer Search
- `F5` - Payment Screen
- `F9` - Manager Override
- `F10` - Settings
- `F12` - Logout
- `Ctrl+D` - Add Discount
- `Ctrl+Q` - Change Quantity
- `Del` - Remove Item
- `Enter` - Complete Action
- `Esc` - Cancel/Back

## Offline Mode Indicators

### Connection Status
```typescript
interface ConnectionStatus {
  isOnline: boolean;
  lastSync: Date;
  pendingSync: number;
  syncInProgress: boolean;
}

// Visual indicators:
// 🟢 Online - Real-time sync
// 🟡 Offline - Local mode
// 🔄 Syncing - Data transfer in progress
// ❌ Error - Sync failed
```

### Offline Limitations
- Cannot create new customers (use existing only)
- Cannot check real-time inventory from other locations
- Cannot access online reports
- Limited to local data only

## Hardware Integration

### Receipt Printer
```typescript
interface ReceiptPrinter {
  print(receipt: ReceiptData): Promise<void>;
  checkStatus(): Promise<PrinterStatus>;
  openCashDrawer(): Promise<void>;
}

// Supported printers:
// - ESC/POS compatible thermal printers
// - USB and Network printers
// - Cash drawer integration
```

### Barcode Scanner
```typescript
interface BarcodeScanner {
  startScanning(): void;
  stopScanning(): void;
  onScan: (barcode: string) => void;
}

// Supported scanners:
// - USB HID scanners (keyboard wedge)
// - Serial/RS232 scanners
// - Camera-based scanning (mobile)
```

## Responsive Design Breakpoints

### Desktop (1024px+)
- Full 4-panel layout
- All features visible
- Keyboard shortcuts enabled
- Multiple windows support

### Tablet (768px - 1023px)
- 2-panel layout with tabs
- Touch-optimized buttons
- Swipe gestures

### Mobile (320px - 767px)
- Single panel with navigation
- Large touch targets
- Simplified workflow
- Essential features only

## Accessibility Features

- High contrast mode
- Large text options
- Keyboard navigation
- Screen reader support
- Voice commands (future)
- Multi-language support (Uzbek, Russian, English)