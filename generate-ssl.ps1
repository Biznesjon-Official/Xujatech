# SSL papkasini yaratish
New-Item -ItemType Directory -Force -Path "ssl"

# Self-signed SSL sertifikatini yaratish
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -KeyLength 2048 -KeyAlgorithm RSA -HashAlgorithm SHA256 -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(1)

# Sertifikatni PEM formatida eksport qilish
$certPath = "ssl\cert.pem"
$keyPath = "ssl\key.pem"

# Certificate export
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
$certPem = "-----BEGIN CERTIFICATE-----`n" + [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks) + "`n-----END CERTIFICATE-----"
$certPem | Out-File -FilePath $certPath -Encoding ASCII

# Private key export (bu Windows da murakkab, shuning uchun OpenSSL ishlatish tavsiya etiladi)
Write-Host "SSL sertifikatlar yaratildi:" -ForegroundColor Green
Write-Host "- ssl/cert.pem (sertifikat)" -ForegroundColor Yellow
Write-Host ""
Write-Host "DIQQAT: Private key yaratish uchun OpenSSL kerak." -ForegroundColor Red
Write-Host "OpenSSL o'rnatilgan bo'lsa, quyidagi buyruqni bajaring:" -ForegroundColor Yellow
Write-Host "openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -subj `"/C=UZ/ST=Tashkent/L=Tashkent/O=YourCompany/OU=IT/CN=localhost`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "Docker konteynerlarini qayta ishga tushiring:" -ForegroundColor Green
Write-Host "docker-compose down && docker-compose up -d" -ForegroundColor Cyan