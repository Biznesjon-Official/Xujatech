# 🔥 Socket.IO Real-Time Yangilanish - Qo'llanma

## ✅ Nima qilindi?

Telefondan mahsulot yig'ib yuborilganda, laptop **avtomatik** yangilanadi - sahifani yangilash kerak emas!

## 🎯 Qanday ishlaydi?

```
📱 Telefon                  🌐 Server                   💻 Laptop
   │                           │                           │
   │  1. Mahsulot yuborish     │                           │
   ├──────────────────────────>│                           │
   │                           │                           │
   │                           │  2. MongoDB ga saqlash    │
   │                           │  ✅ Saqlandi              │
   │                           │                           │
   │                           │  3. Socket.IO xabar       │
   │                           ├──────────────────────────>│
   │                           │                           │
   │                           │                           │  4. Avtomatik yangilanish
   │                           │                           │  📥 Yangi chek paydo bo'ldi!
```

## 🚀 Ishga tushirish

### 1. Backend (Terminal 1)
```bash
cd backend
npm run dev
```

Natija:
```
✅ Socket.IO initialized
🔌 Socket.IO ready for connections
🚀 Server running on http://localhost:3006
```

### 2. Frontend (Terminal 2)
```bash
cd desktop
npm run dev
```

Natija:
```
➜  Local:   http://localhost:3001/
➜  Network: http://192.168.1.4:3001/
```

## 🧪 Test qilish

### Variant 1: Ikkita brauzer tab

1. **Tab 1 (Laptop):** http://localhost:3001
   - Kassir sifatida kiring
   - "Saqlangan cheklar" sahifasini oching

2. **Tab 2 (Telefon simulyatsiyasi):** http://localhost:3001
   - Xuddi shu kassir sifatida kiring
   - Mobil rejimga o'ting (F12 > Device Toolbar)
   - Mahsulot qo'shing va "Yuborish" ni bosing

3. **Tab 1 ga qayting:**
   - ✅ Yangi chek avtomatik paydo bo'ladi
   - ✅ Toast xabar: "Yangi chek saqlandi! 📥"

### Variant 2: Haqiqiy telefon

1. **Laptop:** http://localhost:3001
   - Kassir sifatida kiring

2. **Telefon:** http://192.168.1.4:3001
   - Xuddi shu kassir sifatida kiring
   - Mahsulot yig'ing va yuboring

3. **Laptop avtomatik yangilanadi!**

## 🔍 Konsolda tekshirish

### Backend konsoli
```
✅ Socket connected: xyz789
👤 Cashier 12345 joined room
📤 Receipt saved notification sent to cashier-12345
```

### Frontend konsoli (F12)
```
🔌 Connecting to Socket.IO for cashier: 12345
✅ Socket connected: xyz789
📥 Receipt saved event received: {...}
🔔 New receipt saved: {...}
```

## 📋 Real-time hodisalar

| Hodisa | Event nomi | Natija |
|--------|-----------|--------|
| Chek saqlandi | `receipt-saved` | Yangi chek ro'yxatga qo'shiladi |
| Chek o'chirildi | `receipt-deleted` | Chek ro'yxatdan o'chadi |
| Chek ochildi | `receipt-opened` | Chek boshqa qurilmalarda yangilanadi |

## 🛠️ Muammolarni hal qilish

### ❌ Socket ulanmayapti

**Sabab 1:** Backend ishlamayapti
```bash
# Tekshirish
curl http://localhost:3006/health

# Natija bo'lishi kerak:
{"status":"ok"}
```

**Sabab 2:** Port noto'g'ri
- Backend: `PORT=3006` (backend/.env)
- Frontend: `VITE_API_URL=http://localhost:3006` (desktop/.env)

**Sabab 3:** Firewall bloklayapti
- Windows Firewall'da 3006 portni oching

### ❌ Yangilanish kelmayapti

**Sabab 1:** Turli kassirlar
- Telefon va laptop **bir xil kassir** bo'lishi kerak

**Sabab 2:** Socket ulanmagan
- Console'da `✅ Socket connected` xabarini qidiring

**Sabab 3:** Offline rejim
- Socket.IO faqat online rejimda ishlaydi

## 📊 Texnik tafsilotlar

### Backend
- **Paket:** socket.io
- **Port:** 3006
- **Transport:** WebSocket + Polling
- **Fayl:** `backend/src/services/socket.service.ts`

### Frontend
- **Paket:** socket.io-client
- **Ulanish:** Avtomatik (kassir ID bo'yicha)
- **Reconnection:** 5 marta
- **Fayl:** `desktop/src/services/SocketService.ts`

### Xonalar (Rooms)
- Har bir kassir o'z xonasida: `cashier-{cashierId}`
- Boshqa kassirlarning cheklari ko'rinmaydi

## 🎉 Muvaffaqiyat belgilari

✅ Backend konsolida: `✅ Socket.IO initialized`
✅ Frontend konsolida: `✅ Socket connected`
✅ Telefondan yuborilganda laptop avtomatik yangilanadi
✅ Toast xabar ko'rsatiladi
✅ Sahifani yangilash kerak emas

## 📝 Keyingi bosqichlar

- ✅ Real-time chek saqlash
- ✅ Real-time chek o'chirish
- 🔄 Real-time mahsulot yangilanishi
- 🔄 Real-time savdo statistikasi
- 🔄 Real-time qarz yangilanishi

## 🔐 Xavfsizlik

- JWT token bilan autentifikatsiya
- Har bir kassir faqat o'z chekalarini ko'radi
- CORS himoyasi
- WebSocket secure (wss://) production uchun

---

**Yaratildi:** 2026-01-30
**Versiya:** 1.0.0
**Muallif:** Kiro AI Assistant
