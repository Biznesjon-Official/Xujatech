# 🌐 Tunel URL'lar - Internetdan kirish

## 📱 Telefondan kirish uchun:

### Frontend (Ilova):
```
https://quiet-toys-kneel.loca.lt
```

### Backend API:
```
https://xujatech-api.loca.lt
```

## ⚠️ Muhim:

1. **Birinchi marta ochganda** localtunnel parol so'raydi
   - Sahifada ko'rsatilgan parolni kiriting
   - Yoki "Click to Continue" tugmasini bosing

2. **Serverlar ishlamoqda:**
   - Backend: ✅ Running on port 3006
   - Frontend: ✅ Running on port 3002
   - Tunnel 1: ✅ Frontend tunnel active
   - Tunnel 2: ✅ Backend tunnel active

3. **Tunel to'xtatish uchun:**
   - Terminaldagi jarayonlarni to'xtating (Ctrl+C)
   - Yoki `npm run dev` ni to'xtating

## 🔄 Qayta ishga tushirish:

Agar tunel URL'lar o'zgarsa, quyidagi buyruqlarni qayta ishga tushiring:

```bash
# Frontend tunnel
lt --port 3002

# Backend tunnel  
lt --port 3006 --subdomain xujatech-api
```

## 📝 Eslatma:

- Localtunnel bepul va registratsiya talab qilmaydi
- URL'lar har safar o'zgarishi mumkin (subdomain bo'lmasa)
- Backend uchun `xujatech-api` subdomain'i band bo'lsa, boshqa nom ishlatiladi
