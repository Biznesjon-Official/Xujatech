# SSL papkasini yaratish
New-Item -ItemType Directory -Force -Path "ssl"

# Sizning domeningiz uchun SSL sertifikatini yaratish
$command = @"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=XugTech/OU=IT/CN=xugtech.biznesjon.uz" \
    -addext "subjectAltName=DNS:xugtech.biznesjon.uz,DNS:*.biznesjon.uz,DNS:localhost"
"@

Write-Host "Quyidagi buyruqni bajaring (OpenSSL kerak):" -ForegroundColor Yellow
Write-Host $command -ForegroundColor Cyan
Write-Host ""
Write-Host "Yoki Git Bash da:" -ForegroundColor Green
Write-Host "./generate-ssl-domain.sh" -ForegroundColor Cyan