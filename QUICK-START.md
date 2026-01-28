# 🚀 Tezkor Boshlash - 5 Daqiqada

## 1️⃣ Talablar Tekshirish
```bash
node --version    # 18+ bo'lishi kerak
npm --version     # 8+ bo'lishi kerak
```

## 2️⃣ MongoDB O'rnatish
**Windows:**
- [MongoDB Community](https://www.mongodb.com/try/download/community) yuklab oling
- O'rnatib, MongoDB Compass bilan tekshiring

**yoki MongoDB Atlas (bulut):**
- [atlas.mongodb.com](https://atlas.mongodb.com) da ro'yxatdan o'ting
- Cluster yaratib, connection string oling

## 3️⃣ Loyihani Ishga Tushirish
```bash
# 1. Dependencies o'rnatish
npm install

# 2. Environment sozlash
cd backend
cp .env.example .env
# .env da MONGODB_URI ni o'zgartiring

cd ../desktop  
cp .env.example .env

# 3. Database tayyorlash
cd ../backend
npm run migrate
npm run seed

# 4. Ishga tushirish
cd ..
npm run dev
```

## 4️⃣ Ochish
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Login:** admin / admin123

## ✅ Tayyor!
POS tizimi ishga tushdi. Mahsulot qo'shib, sotishni boshlashingiz mumkin!

---

**Batafsil qo'llanma:** `SETUP-GUIDE.md` faylini o'qing.