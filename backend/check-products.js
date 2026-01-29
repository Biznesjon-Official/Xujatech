const mongoose = require('mongoose');
require('dotenv').config();

const productSchema = new mongoose.Schema({
  barcode: String,
  name: String,
  sellingPrice: Number,
  currentStock: Number,
  isActive: Boolean,
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const count = await Product.countDocuments();
    console.log(`\n📦 Total products: ${count}`);

    const activeCount = await Product.countDocuments({ isActive: true });
    console.log(`✅ Active products: ${activeCount}`);

    const inactiveCount = await Product.countDocuments({ isActive: false });
    console.log(`❌ Inactive products: ${inactiveCount}`);

    console.log('\n📋 Sample products (first 5):');
    const samples = await Product.find().limit(5);
    samples.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Barcode: ${p.barcode || 'N/A'}`);
      console.log(`   Price: ${p.sellingPrice || 0}`);
      console.log(`   Stock: ${p.currentStock || 0}`);
      console.log(`   Active: ${p.isActive !== false ? 'Yes' : 'No'}`);
    });

    // Test search
    console.log('\n🔍 Testing search with "a":');
    const searchResults = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: 'a', $options: 'i' } },
        { barcode: { $regex: 'a', $options: 'i' } }
      ]
    }).limit(3);
    console.log(`Found ${searchResults.length} products`);
    searchResults.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.barcode || 'no barcode'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  }
}

checkProducts();
