# XUJATECh POS - Deploy Qo'llanmasi

## 🚀 Deploy Variantlari

### 1. VPS/Server (Tavsiya etiladi)

#### Backend Deploy (Node.js)

```bash
# 1. Serverni sozlash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm nginx -y

# 2. PM2 o'rnatish
npm install -g pm2

# 3. Loyihani clone qilish
git clone https://github.com/your-repo/xujatech-pos.git
cd xujatech-pos

# 4. Backend sozlash
cd backend
npm install
cp .env.production .env
# .env faylini to'g'ri sozlang!
npm run build

# 5. PM2 bilan ishga tushirish
pm2 start dist/server.js --name "xujatech-api"
pm2 save
pm2 startup
```

#### Frontend Deploy

```bash
# 1. Frontend build
cd desktop
npm install
cp .env.production .env
npm run build

# 2. Nginx sozlash
sudo nano /etc/nginx/sites-available/xujatech
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/xujatech/desktop/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 3. Nginx enable
sudo ln -s /etc/nginx/sites-available/xujatech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Railway.app (Oson variant)

1. [Railway.app](https://railway.app) ga kiring
2. GitHub repo ni ulang
3. Backend uchun yangi service yarating:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Environment variables qo'shing
5. Frontend uchun alohida service yarating

### 3. Vercel + Railway

- **Frontend**: Vercel (bepul)
- **Backend**: Railway

### 4. Docker (Kengaytirilgan)

```bash
# Docker Compose bilan
docker-compose up -d
```

---

## 📋 Deploy Checklist

### Backend
- [ ] MongoDB Atlas cluster yaratildi
- [ ] .env.production sozlandi
- [ ] JWT_SECRET kuchli (32+ belgi)
- [ ] ALLOWED_ORIGINS to'g'ri
- [ ] SSL/HTTPS sozlandi

### Frontend
- [ ] VITE_API_URL production URL ga o'zgartirildi
- [ ] Build muvaffaqiyatli (`npm run build`)
- [ ] Static fayllar serverga yuklandi

### Umumiy
- [ ] Domain DNS sozlandi
- [ ] SSL sertifikat (Let's Encrypt)
- [ ] Backup sozlandi
- [ ] Monitoring (PM2, UptimeRobot)

---

## 🔧 Muhim Sozlamalar

### MongoDB Atlas
1. [MongoDB Atlas](https://cloud.mongodb.com) ga kiring
2. Yangi cluster yarating (M0 - bepul)
3. Database user yarating
4. Network Access: `0.0.0.0/0` (yoki server IP)
5. Connection string ni .env ga qo'shing

### SSL Sertifikat (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📞 Yordam

Muammo bo'lsa: support@xujatech.uz
