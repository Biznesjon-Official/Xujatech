#!/bin/bash

# SSL papkasini yaratish
mkdir -p ssl

# Self-signed SSL sertifikatini yaratish
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=YourCompany/OU=IT/CN=localhost"

echo "SSL sertifikatlar yaratildi:"
echo "- ssl/cert.pem (sertifikat)"
echo "- ssl/key.pem (private key)"
echo ""
echo "Docker konteynerlarini qayta ishga tushiring:"
echo "docker-compose down && docker-compose up -d"