# 🔄 Kesh Muammosini Hal Qilish

## ✅ Amalga oshirilgan o'zgarishlar

### 1. Vite konfiguratsiyasi
- `vite.config.ts` da keshni o'chirish headerlari qo'shildi
- `optimizeDeps.force: true` qo'shildi
- HMR (Hot Module Replacement) yaxshilandi

### 2. HTML fayllari
- `index.html` va `public/index.html` ga no-cache meta taglari qo'shildi
- Brauzer keshini o'chiruvchi headerlar qo'shildi

### 3. Package.json
- `npm run dev` endi `vite --force` bilan ishga tushadi
- `npm run clean` scripti qo'shildi (keshni tozalash uchun)

### 4. Service Worker
- Development rejimida avtomatik o'chiriladi
- Production rejimida faqat kerak bo'lganda ishlaydi

## 🚀 Qanday ishlatish

### Serverni ishga tushirish
```bash
cd desktop
npm run dev
```

### Agar yangilanish ko'rinmasa
```bash
# 1. Keshni tozalash
npm run clean

# 2. Serverni qayta ishga tushirish
npm run dev
```

### Brauzerda
1. **Ctrl + Shift + R** (hard refresh)
2. Yoki **F12** > **Application** > **Clear storage** > **Clear site data**

## 📝 Eslatma

Endi kod o'zgarganda:
- ✅ Avtomatik yangilanadi (HMR)
- ✅ Kesh muammosi bo'lmaydi
- ✅ Service Worker development da ishlamaydi
- ✅ Har safar yangi kod yuklanadi

## 🔧 Agar hali ham muammo bo'lsa

```bash
# 1. Node modules ni o'chirish
rm -rf node_modules

# 2. Package-lock ni o'chirish
rm package-lock.json

# 3. Qayta o'rnatish
npm install

# 4. Serverni ishga tushirish
npm run dev
```

## ⚠️ Muhim

Development rejimida:
- Service Worker **O'CHIRILGAN**
- Kesh **O'CHIRILGAN**
- HMR **YOQILGAN**

Production rejimida:
- Service Worker **YOQILGAN**
- Kesh **YOQILGAN**
- Offline rejim **ISHLAYDI**
