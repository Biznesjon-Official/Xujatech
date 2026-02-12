#!/bin/bash

echo "🚀 XujaTech VPS Deployment Script"
echo "=================================="

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domain so'rash
read -p "Domain nomingizni kiriting (masalan: yourdomain.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain kiritilmadi! Script to'xtatildi.${NC}"
    exit 1
fi

echo -e "${BLUE}Domain: $DOMAIN${NC}"

# Email so'rash (SSL uchun)
read -p "Email manzilingizni kiriting (SSL uchun): " EMAIL
if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email kiritilmadi! Script to'xtatildi.${NC}"
    exit 1
fi

# 1. Sistemni yangilash
echo -e "${YELLOW}1. Sistemni yangilash...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Docker o'rnatish
echo -e "${YELLOW}2. Docker o'rnatish...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo apt install docker-compose-plugin -y
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker o'rnatildi${NC}"
else
    echo -e "${GREEN}✅ Docker allaqachon o'rnatilgan${NC}"
fi

# 3. Nginx va Certbot o'rnatish
echo -e "${YELLOW}3. Nginx va Certbot o'rnatish...${NC}"
sudo apt install nginx certbot python3-certbot-nginx -y

# 4. Firewall sozlash
echo -e "${YELLOW}4. Firewall sozlash...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo -e "${GREEN}✅ Firewall sozlandi${NC}"

# 5. SSL sertifikat olish
echo -e "${YELLOW}5. SSL sertifikat olish...${NC}"
sudo systemctl stop nginx

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    sudo certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SSL sertifikat olindi${NC}"
    else
        echo -e "${RED}❌ SSL sertifikat olishda xatolik!${NC}"
        echo -e "${YELLOW}DNS sozlamalarini tekshiring va qayta urinib ko'ring.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ SSL sertifikat allaqachon mavjud${NC}"
fi

# 6. SSL fayllarini nusxalash
echo -e "${YELLOW}6. SSL fayllarini nusxalash...${NC}"
mkdir -p ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
sudo chmod 644 ssl/*.pem
echo -e "${GREEN}✅ SSL fayllari nusxalandi${NC}"

# 7. Environment variables
echo -e "${YELLOW}7. Environment variables sozlash...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # Random JWT secrets generatsiya qilish
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    MONGO_PASSWORD=$(openssl rand -base64 16)
    
    # .env faylini yangilash
    sed -i "s|DOMAIN=yourdomain.com|DOMAIN=$DOMAIN|g" .env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" .env
    sed -i "s|MONGO_PASSWORD=.*|MONGO_PASSWORD=$MONGO_PASSWORD|g" .env
    
    echo -e "${GREEN}✅ .env fayl yaratildi va sozlandi${NC}"
    echo -e "${YELLOW}⚠️  Telegram bot sozlamalarini qo'lda qo'shing: nano .env${NC}"
else
    echo -e "${GREEN}✅ .env fayl mavjud${NC}"
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN|g" backend/.env
    
    # Root .env dan qiymatlarni olish
    source .env
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" backend/.env
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|g" backend/.env
    
    echo -e "${GREEN}✅ backend/.env yaratildi${NC}"
fi

# Frontend .env
if [ ! -f "desktop/.env" ]; then
    cp desktop/.env.example desktop/.env
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://$DOMAIN/api|g" desktop/.env
    echo -e "${GREEN}✅ desktop/.env yaratildi${NC}"
fi

# 8. Docker Compose faylini yangilash
echo -e "${YELLOW}8. Docker Compose sozlash...${NC}"
# Domain ni docker-compose.prod.yml ga qo'shish mumkin (agar kerak bo'lsa)

# 9. Loyihani ishga tushirish
echo -e "${YELLOW}9. Loyihani ishga tushirish...${NC}"
docker compose -f docker-compose.prod.yml down 2>/dev/null
docker compose -f docker-compose.prod.yml up -d --build

# 10. SSL avtomatik yangilash
echo -e "${YELLOW}10. SSL avtomatik yangilash sozlash...${NC}"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'docker compose -f $(pwd)/docker-compose.prod.yml restart frontend'") | crontab -
echo -e "${GREEN}✅ SSL avtomatik yangilanish sozlandi${NC}"

# 11. Health check
echo -e "${YELLOW}11. Tizim holatini tekshirish...${NC}"
sleep 10
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment muvaffaqiyatli tugallandi!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Saytingiz: https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}📋 Keyingi qadamlar:${NC}"
echo "1. Telegram bot sozlamalarini qo'shing: nano .env"
echo "2. Loglarni ko'ring: docker compose -f docker-compose.prod.yml logs -f"
echo "3. Holatni tekshiring: docker compose -f docker-compose.prod.yml ps"
echo "4. Saytni brauzerda oching: https://$DOMAIN"
echo ""
echo -e "${YELLOW}🔐 Standart login:${NC}"
echo "Username: admin"
echo "Password: admin123"
echo -e "${RED}⚠️  MUHIM: Birinchi kirishda parolni o'zgartiring!${NC}"
echo ""
echo -e "${YELLOW}📞 Yordam: support@xujatech.uz${NC}"
echo ""