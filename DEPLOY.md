# XUJATECh POS - Deploy Qo'llanmasi

## 🚀 Deploy Variantlari

### 1. VPS/Server (Tavsiya etiladi) - Docker bilan

Bu eng oson va ishonchli usul. Barcha kerakli narsalar avtomatik o'rnatiladi.

#### Tez Deploy (Avtomatik Script)

```bash
# 1. Repository ni clone qiling
git clone https://github.com/your-username/xujatech-pos.git
cd xujatech-pos

# 2. Deploy scriptni ishga tushiring
chmod +x deploy-vps.sh
./deploy-vps.sh
```

Script quyidagilarni avtomatik bajaradi:
- Docker o'rnatish
- SSL sertifikat olish (Let's Encrypt)
- Environment variables sozlash
- MongoDB sozlash
- Loyihani build va ishga tushirish
- Firewall sozlash
- SSL avtomatik yangilanish

#### Manual Deploy

Agar qo'lda deploy qilmoqchi bo'lsangiz:

```bash
# 1. Sistemni yangilash
sudo apt update && sudo apt upgrade -y

# 2. Docker o'rnatish
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y

# 3. Repository ni clone qilish
git clone https://github.com/your-username/xujatech-pos.git
cd xujatech-pos

# 4. Environment fayllarini sozlash
cp .env.example .env
nano .env  # Barcha qiymatlarni to'ldiring

cp backend/.env.example backend/.env
nano backend/.env

cp desktop/.env.example desktop/.env
nano desktop/.env

# 5. SSL sertifikat olish
sudo apt install certbot -y
sudo certbot certonly --standalone -d yourdomain.com --email your@email.com

# 6. SSL fayllarini nusxalash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem

# 7. Docker Compose bilan ishga tushirish
docker compose -f docker-compose.prod.yml up -d --build

# 8. Loglarni tekshirish
docker compose -f docker-compose.prod.yml logs -f
```

---

### 2. Railway.app (Oson Cloud Deploy)

Railway.app - bu oson va tez deploy qilish uchun platform.

#### Backend Deploy

1. [Railway.app](https://railway.app) ga kiring
2. "New Project" → "Deploy from GitHub repo"
3. Repository ni tanlang
4. Service sozlamalari:
   - **Name**: xujatech-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. Environment Variables qo'shing:
   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   JWT_REFRESH_SECRET=your-refresh-secret
   ALLOWED_ORIGINS=https://your-frontend-url.com
   ```

6. MongoDB qo'shing:
   - "New" → "Database" → "Add MongoDB"
   - Connection string ni backend environment ga qo'shing

#### Frontend Deploy

1. Yangi service yarating
2. Service sozlamalari:
   - **Name**: xujatech-frontend
   - **Root Directory**: `desktop`
   - **Build Command**: `npm install && npm run build`

3. Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

4. Static site sifatida deploy qiling

---

### 3. Vercel (Frontend) + Railway (Backend)

Bu kombinatsiya ham yaxshi ishlaydi.

#### Backend - Railway
Yuqoridagi Railway backend deploy qo'llanmasiga qarang.

#### Frontend - Vercel

1. [Vercel](https://vercel.com) ga kiring
2. "New Project" → GitHub repository ni ulang
3. Project sozlamalari:
   - **Framework Preset**: Vite
   - **Root Directory**: `desktop`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

5. Deploy qiling

---

### 4. DigitalOcean / Linode / Vultr

VPS provider'lardan birini tanlang va yuqoridagi VPS deploy qo'llanmasiga amal qiling.

**Tavsiya etilgan konfiguratsiya:**
- CPU: 2 cores
- RAM: 2GB minimum (4GB tavsiya etiladi)
- Storage: 20GB SSD
- OS: Ubuntu 22.04 LTS

---

## 📋 Deploy Checklist

Deploy qilishdan oldin tekshiring:

### Environment Variables
- [ ] `.env` fayllar yaratilgan
- [ ] JWT secrets kuchli (32+ belgi)
- [ ] MongoDB connection string to'g'ri
- [ ] Domain/URL lar to'g'ri
- [ ] Telegram bot sozlamalari (agar kerak bo'lsa)

### Security
- [ ] HTTPS/SSL sozlangan
- [ ] Firewall sozlangan
- [ ] Default parollar o'zgartirilgan
- [ ] CORS to'g'ri sozlangan

### Database
- [ ] MongoDB ishlab turibdi
- [ ] Backup strategiyasi belgilangan
- [ ] Indexes yaratilgan

---

## 🔧 Foydali Buyruqlar

### Docker Commands

```bash
# Barcha container'larni ko'rish
docker compose -f docker-compose.prod.yml ps

# Loglarni ko'rish
docker compose -f docker-compose.prod.yml logs -f

# Bitta service logini ko'rish
docker compose -f docker-compose.prod.yml logs -f backend

# Container'ni restart qilish
docker compose -f docker-compose.prod.yml restart backend

# Container'larni to'xtatish
docker compose -f docker-compose.prod.yml down

# Rebuild va restart
docker compose -f docker-compose.prod.yml up -d --build

# Container ichiga kirish
docker compose -f docker-compose.prod.yml exec backend sh
```

### Database Backup

```bash
# MongoDB backup
docker compose -f docker-compose.prod.yml exec mongodb mongodump \
  --username admin \
  --password your-password \
  --authenticationDatabase admin \
  --db xujatech \
  --out /data/backup

# Backup ni nusxalash
docker cp xujatech-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

### SSL Renewal

```bash
# SSL sertifikatni yangilash
sudo certbot renew

# SSL fayllarini yangilash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem

# Frontend container ni restart qilish
docker compose -f docker-compose.prod.yml restart frontend
```

---

## 🆘 Troubleshooting

### Container ishlamayotgan bo'lsa

```bash
# Holatni tekshirish
docker compose -f docker-compose.prod.yml ps

# Loglarni ko'rish
docker compose -f docker-compose.prod.yml logs backend

# Container ni restart qilish
docker compose -f docker-compose.prod.yml restart backend
```

### Database connection xatosi

1. MongoDB ishlab turganini tekshiring:
   ```bash
   docker compose -f docker-compose.prod.yml ps mongodb
   ```

2. Connection string ni tekshiring:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend env | grep MONGODB
   ```

3. MongoDB logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs mongodb
   ```

### Port band bo'lsa

```bash
# Portni ishlatayotgan process ni topish
sudo lsof -i :80
sudo lsof -i :443

# Process ni to'xtatish
sudo kill -9 <PID>
```

### Disk space tugasa

```bash
# Disk space ni tekshirish
df -h

# Docker cache ni tozalash
docker system prune -a

# Eski images ni o'chirish
docker image prune -a
```

---

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl https://yourdomain.com/api/health

# Frontend health
curl https://yourdomain.com/health
```

### Logs Monitoring

```bash
# Real-time logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Error logs
docker compose -f docker-compose.prod.yml logs | grep -i error
```

### Resource Usage

```bash
# Container resource usage
docker stats

# Disk usage
docker system df
```

---

## 🔄 Updates

Loyihani yangilash:

```bash
# 1. Yangi kodni olish
git pull origin main

# 2. Rebuild va restart
docker compose -f docker-compose.prod.yml up -d --build

# 3. Loglarni tekshirish
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📞 Yordam

Muammo bo'lsa:
- Email: support@xujatech.uz
- Telegram: @xujatech_support
- GitHub Issues: [Issues](https://github.com/your-username/xujatech-pos/issues)

---

## 📚 Qo'shimcha Resurslar

- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Muvaffaqiyatli deploy! 🚀**
