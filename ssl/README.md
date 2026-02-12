# SSL Certificates

Bu papka SSL sertifikat fayllarini saqlash uchun ishlatiladi.

## Production uchun

SSL sertifikatlarni Let's Encrypt dan oling:

```bash
sudo certbot certonly --standalone -d yourdomain.com
```

Keyin fayllarni bu papkaga nusxalang:

```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
sudo chmod 644 ssl/*.pem
```

## Development uchun

Development muhitida self-signed sertifikat yarating:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=XUJATECh/CN=localhost"
```

## Muhim

⚠️ **SSL sertifikat fayllarini git ga commit qilmang!**

`.gitignore` faylida quyidagi qatorlar mavjud:

```
ssl/*.pem
ssl/*.key
ssl/*.crt
```

Faqat bu README.md fayli git da saqlanadi.
