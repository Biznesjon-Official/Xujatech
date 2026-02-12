# Production Deployment Checklist

## 📋 Pre-Deployment

### 1. Environment Variables
- [ ] `.env` fayllarini yarating (`.env.example` dan nusxa oling)
- [ ] `JWT_SECRET` va `JWT_REFRESH_SECRET` ni kuchli parollar bilan almashtiring (32+ belgi)
- [ ] `MONGO_PASSWORD` ni xavfsiz parol bilan almashtiring
- [ ] `ALLOWED_ORIGINS` ni o'z domeningiz bilan almashtiring
- [ ] `VITE_API_URL` ni production URL ga o'zgartiring
- [ ] Telegram bot tokenlarini sozlang (agar kerak bo'lsa)

### 2. Security
- [ ] Barcha default parollarni o'zgartiring
- [ ] Admin parolini o'zgartiring (standart: admin123)
- [ ] Database parolini kuchli qiling
- [ ] CORS sozlamalarini tekshiring
- [ ] Rate limiting sozlamalarini tekshiring

### 3. Database
- [ ] MongoDB o'rnatilgan yoki MongoDB Atlas sozlangan
- [ ] Database backup strategiyasi belgilangan
- [ ] Database connection string to'g'ri

### 4. Code Review
- [ ] Barcha console.log() larni olib tashlang yoki production uchun o'chiring
- [ ] Debug kodlarni olib tashlang
- [ ] Error handling to'g'ri ishlayotganini tekshiring
- [ ] API endpoints xavfsizligini tekshiring

## 🚀 Deployment

### VPS/Server Deploy

#### Option 1: Docker (Tavsiya etiladi)

```bash
# 1. Repository ni clone qiling
git clone https://github.com/your-username/xujatech-pos.git
cd xujatech-pos

# 2. Environment fayllarini sozlang
cp .env.example .env
nano .env  # Barcha qiymatlarni to'ldiring

# 3. SSL sertifikatlarini oling
sudo certbot certonly --standalone -d yourdomain.com

# 4. SSL fayllarini nusxalang
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem

# 5. Docker Compose bilan ishga tushiring
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Loglarni tekshiring
docker-compose -f docker-compose.prod.yml logs -f
```

#### Option 2: Avtomatik Script

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Cloud Platforms

#### Railway.app
1. GitHub repository ni ulang
2. Backend va Frontend uchun alohida service yarating
3. Environment variables qo'shing
4. Deploy qiling

#### Vercel (Frontend) + Railway (Backend)
1. Frontend ni Vercel ga deploy qiling
2. Backend ni Railway ga deploy qiling
3. Environment variables ni to'g'ri sozlang

## ✅ Post-Deployment

### 1. Testing
- [ ] Sayt ochilishini tekshiring
- [ ] Login ishlashini tekshiring
- [ ] API endpoints ishlashini tekshiring
- [ ] Database connection ishlashini tekshiring
- [ ] Socket.IO connection ishlashini tekshiring
- [ ] File upload ishlashini tekshiring
- [ ] Barcode scanner ishlashini tekshiring (agar mavjud bo'lsa)

### 2. Performance
- [ ] Page load time ni tekshiring
- [ ] API response time ni tekshiring
- [ ] Database query performance ni tekshiring
- [ ] Gzip compression yoqilganini tekshiring
- [ ] Static files caching ishlashini tekshiring

### 3. Security
- [ ] HTTPS ishlashini tekshiring
- [ ] SSL sertifikat to'g'ri o'rnatilganini tekshiring
- [ ] Security headers mavjudligini tekshiring
- [ ] CORS to'g'ri sozlanganini tekshiring
- [ ] Rate limiting ishlashini tekshiring

### 4. Monitoring
- [ ] Server monitoring sozlang (UptimeRobot, Pingdom)
- [ ] Error logging sozlang
- [ ] Database backup avtomatik sozlang
- [ ] SSL sertifikat avtomatik yangilanishini sozlang

### 5. Backup
- [ ] Database backup strategiyasini amalga oshiring
- [ ] Backup restore ni test qiling
- [ ] Backup schedule ni sozlang (kunlik/haftalik)

## 🔧 Maintenance

### Daily
- [ ] Server health check
- [ ] Error logs tekshirish
- [ ] Disk space tekshirish

### Weekly
- [ ] Database backup tekshirish
- [ ] Performance metrics ko'rib chiqish
- [ ] Security updates tekshirish

### Monthly
- [ ] Full system backup
- [ ] Security audit
- [ ] Performance optimization
- [ ] Dependencies update

## 🆘 Troubleshooting

### Container ishlamayotgan bo'lsa:
```bash
# Loglarni ko'ring
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Container holatini tekshiring
docker-compose -f docker-compose.prod.yml ps

# Container ni restart qiling
docker-compose -f docker-compose.prod.yml restart backend
```

### Database connection xatosi:
- MongoDB ishlab turganini tekshiring
- Connection string to'g'riligini tekshiring
- Network access sozlamalarini tekshiring (MongoDB Atlas)

### SSL xatosi:
- SSL sertifikat fayllarini tekshiring
- Nginx configuration ni tekshiring
- Domain DNS sozlamalarini tekshiring

## 📞 Support

Yordam kerak bo'lsa:
- Email: support@xujatech.uz
- Telegram: @xujatech_support

---

**Eslatma**: Bu checklist ni har safar deploy qilishda ishlating!
