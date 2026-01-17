import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Category, Product, Customer, Setting } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xujatech_pos';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Setting.deleteMany({});

    // Drop indexes to avoid conflicts
    try {
      await mongoose.connection.collection('products').dropIndexes();
    } catch (e) {
      // Ignore if collection doesn't exist
    }

    // Create admin user
    await User.create({
      username: 'admin',
      password: 'admin123',
      fullName: 'Администратор',
      email: 'admin@xujatech.com',
      role: 'admin'
    });
    console.log('✅ Admin user created');

    // Create 3 cashiers
    await User.create([
      {
        username: 'kassir1',
        password: '1234',
        fullName: 'Азиз Каримов',
        role: 'cashier'
      },
      {
        username: 'kassir2',
        password: '1234',
        fullName: 'Малика Раҳимова',
        role: 'cashier'
      },
      {
        username: 'kassir3',
        password: '1234',
        fullName: 'Жасур Тошматов',
        role: 'cashier'
      }
    ]);
    console.log('✅ 3 Cashiers created');

    // Create categories
    const electronics = await Category.create({ name: 'Электроника' });
    const appliances = await Category.create({ name: 'Маиший техника' });
    const phones = await Category.create({ name: 'Телефонлар', parentId: electronics._id });
    console.log('✅ Categories created');

    // Create products
    await Product.create([
      {
        name: 'Samsung Galaxy A54',
        barcode: '8801643123456',
        categoryId: phones._id,
        purchasePrice: 3500000,
        sellingPrice: 4200000,
        currentStock: 15,
        minimumStock: 3,
        unit: 'дона'
      },
      {
        name: 'iPhone 15',
        barcode: '0194253123456',
        categoryId: phones._id,
        purchasePrice: 12000000,
        sellingPrice: 14500000,
        currentStock: 8,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'Xiaomi Redmi Note 13',
        barcode: '6941812123456',
        categoryId: phones._id,
        purchasePrice: 2800000,
        sellingPrice: 3400000,
        currentStock: 20,
        minimumStock: 5,
        unit: 'дона'
      },
      {
        name: 'Samsung Музлатгич RT38',
        barcode: '8801643789012',
        categoryId: appliances._id,
        purchasePrice: 8500000,
        sellingPrice: 10200000,
        currentStock: 5,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'LG Кир ювиш машинаси',
        barcode: '8806091123456',
        categoryId: appliances._id,
        purchasePrice: 6000000,
        sellingPrice: 7500000,
        currentStock: 3,
        minimumStock: 2,
        unit: 'дона'
      }
    ]);
    console.log('✅ Products created');

    // Create customers
    await Customer.create([
      {
        fullName: 'Алишер Каримов',
        phone: '+998901234567',
        address: 'Тошкент, Чилонзор',
        currentDebt: 2500000,
        debtLimit: 5000000
      },
      {
        fullName: 'Дилноза Раҳимова',
        phone: '+998909876543',
        address: 'Тошкент, Юнусобод',
        currentDebt: 0,
        debtLimit: 3000000
      }
    ]);
    console.log('✅ Customers created');

    // Create settings
    await Setting.create([
      { key: 'currency', value: 'UZS' },
      { key: 'tax_rate', value: '0' },
      { key: 'low_stock_threshold', value: '5' },
      { key: 'storeName', value: 'XUJATECH Дўкон' },
      { key: 'storePhone', value: '+998 90 123 45 67' },
      { key: 'footerText', value: 'Харидингиз учун раҳмат!' }
    ]);
    console.log('✅ Settings created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  Kassir 1: kassir1 / 1234');
    console.log('  Kassir 2: kassir2 / 1234');
    console.log('  Kassir 3: kassir3 / 1234');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
