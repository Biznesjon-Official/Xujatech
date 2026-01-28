// Transliteratsiya test
const { latinToCyrillic } = require('./desktop/dist/assets/index-BNZAzKAl.js');

// Test cases
const testCases = [
  'Mahsulotlar',
  'Mijozlar', 
  'Kassirlar',
  'Filiallar',
  'Qarz daftari',
  'Sotish narxi',
  'Chegirma qo\'llash',
  'Shtrih-kod skanerlash',
  'Chek chop etish'
];

console.log('🔄 Transliteratsiya Test:');
console.log('========================');

testCases.forEach(text => {
  const cyrillic = latinToCyrillic(text);
  console.log(`${text} → ${cyrillic}`);
});

console.log('========================');
console.log('✅ Test tugallandi!');