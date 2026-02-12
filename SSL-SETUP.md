# SSL va Nginx Sozlash Qo'llanmasi

## 1. Certbot o'rnatish (Let's Encrypt uchun)

```bash
# Certbot va Nginx plaginini o'rnatish
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

## 2. Nginx konfiguratsiyasini tekshirish

```bash
# Nginx o'rnatilganligini tekshirish
nginx -v

# Nginx ishlab turganini tekshirish
sudo systemctl status nginx

# Nginx konfiguratsiya faylini topish
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Konfiguratsiyani ko'rish
sudo cat /etc/nginx/sites-available/default
# yoki
sudo cat /etc/nginx/nginx.conf
```

## 3. Nginx konfiguratsiyasini sozlash

Avval domeningiz uchun yangi konfiguratsiya yarating:

```bash
# Yangi konfiguratsiya yaratish
sudo nano /etc/nginx/sites-available/ozodamebel
```

Quyidagi konfiguratsiyani kiriting (domeningizni o'zgartiring):

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name your-domain.com www.your-domain.com;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout sozlamalari
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend (agar bitta serverdagi bo'lsa)
    location / {
        root /var/www/ozodamebel/desktop/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache sozlamalari
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

Konfiguratsiyani faollashtirish:

```bash
# Symlink yaratish
sudo ln -s /etc/nginx/sites-available/ozodamebel /etc/nginx/sites-enabled/

# Default konfiguratsiyani o'chirish (agar kerak bo'lsa)
sudo rm /etc/nginx/sites-enabled/default

# Konfiguratsiyani tekshirish
sudo nginx -t

# Nginx ni qayta yuklash
sudo systemctl reload nginx
```

## 4. SSL sertifikat olish

```bash
# Certbot yordamida SSL sertifikat olish
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Yoki faqat bitta domen uchun
sudo certbot --nginx -d your-domain.com
```

Certbot sizdan quyidagilarni so'raydi:
1. Email manzilingiz (eslatmalar uchun)
2. Shartlarga rozilik
3. HTTP dan HTTPS ga avtomatik yo'naltirish (2 ni tanlang - Ha)

## 5. SSL konfiguratsiyasini tekshirish

Certbot avtomatik ravishda Nginx konfiguratsiyangizni yangilaydi. Natijani ko'rish:

```bash
sudo cat /etc/nginx/sites-available/ozodamebel
```

Yangi konfiguratsiya quyidagicha ko'rinadi:

```nginx
server {
    server_name your-domain.com www.your-domain.com;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /socket.io {
        proxy_pass http://localhost:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    location / {
        root /var/www/ozodamebel/desktop/dist;
        try_files $uri $uri/ /index.html;
    }

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.your-domain.com) {
        return 301 https://$host$request_uri;
    }

    if ($host = your-domain.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 404;
}
```

## 6. Foydali Nginx buyruqlari

```bash
# Nginx ni ishga tushirish
sudo systemctl start nginx

# Nginx ni to'xtatish
sudo systemctl stop nginx

# Nginx ni qayta ishga tushirish
sudo systemctl restart nginx

# Nginx ni qayta yuklash (downtime siz)
sudo systemctl reload nginx

# Nginx holatini tekshirish
sudo systemctl status nginx

# Nginx konfiguratsiyasini tekshirish
sudo nginx -t

# Nginx error loglarini ko'rish
sudo tail -f /var/nginx/error.log

# Nginx access loglarini ko'rish
sudo tail -f /var/log/nginx/access.log
```

## 7. SSL sertifikatni avtomatik yangilash

Certbot avtomatik yangilanish uchun cron job yaratadi. Tekshirish:

```bash
# Yangilanish testini o'tkazish (haqiqiy yangilamaydi)
sudo certbot renew --dry-run

# Certbot timer holatini tekshirish
sudo systemctl status certbot.timer

# Barcha sertifikatlarni ko'rish
sudo certbot certificates
```

## 8. Firewall sozlamalari

```bash
# UFW firewall holatini tekshirish
sudo ufw status

# HTTPS portini ochish
sudo ufw allow 'Nginx Full'

# Yoki qo'lda
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

# Firewall ni qayta yuklash
sudo ufw reload
```

## 9. Muammolarni hal qilish

### Nginx ishlamayotgan bo'lsa:

```bash
# Xatoliklarni ko'rish
sudo journalctl -u nginx -n 50

# Port band bo'lganini tekshirish
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Nginx processlarini ko'rish
ps aux | grep nginx
```

### SSL sertifikat muammolari:

```bash
# Sertifikat muddatini tekshirish
sudo certbot certificates

# Sertifikatni majburiy yangilash
sudo certbot renew --force-renewal

# Sertifikatni o'chirish
sudo certbot delete --cert-name your-domain.com
```

### Konfiguratsiya xatolari:

```bash
# Sintaksis xatolarini topish
sudo nginx -t

# Konfiguratsiyani test rejimida ishga tushirish
sudo nginx -T
```

## 10. Xavfsizlik sozlamalari (qo'shimcha)

Nginx konfiguratsiyangizga qo'shing:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;

# SSL sozlamalari
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

## 11. Tekshirish

```bash
# SSL sertifikatni online tekshirish
# Browser'da oching: https://www.ssllabs.com/ssltest/

# Yoki curl bilan:
curl -I https://your-domain.com

# Backend API ni tekshirish
curl https://your-domain.com/api/health
```

## 12. PM2 bilan integratsiya

Backend'ingiz PM2 bilan ishlayotganligini ta'minlang:

```bash
# PM2 holatini tekshirish
pm2 status

# PM2 loglarini ko'rish
pm2 logs ozoda-mebel-backend

# PM2 ni qayta ishga tushirish
pm2 restart ozoda-mebel-backend

# PM2 ni avtomatik ishga tushirish
pm2 startup
pm2 save
```

## Qisqacha qadamlar:

1. `sudo apt install certbot python3-certbot-nginx -y`
2. Nginx konfiguratsiyasini yarating
3. `sudo nginx -t` - konfiguratsiyani tekshiring
4. `sudo systemctl reload nginx`
5. `sudo certbot --nginx -d your-domain.com`
6. `sudo ufw allow 'Nginx Full'`
7. Brauzerda `https://your-domain.com` ni oching

Muvaffaqiyat! 🎉
