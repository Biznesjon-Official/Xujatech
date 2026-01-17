/**
 * PWA ikonkalarini yaratish uchun skript
 * 
 * Ishlatish:
 * 1. Node.js o'rnatilgan bo'lishi kerak
 * 2. sharp kutubxonasini o'rnating: npm install sharp
 * 3. Skriptni ishga tushiring: node scripts/generate-icons.js
 * 
 * Yoki qo'lda yarating:
 * - 512x512 piksel o'lchamda asosiy logoni yarating
 * - Quyidagi o'lchamlarda saqlang:
 *   - icon-16x16.png
 *   - icon-32x32.png
 *   - icon-72x72.png
 *   - icon-96x96.png
 *   - icon-128x128.png
 *   - icon-144x144.png
 *   - icon-152x152.png
 *   - icon-167x167.png
 *   - icon-180x180.png
 *   - icon-192x192.png
 *   - icon-384x384.png
 *   - icon-512x512.png
 */

const fs = require('fs');
const path = require('path');

// Ikonka o'lchamlari
const sizes = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// SVG shablon
const createSvgIcon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0891b2"/>
      <stop offset="100%" style="stop-color:#0e7490"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#grad)"/>
  <path d="M30 25h40a5 5 0 015 5v40a5 5 0 01-5 5H30a5 5 0 01-5-5V30a5 5 0 015-5z" fill="none" stroke="white" stroke-width="3"/>
  <path d="M35 40h30M35 50h30M35 60h15" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <circle cx="60" cy="60" r="5" fill="white"/>
</svg>
`;

// Papkani yaratish
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}


// SVG fayllarni yaratish (PNG o'rniga)
console.log('PWA ikonkalari yaratilmoqda...');

sizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`✓ ${filename} yaratildi`);
});

// Badge ikonka
const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <circle cx="36" cy="36" r="36" fill="#0891b2"/>
  <text x="36" y="45" text-anchor="middle" fill="white" font-size="24" font-weight="bold">POS</text>
</svg>
`;
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.svg'), badgeSvg);
console.log('✓ badge-72x72.svg yaratildi');

// Shortcut ikonkalari
const shortcuts = ['pos', 'products', 'reports'];
shortcuts.forEach(name => {
  const svg = createSvgIcon(96);
  fs.writeFileSync(path.join(iconsDir, `${name}-icon.svg`), svg);
  console.log(`✓ ${name}-icon.svg yaratildi`);
});

console.log('\n✅ Barcha ikonkalar yaratildi!');
console.log('\n📝 Eslatma: PNG formatida ikonkalar kerak bo\'lsa, sharp kutubxonasini o\'rnating:');
console.log('   npm install sharp');
console.log('   Keyin skriptni qayta ishga tushiring.');
