# SSL Sertifikat O'rnatish Qo'llanmasi

## 1. SSL Sertifikatlarini Yaratish

### Linux/Mac uchun:
```bash
chmod +x generate-ssl.sh
./generate-ssl.sh
```

### Windows uchun:
```powershell
# PowerShell-ni administrator sifatida oching
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\generate-ssl.ps1
```

Yoki OpenSSL o'rnatilgan bo'lsa:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=YourCompany/OU=IT/CN=localhost"
```

## 2. Docker Konteynerlarini Qayta Ishga Tushirish

```bash
docker-compose down
docker-compose up -d
```

## 3. Saytga Kirish

- HTTP: http://localhost (avtomatik HTTPS ga yo'naltiriladi)
- HTTPS: https://localhost

## 4. Brauzer Ogohlantirishlari

Self-signed sertifikat ishlatganligi uchun brauzer xavfsizlik ogohlantirishini ko'rsatadi. Bu normal holat. "Advanced" > "Proceed to localhost" ni bosing.

## 5. Production uchun

Production muhitida Let's Encrypt yoki boshqa sertifikat provayderidan haqiqiy SSL sertifikat oling:

### Let's Encrypt bilan:
```bash
# Certbot o'rnatish
sudo apt install certbot

# Sertifikat olish
sudo certbot certonly --standalone -d yourdomain.com

# Sertifikatlarni nusxalash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
```

## 6. Sertifikat Yangilash

Self-signed sertifikatlar 1 yil amal qiladi. Yangilash uchun 1-bosqichni takrorlang.

## 7. Muammolarni Hal Qilish

### Port band bo'lsa:
```bash
# Qaysi jarayon 443 portni ishlatayotganini tekshirish
netstat -tulpn | grep :443
# yoki Windows da:
netstat -ano | findstr :443
```

### SSL fayllari topilmasa:
- `ssl/` papkasi mavjudligini tekshiring
- Fayl ruxsatlarini tekshiring: `chmod 644 ssl/*.pem`
- Docker volume to'g'ri ulanganligi tekshiring