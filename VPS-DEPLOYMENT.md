# VPS da SSL bilan Deployment Qo'llanmasi

## 1. VPS Tayyorlash

### Ubuntu/Debian VPS da:
```bash
# Sistemani yangilash
sudo apt update && sudo apt upgrade -y

# Docker o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose o'rnatish
sudo apt install docker-compose-plugin -y

# Git o'rnatish
sudo apt install git -y

# Nginx va Certbot o'rnatish
sudo apt install nginx certbot python3-certbot-nginx -y
```

## 2. Loyihani VPS ga Ko'chirish

```bash
# Loyihani clone qilish
git clone https://github.com/yourusername/xujatech.git
cd xujatech

# Yoki loyihani zip orqali yuklash
# scp -r ./xujatech user@your-vps-ip:/home/user/
```

## 3. Let's Encrypt SSL Sertifikat Olish

```bash
# Nginx to'xtatish (80 port bo'sh bo'lishi uchun)
sudo systemctl stop nginx

# SSL sertifikat olish
sudo certbot certonly --standalone -d xugtech.biznesjon.uz

# Sertifikatlarni loyiha papkasiga nusxalash
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/xugtech.biznesjon.uz/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/xugtech.biznesjon.uz/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
sudo chmod 644 ssl/*.pem
```

## 4. Production Docker Compose

```bash
# Production uchun docker-compose.prod.yml yaratish
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ./desktop
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
EOF
```

## 5. Environment Variables

```bash
# .env fayl yaratish
cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/xujatech
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
EOF
```

## 6. Loyihani Ishga Tushirish

```bash
# Docker images yaratish va ishga tushirish
docker compose -f docker-compose.prod.yml up -d --build

# Loglarni ko'rish
docker compose -f docker-compose.prod.yml logs -f
```

## 7. Nginx Reverse Proxy (Ixtiyoriy)

Agar alohida Nginx ishlatmoqchi bo'lsangiz:

```bash
# Nginx konfiguratsiyasi
sudo tee /etc/nginx/sites-available/xujatech << 'EOF'
server {
    listen 80;
    server_name xugtech.biznesjon.uz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name xugtech.biznesjon.uz;

    ssl_certificate /etc/letsencrypt/live/xugtech.biznesjon.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xugtech.biznesjon.uz/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Saytni yoqish
sudo ln -s /etc/nginx/sites-available/xujatech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL Avtomatik Yangilash

```bash
# Crontab ga qo'shish
sudo crontab -e

# Quyidagi qatorni qo'shing:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## 9. Firewall Sozlash

```bash
# UFW firewall yoqish
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

## 10. Monitoring va Backup

```bash
# Docker konteynerlar holatini ko'rish
docker compose -f docker-compose.prod.yml ps

# Backup script yaratish
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose -f docker-compose.prod.yml exec backend mongodump --out /backup/db_$DATE
tar -czf backup_$DATE.tar.gz ssl/ .env docker-compose.prod.yml
EOF

chmod +x backup.sh
```

## Qo'shimcha Maslahatlar

1. **Domain DNS sozlamalari:** A record orqali domeningizni VPS IP ga yo'naltiring
2. **MongoDB:** Alohida MongoDB konteyner yoki MongoDB Atlas ishlatishingiz mumkin
3. **CDN:** Cloudflare yoki boshqa CDN ishlatib sayt tezligini oshiring
4. **Monitoring:** Uptime monitoring servislari qo'shing

## Xavfsizlik

- SSH key authentication ishlatng
- Root user bilan ishlamang
- Fail2ban o'rnating
- Muntazam backup oling
- Log fayllarini monitoring qiling