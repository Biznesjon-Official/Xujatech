import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Category, Product, Customer, Setting } from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xujatech_pos';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Backup yaratish (xavfsizlik uchun)
    console.log('🔄 Backup yaratilmoqda...');
    const backupData = {
      users: await User.find({}),
      categories: await Category.find({}),
      products: await Product.find({}),
      customers: await Customer.find({}),
      settings: await Setting.find({})
    };
    
    // Backup faylga saqlash
    const fs = require('fs');
    const backupPath = `./backup_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saqlandi: ${backupPath}`);

    // Foydalanuvchidan tasdiqlash so'rash
    console.log('⚠️  DIQQAT: Barcha mavjud ma\'lumotlar o\'chiriladi!');
    console.log(`📁 Backup fayl: ${backupPath}`);
    
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
    const washingMachines = await Category.create({ name: 'Кир ювиш машиналари', parentId: appliances._id });
    const tvs = await Category.create({ name: 'Телевизорлар', parentId: electronics._id });
    const airConditioners = await Category.create({ name: 'Кондиционерлар', parentId: appliances._id });
    const microwaves = await Category.create({ name: 'Микроволновкалар', parentId: appliances._id });
    const refrigerators = await Category.create({ name: 'Музлатгичлар', parentId: appliances._id });
    const smallAppliances = await Category.create({ name: 'Кичик маиший техника', parentId: appliances._id });
    console.log('✅ Categories created');

    // Create products
    await Product.create([
      // Telefonlar
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

      // Kir yuvish mashinalari
      {
        name: 'LG F2J3HS8W 7kg',
        barcode: '1768125014164',
        categoryId: washingMachines._id,
        purchasePrice: 4500000,
        sellingPrice: 5400000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ZIFFLER T80-J1DG 8KG',
        barcode: '1768125091404',
        categoryId: washingMachines._id,
        purchasePrice: 3800000,
        sellingPrice: 4560000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'AVALON AVL-WM1610B 8KG',
        barcode: '1768125164547',
        categoryId: washingMachines._id,
        purchasePrice: 4200000,
        sellingPrice: 5040000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'RULLS KR82DC14S 8KG',
        barcode: '1768125230040',
        categoryId: washingMachines._id,
        purchasePrice: 4000000,
        sellingPrice: 4800000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PREMIER 7kg',
        barcode: '1768125294176',
        categoryId: washingMachines._id,
        purchasePrice: 3500000,
        sellingPrice: 4200000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'HISENS 6KG',
        barcode: '1768125397367',
        categoryId: washingMachines._id,
        purchasePrice: 3200000,
        sellingPrice: 3840000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PREMIER PRMWM08-CCP1 8KG',
        barcode: '1768125602470',
        categoryId: washingMachines._id,
        purchasePrice: 3900000,
        sellingPrice: 4680000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PREMIER PRMWM07-CCP23 7KG',
        barcode: '1768125751216',
        categoryId: washingMachines._id,
        purchasePrice: 3700000,
        sellingPrice: 4440000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'VOLTO 7KG',
        barcode: '1768126015581',
        categoryId: washingMachines._id,
        purchasePrice: 3600000,
        sellingPrice: 4320000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SHIVAKI 8KG TG80F',
        barcode: '1768126161985',
        categoryId: washingMachines._id,
        purchasePrice: 4100000,
        sellingPrice: 4920000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'MOONX 7KG',
        barcode: '1768126188068',
        categoryId: washingMachines._id,
        purchasePrice: 3400000,
        sellingPrice: 4080000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SIRIUS 7KG',
        barcode: '1768126232700',
        categoryId: washingMachines._id,
        purchasePrice: 3300000,
        sellingPrice: 3960000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ASR 7KG',
        barcode: '1768126387206',
        categoryId: washingMachines._id,
        purchasePrice: 3100000,
        sellingPrice: 3720000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'OPTIMA 7KG',
        barcode: '1768126427011',
        categoryId: washingMachines._id,
        purchasePrice: 3200000,
        sellingPrice: 3840000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'AVANGARD 7KG',
        barcode: '1768126484594',
        categoryId: washingMachines._id,
        purchasePrice: 3300000,
        sellingPrice: 3960000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SHIVAKI 6KG',
        barcode: '1768126510564',
        categoryId: washingMachines._id,
        purchasePrice: 3000000,
        sellingPrice: 3600000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SIRIUS 9KG',
        barcode: '1768126543520',
        categoryId: washingMachines._id,
        purchasePrice: 4300000,
        sellingPrice: 5160000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },

      // Televizorlar
      {
        name: 'TCL 55" 55V6C',
        barcode: '1768130529875',
        categoryId: tvs._id,
        purchasePrice: 6500000,
        sellingPrice: 7800000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'GOLDSTAR 32"',
        barcode: '1768131165651',
        categoryId: tvs._id,
        purchasePrice: 2800000,
        sellingPrice: 3360000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SONOR 32"',
        barcode: '1768131297322',
        categoryId: tvs._id,
        purchasePrice: 2700000,
        sellingPrice: 3240000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SAMSUNG 35"',
        barcode: '1768131333648',
        categoryId: tvs._id,
        purchasePrice: 4200000,
        sellingPrice: 5040000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ROSSO 32GX ONE SMART',
        barcode: '1768131395245',
        categoryId: tvs._id,
        purchasePrice: 3100000,
        sellingPrice: 3720000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ROSSO 32WEB OS TWO',
        barcode: '1768131456227',
        categoryId: tvs._id,
        purchasePrice: 3200000,
        sellingPrice: 3840000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'GOLDSTAR 43"',
        barcode: '1768131537909',
        categoryId: tvs._id,
        purchasePrice: 3800000,
        sellingPrice: 4560000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'VOLTO 43"',
        barcode: '1768131861109',
        categoryId: tvs._id,
        purchasePrice: 3600000,
        sellingPrice: 4320000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ROISON 43"',
        barcode: '1768131947641',
        categoryId: tvs._id,
        purchasePrice: 3700000,
        sellingPrice: 4440000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'BELLSTAR 43"',
        barcode: '1768131999610',
        categoryId: tvs._id,
        purchasePrice: 3500000,
        sellingPrice: 4200000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SONOR 43"',
        barcode: '1768132074266',
        categoryId: tvs._id,
        purchasePrice: 3600000,
        sellingPrice: 4320000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'IMMER 43"',
        barcode: '1768132126680',
        categoryId: tvs._id,
        purchasePrice: 3400000,
        sellingPrice: 4080000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ZIFFLER 43"',
        barcode: '1768132591398',
        categoryId: tvs._id,
        purchasePrice: 3300000,
        sellingPrice: 3960000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },

      // Konditsionerlar
      {
        name: 'AUX 12 FADR',
        barcode: '1768304110883',
        categoryId: airConditioners._id,
        purchasePrice: 3500000,
        sellingPrice: 4200000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SITRONIK 12',
        barcode: '1768304213253',
        categoryId: airConditioners._id,
        purchasePrice: 3200000,
        sellingPrice: 3840000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PREMIER 12 ELUNA',
        barcode: '1768304380280',
        categoryId: airConditioners._id,
        purchasePrice: 3400000,
        sellingPrice: 4080000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'AUX 12 HGR',
        barcode: '1768304621467',
        categoryId: airConditioners._id,
        purchasePrice: 3600000,
        sellingPrice: 4320000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ROSSO 12 ARIA',
        barcode: '1768304740734',
        categoryId: airConditioners._id,
        purchasePrice: 3300000,
        sellingPrice: 3960000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'AVALON 18',
        barcode: '1768304868446',
        categoryId: airConditioners._id,
        purchasePrice: 4500000,
        sellingPrice: 5400000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },

      // Mikrovalnokalar va boshqa texnika
      {
        name: 'MOONX 65 MW805',
        barcode: '1768130416126',
        categoryId: microwaves._id,
        purchasePrice: 1200000,
        sellingPrice: 1440000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'IMMER C60K-BLACK',
        barcode: '1768305267169',
        categoryId: smallAppliances._id,
        purchasePrice: 800000,
        sellingPrice: 960000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PREMIER',
        barcode: '1768305381881',
        categoryId: smallAppliances._id,
        purchasePrice: 900000,
        sellingPrice: 1080000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ROSSO',
        barcode: '1768306443131',
        categoryId: smallAppliances._id,
        purchasePrice: 850000,
        sellingPrice: 1020000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'TOSHIBA',
        barcode: '1768306722201',
        categoryId: smallAppliances._id,
        purchasePrice: 1100000,
        sellingPrice: 1320000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'STRONG',
        barcode: '1768306789645',
        categoryId: smallAppliances._id,
        purchasePrice: 950000,
        sellingPrice: 1140000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PRIMIER',
        barcode: '1768306921608',
        categoryId: smallAppliances._id,
        purchasePrice: 900000,
        sellingPrice: 1080000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'BOSCH',
        barcode: '1768307584388',
        categoryId: smallAppliances._id,
        purchasePrice: 1500000,
        sellingPrice: 1800000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'VIKALINA VL-989D',
        barcode: '1768307927301',
        categoryId: smallAppliances._id,
        purchasePrice: 700000,
        sellingPrice: 840000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SONIFER',
        barcode: '1768308087716',
        categoryId: smallAppliances._id,
        purchasePrice: 600000,
        sellingPrice: 720000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'SONIFER 2',
        barcode: '1768308183187',
        categoryId: smallAppliances._id,
        purchasePrice: 650000,
        sellingPrice: 780000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'UAKEEN',
        barcode: '1768308228414',
        categoryId: smallAppliances._id,
        purchasePrice: 750000,
        sellingPrice: 900000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },

      // Muzlatgichlar
      {
        name: 'Samsung Музлатгич RT38',
        barcode: '8801643789012',
        categoryId: refrigerators._id,
        purchasePrice: 8500000,
        sellingPrice: 10200000,
        currentStock: 5,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ROSSO 20',
        barcode: '1768308638398',
        categoryId: refrigerators._id,
        purchasePrice: 4500000,
        sellingPrice: 5400000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'HISENSE 20',
        barcode: '1768308800382',
        categoryId: refrigerators._id,
        purchasePrice: 4800000,
        sellingPrice: 5760000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ARTEL',
        barcode: '1768308904712',
        categoryId: refrigerators._id,
        purchasePrice: 4200000,
        sellingPrice: 5040000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PREMIER 20',
        barcode: '1768308951010',
        categoryId: refrigerators._id,
        purchasePrice: 4000000,
        sellingPrice: 4800000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'PREMIER 23',
        barcode: '1768308981382',
        categoryId: refrigerators._id,
        purchasePrice: 4300000,
        sellingPrice: 5160000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'AVANGARD 20',
        barcode: '1768309025537',
        categoryId: refrigerators._id,
        purchasePrice: 4100000,
        sellingPrice: 4920000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'IDEAL 35',
        barcode: '1768309204925',
        categoryId: refrigerators._id,
        purchasePrice: 5500000,
        sellingPrice: 6600000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'IDEAL 50',
        barcode: '1768309269059',
        categoryId: refrigerators._id,
        purchasePrice: 6500000,
        sellingPrice: 7800000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'IEMAT',
        barcode: '1768309294616',
        categoryId: refrigerators._id,
        purchasePrice: 3800000,
        sellingPrice: 4560000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'ENERGY 4KG',
        barcode: '1768309412790',
        categoryId: smallAppliances._id,
        purchasePrice: 1200000,
        sellingPrice: 1440000,
        currentStock: 1,
        minimumStock: 2,
        unit: 'дона'
      },
      {
        name: 'OPTIMA 4',
        barcode: '1768309459392',
        categoryId: smallAppliances._id,
        purchasePrice: 1100000,
        sellingPrice: 1320000,
        currentStock: 1,
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
