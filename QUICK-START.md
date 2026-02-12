# 🚀 Quick Start Guide

XUJATECh POS tizimini tez ishga tushirish uchun qo'llanma.

## 📋 Talablar

- Node.js 18+ va npm
- MongoDB 7+ (yoki MongoDB Atlas account)
- Git

## ⚡ 5 Daqiqada Ishga Tushirish

### 1. Repository ni Clone Qiling

```bash
git clone https://github.com/your-username/xujatech-pos.git
cd xujatech-pos
```

### 2. Dependencies ni O'rnating

```bash
npm run install:all
```

Bu buyruq barcha kerakli package'larni o'rnatadi (root, backend, frontend).

### 3. Environment Fayllarini Sozlang

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp desktop/.env.example desktop/.env
```

Backend `.env` faylini tahrirlang:
```env
MONGODB_URI=mongodb://localhost:27017/xujatech_pos
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
```

### 4. MongoDB ni Ishga Tushiring

#### Option A: Local MongoDB
```bash
# MongoDB o'rnatilgan bo'lsa
mongod
```

#### Option B: Docker bilan MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

#### Option C: MongoDB Atlas (Cloud)
1. [MongoDB Atlas](https://cloud.mongodb.com) ga kiring
2. Free cluster yarating
3. Connection string ni `.env` ga qo'shing

### 5. Loyihani Ishga Tushiring

```bash
npm run dev
```

Bu buyruq backend va frontend ni bir vaqtda ishga tushiradi:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

### 6. Brauzerda Oching

http://localhost:3001 ga o'ting

**Standart Login:**
- Username: `admin`
- Password: `admin123`

## 🎯 Keyingi Qadamlar

### Test Ma'lumotlarini Yuklash

```bash
cd backend
npm run seed
```

Bu buyruq test ma'lumotlarini database ga yuklaydi:
- Kategoriyalar
- Mahsulotlar
- Mijozlar
- Omborlar

### Production Build

```bash
npm run build
```

### Docker bilan Ishga Tushirish

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Foydali Buyruqlar

```bash
# Development
npm run dev              # Backend + Frontend
npm run dev:backend      # Faqat backend
npm run dev:frontend     # Faqat frontend

# Build
npm run build            # Barcha build
npm run build:backend    # Backend build
npm run build:frontend   # Frontend build

# Database
cd backend
npm run seed             # Test ma'lumotlarini yuklash
npm run restore          # Database ni tiklash

# Docker
npm run docker:dev       # Development mode
npm run docker:prod      # Production mode
npm run docker:down      # To'xtatish
npm run docker:logs      # Loglarni ko'rish
```

## 📱 Funksiyalar

### POS Tizimi
- Mahsulot qidirish va tanlash
- Barcode skanerlash
- Savat boshqaruvi
- To'lov qabul qilish
- Chek chop etish

### Ombor Boshqaruvi
- Mahsulotlar katalogi
- Ombor qoldiqlari
- Kirim/chiqim operatsiyalari
- Inventarizatsiya

### Mijozlar va Qarzlar
- Mijozlar bazasi
- Qarz berish va qabul qilish
- To'lov tarixi
- Eslatmalar

### Hisobotlar
- Savdo hisobotlari
- Moliyaviy hisobotlar
- Ombor hisobotlari
- Kassir hisobotlari

## 🆘 Muammolar

### Port band bo'lsa

Backend yoki frontend porti band bo'lsa, `.env` faylida portni o'zgartiring:

```env
# Backend
PORT=3006

# Frontend (vite.config.ts)
server: { port: 3002 }
```

### MongoDB connection xatosi

1. MongoDB ishlab turganini tekshiring:
   ```bash
   mongosh
   ```

2. Connection string to'g'riligini tekshiring

3. MongoDB Atlas ishlatayotgan bo'lsangiz, IP whitelist ni tekshiring

### Build xatosi

```bash
# Cache ni tozalash
cd backend && rm -rf node_modules dist && npm install
cd desktop && rm -rf node_modules dist && npm install
```

## 📞 Yordam

- Email: support@xujatech.uz
- Telegram: @xujatech_support
- GitHub Issues: [Issues](https://github.com/your-username/xujatech-pos/issues)

## 📚 Qo'shimcha Hujjatlar

- [README.md](./README.md) - To'liq hujjat
- [DEPLOY.md](./DEPLOY.md) - Deploy qo'llanmasi
- [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) - Production checklist
- [SECURITY.md](./SECURITY.md) - Xavfsizlik

---

**Muvaffaqiyatli ishlatish! 🎉**
