#!/bin/bash

echo "🚀 XujaTech VPS Deployment Script"
echo "=================================="

# Ranglar
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Domain tekshirish
DOMAIN="xugtech.biznesjon.uz"
echo -e "${YELLOW}Domain: $DOMAIN${NC}"

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
    echo -e "${GREEN}Docker o'rnatildi${NC}"
else
    echo -e "${GREEN}Docker allaqachon o'rnatilgan${NC}"
fi

# 3. Nginx va Certbot o'rnatish
echo -e "${YELLOW}3. Nginx va Certbot o'rnatish...${NC}"
sudo apt install nginx certbot python3-certbot-nginx -y

# 4. SSL sertifikat olish
echo -e "${YELLOW}4. SSL sertifikat olish...${NC}"
sudo systemctl stop nginx

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    sudo certbot certonly --standalone -d $DOMAIN
    echo -e "${GREEN}SSL sertifikat olindi${NC}"
else
    echo -e "${GREEN}SSL sertifikat allaqachon mavjud${NC}"
fi

# 5. SSL fayllarini nusxalash
echo -e "${YELLOW}5. SSL fayllarini nusxalash...${NC}"
mkdir -p ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
sudo chmod 644 ssl/*.pem

# 6. Environment variables
echo -e "${YELLOW}6. Environment variables sozlash...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${RED}DIQQAT: .env faylini tahrirlang!${NC}"
    echo -e "${YELLOW}nano .env${NC}"
else
    echo -e "${GREEN}.env fayl mavjud${NC}"
fi

# 7. Loyihani ishga tushirish
echo -e "${YELLOW}7. Loyihani ishga tushirish...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

# 8. SSL avtomatik yangilash
echo -e "${YELLOW}8. SSL avtomatik yangilash sozlash...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -

# 9. Firewall
echo -e "${YELLOW}9. Firewall sozlash...${NC}"
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

echo -e "${GREEN}✅ Deployment tugallandi!${NC}"
echo -e "${GREEN}Saytingiz: https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Keyingi qadamlar:${NC}"
echo "1. .env faylini tahrirlang: nano .env"
echo "2. Loglarni ko'ring: docker compose -f docker-compose.prod.yml logs -f"
echo "3. Holatni tekshiring: docker compose -f docker-compose.prod.yml ps"