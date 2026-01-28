#!/bin/bash

# XujaTech POS Production Deployment Script
# Bu script VPS da ishlatiladi

echo "🚀 XujaTech POS Production Deployment boshlandi..."

# 1. Yangi kodlarni olish
echo "📥 Git pull..."
git pull origin main

# 2. Dependencies o'rnatish
echo "📦 Dependencies o'rnatilmoqda..."
npm install
cd backend && npm install
cd ../desktop && npm install

# 3. Environment fayllarini tekshirish
echo "🔧 Environment fayllarini tekshirish..."
if [ ! -f backend/.env ]; then
    echo "❌ backend/.env fayli topilmadi!"
    echo "backend/.env.example dan nusxa oling va to'ldiring"
    exit 1
fi

if [ ! -f desktop/.env ]; then
    echo "❌ desktop/.env fayli topilmadi!"
    echo "desktop/.env.example dan nusxa oling va to'ldiring"
    exit 1
fi

# 4. Build qilish
echo "🔨 Backend build qilinmoqda..."
cd backend && npm run build

echo "🔨 Frontend build qilinmoqda..."
cd ../desktop && npm run build

# 5. PM2 bilan restart
echo "🔄 PM2 restart..."
cd ..
pm2 restart xujatech-backend --update-env || pm2 start backend/dist/server.js --name xujatech-backend

# 6. Nginx reload
echo "🌐 Nginx reload..."
sudo nginx -t && sudo systemctl reload nginx

# 7. Status tekshirish
echo "✅ Deployment tugallandi!"
echo "📊 PM2 Status:"
pm2 status | grep xujatech

echo "🌐 Test qilish:"
echo "curl http://localhost:3000/api/health"
echo "https://xujatech.biznesjon.uz"

echo "🎉 Deployment muvaffaqiyatli tugallandi!"