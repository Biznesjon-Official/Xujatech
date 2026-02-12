# XUJATECh - POS va Ombor Boshqaruv Tizimi

Modern POS (Point of Sale) va ombor boshqaruv tizimi maishiy texnika do'konlari uchun.

## 🚀 Xususiyatlar

- ✅ POS (Savdo nuqtasi) tizimi
- ✅ Ombor va mahsulot boshqaruvi
- ✅ Mijozlar va qarzlar nazorati
- ✅ Yetkazib berish boshqaruvi
- ✅ Qaytarishlar tizimi
- ✅ Offline-first arxitektura
- ✅ Ko'p filial bilan ishlash
- ✅ Barcode/QR kod skanerlash
- ✅ Telegram bot integratsiya
- ✅ Ko'p tillilik (Lotin/Kirill)

## 📋 Texnologiyalar

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Redux Toolkit
- PWA (Progressive Web App)

### Backend
- Node.js + Express
- TypeScript
- MongoDB
- Socket.IO
- JWT Authentication

## 🛠 O'rnatish

### Talablar
- Node.js 18+
- MongoDB 7+
- npm yoki yarn

### Lokal Development

1. Repository ni clone qiling:
```bash
git clone https://github.com/your-username/xujatech-pos.git
cd xujatech-pos
```

2. Barcha bog'liqliklarni o'rnating:
```bash
npm run install:all
```

3. Environment fayllarini sozlang:
```bash
# Backend
cp backend/.env.example backend/.env
# Desktop
cp desktop/.env.example desktop/.env
```

4. MongoDB ni ishga tushiring va .env faylida sozlang

5. Development rejimda ishga tushiring:
```bash
npm run dev
```

Backend: http://localhost:3000
Frontend: http://localhost:3001

### Production Build

```bash
npm run build
```

## 🚀 VPS ga Deploy

### Avtomatik Deploy (Tavsiya etiladi)

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Manual Deploy

Batafsil ko'rsatmalar uchun [DEPLOY.md](./DEPLOY.md) faylini ko'ring.

## 📦 Docker bilan ishga tushirish

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Standart Login

```
Username: admin
Password: admin123
```

⚠️ **Muhim**: Production muhitda parolni o'zgartiring!

## 📁 Loyiha Strukturasi

```
xujatech-pos/
├── backend/          # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── models/   # Database models
│   │   ├── services/ # Business logic
│   │   └── middleware/
│   └── Dockerfile
├── desktop/          # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── deploy-vps.sh
```

## 🔧 Muhim Buyruqlar

```bash
# Development
npm run dev              # Backend va frontend
npm run dev:backend      # Faqat backend
npm run dev:frontend     # Faqat frontend

# Build
npm run build            # Barcha build
npm run build:backend    # Backend build
npm run build:frontend   # Frontend build

# O'rnatish
npm run install:all      # Barcha dependencies
```

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
TELEGRAM_SELLER_BOT_TOKEN=your-bot-token
ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://yourdomain.com/api
VITE_STORE_NAME=XUJATECh Store
VITE_VERSION=1.0.0
```

## � Xavfsizlik

- JWT token autentifikatsiya
- Bcrypt parol shifrlash
- HTTPS/SSL
- CORS sozlamalari
- Rate limiting
- Input validatsiya

## � Yordam

Texnik yordam: support@xujatech.uz

## 📄 Litsenziya

© 2024-2026 XUJATECh. Barcha huquqlar himoyalangan.

## 🤝 Hissa qo'shish

Pull request'lar qabul qilinadi. Katta o'zgarishlar uchun avval issue oching.

---

**Ishlab chiqildi ❤️ bilan O'zbekiston uchun**
