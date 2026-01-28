/**
 * Database'dagi kassirlarni ko'rish (FAQAT KO'RISH, O'CHIRISH YO'Q!)
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://gulsararustamova4_db_user:jS1Gb9KOZ7eNJyBB@cluster0.iomwq8y.mongodb.net/xujatech_pos?retryWrites=true&w=majority&appName=Cluster0';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
  role: String,
  isActive: Boolean,
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

async function checkCashiers() {
  try {
    console.log('🔌 MongoDB ga ulanilmoqda...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB ga ulandi (xujatech_pos)\n');

    // Barcha userlarni ko'rish
    const allUsers = await User.find({}).select('username fullName role isActive lastLogin');
    
    console.log('👥 DATABASE\'DAGI BARCHA USERLAR:');
    console.log('═'.repeat(80));
    
    if (allUsers.length === 0) {
      console.log('❌ Database bo\'sh! Userlar yo\'q.');
    } else {
      // Admin va managerlar
      const admins = allUsers.filter(u => u.role === 'admin' || u.role === 'manager');
      if (admins.length > 0) {
        console.log('\n🔑 ADMINLAR VA MANAGERLAR:');
        admins.forEach((user, index) => {
          console.log(`\n${index + 1}. Username: ${user.username}`);
          console.log(`   Ism: ${user.fullName}`);
          console.log(`   Rol: ${user.role}`);
          console.log(`   Aktiv: ${user.isActive !== false ? '✅' : '❌'}`);
          if (user.lastLogin) {
            console.log(`   Oxirgi kirish: ${new Date(user.lastLogin).toLocaleString('uz-UZ')}`);
          }
        });
      }

      // Kassirlar
      const cashiers = allUsers.filter(u => u.role === 'cashier');
      if (cashiers.length > 0) {
        console.log('\n\n💰 KASSIRLAR:');
        cashiers.forEach((user, index) => {
          console.log(`\n${index + 1}. Username: ${user.username}`);
          console.log(`   Ism: ${user.fullName}`);
          console.log(`   Aktiv: ${user.isActive !== false ? '✅' : '❌'}`);
          if (user.lastLogin) {
            console.log(`   Oxirgi kirish: ${new Date(user.lastLogin).toLocaleString('uz-UZ')}`);
          }
        });
      } else {
        console.log('\n❌ Kassirlar topilmadi!');
      }
      
      console.log('\n' + '═'.repeat(80));
      console.log(`\n📊 JAMI: ${allUsers.length} ta user`);
      console.log(`   - Adminlar: ${admins.length} ta`);
      console.log(`   - Kassirlar: ${cashiers.length} ta`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Tekshiruv tugadi. HECH NARSA O\'CHIRILMADI!\n');
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  }
}

checkCashiers();
