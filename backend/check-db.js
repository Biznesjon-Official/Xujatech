const mongoose = require('mongoose');

async function checkDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/xujatech_pos');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Mavjud collections:');
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`  ${collection.name}: ${count} ta document`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDB();