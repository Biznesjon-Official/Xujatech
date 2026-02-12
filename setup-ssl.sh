#!/bin/bash

# SSL o'rnatish skripti
# Ishlatish: sudo bash setup-ssl.sh your-domain.com

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Iltimos, sudo bilan ishga tushiring: sudo bash setup-ssl.sh your-domain.com"
    exit 1
fi

if [ -z "$1" ]; then
    echo "❌ Domen nomini kiriting!"
    echo "Ishlatish: sudo bash setup-ssl.sh your-domain.com"
    exit 1
fi

DOMAIN=$1
WWW_DOMAIN="www.$DOMAIN"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 SSL SERTIFIKAT O'RNATISH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Domen: $DOMAIN"
echo "📋 WWW: $WWW_DOMAIN"
echo ""

# 1. Certbot o'rnatilganligini tekshirish
echo "1️⃣  Certbot tekshirilmoqda..."
if ! command -v certbot &> /dev/null; then
    echo "📦 Certbot o'rnatilmoqda..."
    apt update
    apt install certbot python3-certbot-nginx -y
    echo "✅ Certbot o'rnatildi"
else
    echo "✅ Certbot allaqachon o'rnatilgan"
fi
echo ""

# 2. Nginx tekshiruvi
echo "2️⃣  Nginx tekshirilmoqda..."
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx o'rnatilmagan!"
    echo "O'rnatish: sudo apt install nginx -y"
    exit 1
fi
echo "✅ Nginx topildi"
echo ""

# 3. Nginx konfiguratsiyasini tekshirish
echo "3️⃣  Nginx konfiguratsiyasi tekshirilmoqda..."
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Nginx konfiguratsiyasida xatolik bor!"
    exit 1
fi
echo "✅ Konfiguratsiya to'g'ri"
echo ""

# 4. Port 80 ochiqligini tekshirish
echo "4️⃣  Port 80 tekshirilmoqda..."
if netstat -tulpn | grep -q ':80'; then
    echo "✅ Port 80 ochiq"
else
    echo "⚠️  Port 80 yopiq yoki band emas"
fi
echo ""

# 5. Firewall sozlamalari
echo "5️⃣  Firewall sozlanmoqda..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    echo "✅ Firewall sozlandi"
else
    echo "⚠️  UFW topilmadi"
fi
echo ""

# 6. SSL sertifikat olish
echo "6️⃣  SSL sertifikat olinmoqda..."
echo ""
echo "⚠️  DIQQAT: Certbot sizdan email va savollar so'raydi!"
echo ""
read -p "Davom etishni xohlaysizmi? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN -d $WWW_DOMAIN
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ SSL SERTIFIKAT MUVAFFAQIYATLI O'RNATILDI!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "🌐 Saytingiz: https://$DOMAIN"
        echo "🌐 WWW: https://$WWW_DOMAIN"
        echo ""
        echo "📋 Sertifikat ma'lumotlari:"
        certbot certificates
        echo ""
        echo "🔄 Avtomatik yangilanish:"
        echo "   Certbot har 12 soatda sertifikatni tekshiradi"
        echo "   Test: sudo certbot renew --dry-run"
        echo ""
        echo "📊 SSL tekshirish:"
        echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
        echo ""
    else
        echo ""
        echo "❌ SSL sertifikat olishda xatolik!"
        echo ""
        echo "Mumkin bo'lgan sabablar:"
        echo "  - Domen DNS sozlamalari noto'g'ri"
        echo "  - Port 80 yopiq"
        echo "  - Nginx to'g'ri ishlamayapti"
        echo ""
        echo "Tekshirish:"
        echo "  1. DNS: dig $DOMAIN"
        echo "  2. Port: sudo netstat -tulpn | grep :80"
        echo "  3. Nginx: sudo systemctl status nginx"
        echo ""
    fi
else
    echo "❌ Bekor qilindi"
    exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
