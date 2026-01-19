import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Category, Product, Customer, Setting } from '../models';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xujatech_pos';

async function restore() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Backup fayllarini topish
    const backupFiles = fs.readdirSync('./').filter(file => file.startsWith('backup_') && file.endsWith('.json'));
    
    if (backupFiles.length === 0) {
      console.log('❌ Backup fayllari topilmadi!');
      process.exit(1);
    }

    // Eng oxirgi backup faylini tanlash
    const latestBackup = backupFiles.sort().reverse()[0];
    console.log(`📁 Backup fayl: ${latestBackup}`);

    // Backup faylini o'qish
    const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));

    console.log('🔄 Ma\'lumotlar tiklanmoqda...');

    // Ma'lumotlarni tiklash
    if (backupData.users && backupData.users.length > 0) {
      await User.insertMany(backupData.users);
      console.log(`✅ ${backupData.users.length} ta user tiklandi`);
    }

    if (backupData.categories && backupData.categories.length > 0) {
      await Category.insertMany(backupData.categories);
      console.log(`✅ ${backupData.categories.length} ta category tiklandi`);
    }

    if (backupData.products && backupData.products.length > 0) {
      await Product.insertMany(backupData.products);
      console.log(`✅ ${backupData.products.length} ta product tiklandi`);
    }

    if (backupData.customers && backupData.customers.length > 0) {
      await Customer.insertMany(backupData.customers);
      console.log(`✅ ${backupData.customers.length} ta customer tiklandi`);
    }

    if (backupData.settings && backupData.settings.length > 0) {
      await Setting.insertMany(backupData.settings);
      console.log(`✅ ${backupData.settings.length} ta setting tiklandi`);
    }

    console.log('\n🎉 Ma\'lumotlar muvaffaqiyatli tiklandi!');
    process.exit(0);
  } catch (error) {
    console.error('Restore error:', error);
    process.exit(1);
  }
}

restore();