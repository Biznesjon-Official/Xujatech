# Security Policy

## 🔒 Xavfsizlik Siyosati

### Qo'llab-quvvatlanadigan Versiyalar

| Version | Qo'llab-quvvatlanadi |
| ------- | ------------------ |
| 1.0.x   | ✅                 |

## 🚨 Xavfsizlik Zaifliklarini Xabar Qilish

Agar siz tizimda xavfsizlik zaifligini topsangiz, iltimos quyidagi yo'l bilan xabar bering:

1. **Email**: security@xujatech.uz
2. **Telegram**: @xujatech_security

⚠️ **Muhim**: Xavfsizlik muammolarini public issue sifatida yaratmang!

## 🛡️ Xavfsizlik Choralari

### 1. Autentifikatsiya va Avtorizatsiya
- JWT token asosida autentifikatsiya
- Refresh token mexanizmi
- Role-based access control (RBAC)
- Session management

### 2. Parol Xavfsizligi
- Bcrypt bilan parol shifrlash (10 rounds)
- Minimal parol uzunligi: 6 belgi
- Parol o'zgartirish funksiyasi

### 3. API Xavfsizligi
- Rate limiting (60 so'rov/daqiqa)
- CORS sozlamalari
- Input validatsiya (Joi)
- SQL injection himoyasi
- XSS himoyasi

### 4. Ma'lumotlar Xavfsizligi
- HTTPS/SSL shifrlash
- Environment variables
- Sensitive ma'lumotlarni log qilmaslik
- Database connection pooling

### 5. File Upload Xavfsizligi
- File type validation
- File size limit (10MB)
- Secure file storage
- Malware scanning (kelajakda)

## 🔐 Production Xavfsizlik Sozlamalari

### Environment Variables
```env
# Kuchli JWT secrets (32+ belgi)
JWT_SECRET=your-very-strong-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-very-strong-refresh-secret-min-32-characters

# Kuchli database parol
MONGO_PASSWORD=your-secure-mongo-password

# HTTPS faqat
NODE_ENV=production
```

### Nginx Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### CORS Configuration
```typescript
cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
})
```

## 📋 Xavfsizlik Checklist

### Pre-Production
- [ ] Barcha default parollar o'zgartirilgan
- [ ] JWT secrets kuchli va unique
- [ ] Database parol xavfsiz
- [ ] HTTPS/SSL sozlangan
- [ ] CORS to'g'ri sozlangan
- [ ] Rate limiting yoqilgan
- [ ] Input validation ishlaydi
- [ ] Error messages sensitive ma'lumot bermaydi
- [ ] Logging to'g'ri sozlangan
- [ ] Backup strategiyasi mavjud

### Post-Production
- [ ] Security headers tekshirilgan
- [ ] SSL sertifikat valid
- [ ] Firewall sozlangan
- [ ] Monitoring sozlangan
- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Penetration testing (agar kerak bo'lsa)

## 🔄 Regular Updates

### Dependencies
```bash
# Backend dependencies
cd backend && npm audit
npm audit fix

# Frontend dependencies
cd desktop && npm audit
npm audit fix
```

### Security Patches
- Har oyda dependencies ni yangilang
- Critical security patches ni darhol qo'llang
- Changelog ni kuzatib boring

## 🚫 Qilmaslik Kerak

1. ❌ Sensitive ma'lumotlarni git ga commit qilmang
2. ❌ Default parollarni production da ishlatmang
3. ❌ API keys ni frontend kodda qoldirmang
4. ❌ Error messages da sensitive ma'lumot bermang
5. ❌ HTTP da production run qilmang (faqat HTTPS)
6. ❌ Root user bilan container run qilmang
7. ❌ Barcha portlarni ochiq qoldirmang

## 📞 Contact

Xavfsizlik bo'yicha savollar uchun:
- Email: security@xujatech.uz
- Telegram: @xujatech_security

---

**Eslatma**: Xavfsizlik - bu bir martalik ish emas, doimiy jarayon!
