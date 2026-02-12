#!/bin/bash

# Nginx va SSL tekshirish skripti
# Ishlatish: bash check-nginx.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 NGINX VA SSL TEKSHIRISH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Nginx versiyasi
echo "📦 Nginx versiyasi:"
nginx -v 2>&1
echo ""

# 2. Nginx holati
echo "🔄 Nginx holati:"
sudo systemctl status nginx --no-pager | head -n 10
echo ""

# 3. Nginx konfiguratsiya tekshiruvi
echo "✅ Nginx konfiguratsiya tekshiruvi:"
sudo nginx -t
echo ""

# 4. Faol konfiguratsiya fayllar
echo "📁 Faol konfiguratsiya fayllar:"
ls -lh /etc/nginx/sites-enabled/
echo ""

# 5. Mavjud konfiguratsiya fayllar
echo "📂 Mavjud konfiguratsiya fayllar:"
ls -lh /etc/nginx/sites-available/
echo ""

# 6. Portlarni tekshirish
echo "🔌 Ochiq portlar (80, 443):"
sudo netstat -tulpn | grep -E ':80|:443'
echo ""

# 7. SSL sertifikatlar
echo "🔐 SSL sertifikatlar:"
if command -v certbot &> /dev/null; then
    sudo certbot certificates 2>/dev/null || echo "Hech qanday sertifikat topilmadi"
else
    echo "⚠️  Certbot o'rnatilmagan"
fi
echo ""

# 8. Firewall holati
echo "🛡️  Firewall holati:"
if command -v ufw &> /dev/null; then
    sudo ufw status | grep -E 'Status|80|443|Nginx'
else
    echo "⚠️  UFW o'rnatilmagan"
fi
echo ""

# 9. Nginx processlar
echo "⚙️  Nginx processlar:"
ps aux | grep nginx | grep -v grep
echo ""

# 10. Oxirgi error loglar
echo "❌ Oxirgi 10 ta error log:"
if [ -f /var/log/nginx/error.log ]; then
    sudo tail -n 10 /var/log/nginx/error.log
else
    echo "Error log topilmadi"
fi
echo ""

# 11. Backend tekshiruvi
echo "🔧 Backend holati (port 3008):"
if netstat -tulpn 2>/dev/null | grep -q ':3008'; then
    echo "✅ Backend 3008 portda ishlamoqda"
    curl -s http://localhost:3008/api/health | head -n 5 || echo "Health check javob bermadi"
else
    echo "❌ Backend 3008 portda ishlamayapti"
fi
echo ""

# 12. Disk joy
echo "💾 Disk joy (/var/log/nginx):"
du -sh /var/log/nginx/ 2>/dev/null || echo "Log papka topilmadi"
echo ""

# 13. Konfiguratsiya faylini ko'rsatish
echo "📄 Asosiy konfiguratsiya fayli:"
if [ -f /etc/nginx/sites-enabled/ozodamebel ]; then
    echo "Fayl: /etc/nginx/sites-enabled/ozodamebel"
    echo "---"
    sudo cat /etc/nginx/sites-enabled/ozodamebel | head -n 30
    echo "..."
elif [ -f /etc/nginx/sites-enabled/default ]; then
    echo "Fayl: /etc/nginx/sites-enabled/default"
    echo "---"
    sudo cat /etc/nginx/sites-enabled/default | head -n 30
    echo "..."
else
    echo "⚠️  Konfiguratsiya fayli topilmadi"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TEKSHIRISH YAKUNLANDI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
