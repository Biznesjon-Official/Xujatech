# 🧪 Socket.IO Real-Time Test - Qadamlar

## ✅ Tayyor!

Backend va Frontend ishga tushdi va Socket.IO ulanish tayyor!

## 📋 Test qilish qadamlari

### 1. Brauzerda sahifani yangilang
```
http://localhost:3001
```

**F12** ni bosing va **Console** tabini oching.

### 2. Konsolda quyidagilarni ko'rishingiz kerak:

```
🔌 Connecting to Socket.IO server: http://localhost:3006
✅ Socket connected: [socket-id]
```

Agar ko'rsangiz - **Socket.IO ishlayapti!** ✅

### 3. Ikkita brauzer tab oching

**Tab 1 (Laptop simulyatsiyasi):**
1. http://localhost:3001 ga kiring
2. Kassir sifatida login qiling
3. "Saqlangan cheklar" tugmasini bosing yoki POS sahifasida qoling

**Tab 2 (Telefon simulyatsiyasi):**
1. http://localhost:3001 ga kiring
2. Xuddi shu kassir sifatida login qiling
3. F12 > Device Toolbar (Ctrl+Shift+M) - mobil rejimga o'ting
4. Mahsulot qo'shing
5. "Yuborish" tugmasini bosing

### 4. Tab 1 ga qayting

**Natija:**
- ✅ Yangi chek avtomatik paydo bo'ladi
- ✅ Toast xabar: "Yangi chek saqlandi! 📥"
- ✅ Sahifani yangilash kerak emas!

## 🔍 Backend konsolida ko'rish kerak:

```
✅ Socket connected: [socket-id]
👤 Cashier [cashier-id] joined room
📤 Receipt saved notification sent to cashier-[cashier-id]
```

## 🔍 Frontend konsolida ko'rish kerak:

```
🔌 Connecting to Socket.IO server: http://localhost:3006
✅ Socket connected: [socket-id]
📥 Receipt saved event received: {...}
🔔 New receipt saved: {...}
```

## ❌ Muammolar va yechimlar

### Muammo 1: "Socket connection error"

**Yechim:**
1. Backend ishlab turganini tekshiring:
   ```
   http://localhost:3006/health
   ```
   Javob: `{"status":"ok"}`

2. Agar ishlamasa:
   ```bash
   cd backend
   npm run dev
   ```

### Muammo 2: "Offline" ko'rsatyapti

**Yechim:**
1. Sahifani to'liq yangilang: **Ctrl+Shift+R**
2. Brauzer cache'ni tozalang
3. Konsolda Socket ulanishini tekshiring

### Muammo 3: Yangilanish kelmayapti

**Yechim:**
1. Ikkala tabda ham **bir xil kassir** bilan kirganingizni tekshiring
2. Konsolda `✅ Socket connected` xabarini qidiring
3. Backend konsolida `📤 Receipt saved notification` xabarini qidiring

## 🎯 Muvaffaqiyat belgilari

✅ Backend: `✅ Socket.IO initialized`
✅ Backend: `👤 Cashier [id] joined room`
✅ Frontend: `✅ Socket connected`
✅ Telefondan yuborilganda laptop avtomatik yangilanadi
✅ Toast xabar ko'rsatiladi

## 📱 Haqiqiy telefondan test

1. **Laptop:** http://localhost:3001
2. **Telefon:** http://192.168.1.4:3001
3. Xuddi shu kassir bilan kiring
4. Telefondan mahsulot yuboring
5. Laptop avtomatik yangilanadi!

---

**Serverlar:**
- Backend: http://localhost:3006 ✅
- Frontend: http://localhost:3001 ✅
- Socket.IO: ws://localhost:3006 ✅
