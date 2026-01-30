# Socket.IO Real-Time Test Qo'llanmasi

## ✅ O'rnatildi

Socket.IO real-time funksiyasi muvaffaqiyatli o'rnatildi!

## 🎯 Qanday ishlaydi?

1. **Telefon (Mobile)** - mahsulot yig'ib "Yuborish" tugmasini bosadi
2. **Server** - chekni qabul qilib, MongoDB ga saqlaydi
3. **Socket.IO** - barcha ulangan qurilmalarga xabar yuboradi
4. **Laptop (Desktop)** - **AVTOMATIK** yangilanadi, sahifani yangilash shart emas!

## 🧪 Test qilish

### 1-qadam: Ikkita brauzer oching

**Laptop (Desktop):**
- Chrome: http://localhost:3001
- Kassir sifatida kiring

**Telefon (Mobile):**
- Safari/Chrome: http://192.168.1.4:3001 (yoki telefoningizning IP manzili)
- Xuddi shu kassir sifatida kiring

### 2-qadam: Telefondan mahsulot yig'ing

1. Telefondan mobil kassa rejimiga o'ting
2. Mahsulot qo'shing (skaner yoki qidiruv orqali)
3. "Yuborish" tugmasini bosing

### 3-qadam: Laptopda kuzating

Laptop ekranida:
- **Avtomatik** yangi chek paydo bo'ladi
- **Toast xabar** ko'rinadi: "Yangi chek saqlandi! 📥"
- **Saqlangan cheklar soni** yangilanadi

## 🔍 Konsolda tekshirish

### Backend (Terminal)
```
✅ Socket connected: abc123
👤 Cashier 67890 joined room
📤 Receipt saved notification sent to cashier-67890
```

### Frontend (Browser Console - F12)
```
✅ Socket connected: abc123
📥 Receipt saved event received: {...}
🔔 New receipt saved: {...}
```

## 📱 Real-time hodisalar

### 1. Chek saqlanganda
- **Event:** `receipt-saved`
- **Natija:** Yangi chek ro'yxatga qo'shiladi
- **Toast:** "Yangi chek saqlandi! 📥"

### 2. Chek o'chirilganda
- **Event:** `receipt-deleted`
- **Natija:** Chek ro'yxatdan o'chiriladi

### 3. Chek ochilganda
- **Event:** `receipt-opened`
- **Natija:** Chek boshqa qurilmalarda yangilanadi

## 🛠️ Muammolarni hal qilish

### Socket ulanmayapti?

1. **Backend ishlab turibmi?**
   ```
   http://localhost:3006/health
   ```
   Javob: `{"status":"ok"}`

2. **Console'da xato bormi?**
   - F12 ni bosing
   - Console tabiga o'ting
   - Socket xatolarini qidiring

3. **Firewall bloklayaptimi?**
   - Windows Firewall'da 3006 portni oching

### Yangilanish kelmayapti?

1. **Xuddi shu kassir ID bilan kirilganmi?**
   - Telefon va laptop bir xil kassir bo'lishi kerak

2. **Socket ulanganmi?**
   - Console'da `✅ Socket connected` xabarini qidiring

3. **Internet bormi?**
   - Offline rejimda Socket.IO ishlamaydi

## 🎉 Muvaffaqiyatli test

Agar quyidagilar ishlasa, hammasi to'g'ri:

✅ Telefondan mahsulot yuborildi
✅ Laptopda avtomatik paydo bo'ldi
✅ Toast xabar ko'rsatildi
✅ Sahifani yangilash kerak bo'lmadi

## 📊 Texnik ma'lumotlar

- **Backend:** Socket.IO Server (Port 3006)
- **Frontend:** Socket.IO Client
- **Transport:** WebSocket (fallback: polling)
- **Reconnection:** Avtomatik (5 marta)
- **Room:** `cashier-{cashierId}`

## 🔐 Xavfsizlik

- Har bir kassir o'z xonasida ishlaydi
- Boshqa kassirlarning cheklari ko'rinmaydi
- JWT token bilan autentifikatsiya

## 📝 Keyingi qadamlar

- ✅ Real-time chek saqlash
- ✅ Real-time chek o'chirish
- 🔄 Real-time mahsulot yangilanishi (keyingi versiya)
- 🔄 Real-time savdo statistikasi (keyingi versiya)

---

**Muallif:** Kiro AI Assistant
**Sana:** 2026-01-30
**Versiya:** 1.0.0
