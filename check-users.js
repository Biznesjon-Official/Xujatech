/**
 * Database'dagi userlarni tekshirish
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function checkUsers() {
  try {
    console.log('🔌 MongoDB ga ulanilmoqda...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    const users = await User.find({}).select('username fullName role isActive');
    
    console.log('👥 Database\'dagi userlar:');
    console.log('═'.repeat(60));
    
    if (users.length === 0) {
      console.log('❌ Database bo\'sh! Userlar yo\'q.');
      console.log('\n📝 Seed ishga tushiring:');
      console.log('   cd backend');
      console.log('   npm run seed');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Ism: ${user.fullName}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Aktiv: ${user.isActive !== false ? '✅' : '❌'}`);
        console.log('');
      });
      
      console.log('═'.repeat(60));
      console.log(`Jami: ${users.length} ta user`);
      
      console.log('\n🔑 Login ma\'lumotlari (seed.ts dan):');
      console.log('   Admin: admin / admin123');
      console.log('   Kassir 1: kassir1 / 1234');
      console.log('   Kassir 2: kassir2 / 1234');
      console.log('   Kassir 3: kassir3 / 1234');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  }
}

checkUsers();
