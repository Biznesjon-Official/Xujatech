/**
 * Login muammosini tekshirish
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://gulsararustamova4_db_user:jS1Gb9KOZ7eNJyBB@cluster0.iomwq8y.mongodb.net/xujatech_pos_dev?retryWrites=true&w=majority&appName=Cluster0';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fullName: String,
  role: String,
  isActive: Boolean
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function testLogin() {
  try {
    console.log('🔌 MongoDB ga ulanilmoqda...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB ga ulandi\n');

    // Test login credentials
    const testCases = [
      { username: 'admin', password: 'admin123' },
      { username: 'kassir1', password: '1234' },
      { username: 'kassir2', password: '1234' },
      { username: 'kassir3', password: '1234' }
    ];

    console.log('🔐 Login testlari:\n');
    console.log('═'.repeat(70));

    for (const testCase of testCases) {
      const user = await User.findOne({ username: testCase.username, isActive: true });
      
      if (!user) {
        console.log(`❌ ${testCase.username}: User topilmadi!`);
        continue;
      }

      const isMatch = await user.comparePassword(testCase.password);
      
      if (isMatch) {
        console.log(`✅ ${testCase.username} / ${testCase.password} - LOGIN MUVAFFAQIYATLI`);
        console.log(`   Ism: ${user.fullName}`);
        console.log(`   Rol: ${user.role}`);
      } else {
        console.log(`❌ ${testCase.username} / ${testCase.password} - PAROL NOTO'G'RI`);
        console.log(`   Database'dagi hash: ${user.password.substring(0, 20)}...`);
      }
      console.log('');
    }

    console.log('═'.repeat(70));

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
  }
}

testLogin();
