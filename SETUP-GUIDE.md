# XUJATECh POS System - O'rnatish Qo'llanmasi

## 📋 Talablar

### Dasturiy Ta'minot
- **Node.js** 18+ versiyasi ([nodejs.org](https://nodejs.org))
- **MongoDB** 6.0+ ([mongodb.com](https://www.mongodb.com/try/download/community))
- **Git** ([git-scm.com](https://git-scm.com))

### Ixtiyoriy
- **Docker** va **Docker Compose** (konteyner uchun)
- **MongoDB Atlas** (bulut database uchun)

---

## 🚀 Tezkor O'rnatish

### 1. Loyihani Ochish
```bash
# ZIP faylni ochib, papkaga kiring
cd xujatech-pos
```

### 2. Dependencies O'rnatish
```bash
# Barcha dependencies o'rnatish
npm install

# Yoki alohida
cd backend && npm install
cd ../desktop && npm install
```

### 3. Environment Fayllarini Sozlash

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

`.env` faylini tahrirlang:
```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# MongoDB ulanishi
MONGODB_URI=mongodb://localhost:27017/xujatech_pos
# Yoki MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/xujatech_pos

# JWT kalitlari
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Telegram Bot (ixtiyoriy)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

LOG_LEVEL=info
```

**Desktop (.env):**
```bash
cd desktop
cp .env.example .env
```

`.env` faylini tahrirlang:
```env
VITE_API_URL=http://localhost:3000
VITE_STORE_NAME=XUJATECh Store
VITE_VERSION=1.0.0
```

### 4. Database Sozlash

**MongoDB Local:**
```bash
# MongoDB ishga tushiring
mongod

# Yoki Windows service sifatida:
net start MongoDB
```

**Database Migration va Seed:**
```bash
cd backend
npm run migrate    # Database schema yaratish
npm run seed      # Boshlang'ich ma'lumotlar
```

### 5. Loyihani Ishga Tushirish

**Development rejimi:**
```bash
# Root papkadan (ikkala server ham ishga tushadi)
npm run dev

# Yoki alohida:
npm run dev:backend    # Backend: http://localhost:3000
npm run dev:frontend   # Frontend: http://localhost:3001
```

**Production build:**
```bash
npm run build
npm start
```

---

## 🔐 Standart Login Ma'lumotlari

- **Username:** admin
- **Password:** admin123

⚠️ **Muhim:** Birinchi kirishdan keyin parolni o'zgartiring!

---

## 🐳 Docker bilan Ishga Tushirish

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📱 Xususiyatlar

### POS Funksiyalari
- ✅ Mahsulot sotish va barcode scanning
- ✅ Mijozlar va qarz boshqaruvi
- ✅ Chek chop etish
- ✅ Offline rejimda ishlash
- ✅ Ko'p to'lov usullari (naqd, karta, qarz, Click, Payme)

### Admin Panel
- ✅ Mahsulotlar boshqaruvi
- ✅ Inventar nazorati
- ✅ Hisobotlar va statistika
- ✅ Foydalanuvchilar boshqaruvi
- ✅ Sozlamalar

### Hardware Integratsiya
- ✅ Barcode scanner (USB/Camera)
- ✅ Receipt printer (ESC/POS)
- ✅ Cash drawer

---

## 🛠️ Muammolarni Hal Qilish

### MongoDB ulanish xatosi
```bash
# MongoDB ishlab turganini tekshiring
mongod --version

# Ulanish stringini tekshiring
mongo "mongodb://localhost:27017/xujatech_pos"
```

### Port band bo'lsa
```bash
# Portlarni tekshiring
netstat -an | findstr :3000
netstat -an | findstr :3001

# .env faylda portni o'zgartiring
```

### Dependencies xatosi
```bash
# Cache tozalash
npm cache clean --force

# Node modules qayta o'rnatish
rm -rf node_modules package-lock.json
npm install
```

### Build xatosi
```bash
# TypeScript xatolarini tekshiring
cd backend && npm run build
cd desktop && npm run build
```

---

## 📞 Yordam

### Loglarni Tekshirish
```bash
# Backend loglari
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Development console
npm run dev  # Console da xatolarni ko'ring
```

### Database Backup/Restore
```bash
# Backup
cd backend
npm run backup

# Restore
npm run restore
```

### Telegram Bot Sozlash
1. [@BotFather](https://t.me/botfather) ga murojaat qiling
2. `/newbot` buyrug'i bilan bot yarating
3. Token ni `.env` fayliga qo'shing
4. Chat ID ni olish uchun botga xabar yuboring

---

## 🔧 Qo'shimcha Sozlamalar

### SSL Sertifikat (Production)
```bash
# Let's Encrypt bilan
./generate-ssl.sh your-domain.com

# Yoki Windows da
./generate-ssl.ps1 your-domain.com
```

### VPS Deployment
`VPS-DEPLOYMENT.md` faylini o'qing.

### Nginx Reverse Proxy
`nginx.conf` faylini ishlatib Nginx sozlang.

---

## 📋 Tekshirish Ro'yxati

- [ ] Node.js 18+ o'rnatilgan
- [ ] MongoDB ishlab turibdi
- [ ] `.env` fayllar to'g'ri sozlangan
- [ ] Dependencies o'rnatilgan (`npm install`)
- [ ] Database migration bajarilgan (`npm run migrate`)
- [ ] Seed data yuklangan (`npm run seed`)
- [ ] Backend ishga tushgan (http://localhost:3000)
- [ ] Frontend ishga tushgan (http://localhost:3001)
- [ ] Admin panel ochiladi (admin/admin123)
- [ ] POS interface ishlaydi

---

## 🎯 Keyingi Qadamlar

1. **Sozlamalar:** Admin panelda do'kon ma'lumotlarini kiriting
2. **Mahsulotlar:** Mahsulotlar va kategoriyalarni qo'shing
3. **Foydalanuvchilar:** Kassirlar uchun hisoblar yarating
4. **Hardware:** Printer va scanner ulang
5. **Backup:** Muntazam backup rejasini sozlang

---

**Muvaffaqiyat tilaklar! 🎉**

Savollar bo'lsa, loyiha README.md faylini o'qing yoki GitHub Issues bo'limiga murojaat qiling.