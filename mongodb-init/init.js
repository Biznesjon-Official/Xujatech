// MongoDB initialization script
// Bu script MongoDB container birinchi marta ishga tushganda bajariladi

db = db.getSiblingDB('xujatech');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('customers');
db.createCollection('sales');
db.createCollection('warehouses');
db.createCollection('warehouse_products');
db.createCollection('deliveries');
db.createCollection('returns');
db.createCollection('branches');
db.createCollection('settings');
db.createCollection('debt_logs');
db.createCollection('my_debts');
db.createCollection('suppliers');
db.createCollection('saved_receipts');
db.createCollection('telegram_users');
db.createCollection('notification_logs');

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.products.createIndex({ barcode: 1 }, { unique: true, sparse: true });
db.products.createIndex({ name: 1 });
db.customers.createIndex({ phone: 1 });
db.sales.createIndex({ createdAt: -1 });
db.sales.createIndex({ cashierId: 1 });
db.sales.createIndex({ customerId: 1 });

print('✅ MongoDB initialized successfully');
