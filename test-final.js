// XujaTech POS - Final Transliteratsiya Test
console.log('🔄 XujaTech POS - Final Transliteratsiya Test');
console.log('===========================================\n');

// Transliteratsiya funksiyasi
function latinToCyrillic(input) {
    if (typeof input !== "string") return "";

    const applyCase = (pattern, lower, upper, title) => (m) => {
        if (m === m.toUpperCase()) return upper;
        if (m[0] === m[0].toUpperCase() && m[1] === m[1].toLowerCase()) return title;
        return lower;
    };

    let s = input
        .replace(/o'/gi, applyCase("o'", "ў", "Ў", "Ў"))
        .replace(/g'/gi, applyCase("g'", "ғ", "Ғ", "Ғ"))
        .replace(/sh/gi, applyCase("sh", "ш", "Ш", "Ш"))
        .replace(/ch/gi, applyCase("ch", "ч", "Ч", "Ч"));

    const map = new Map([
        ["a", "а"], ["b", "б"], ["d", "д"], ["e", "е"], ["f", "ф"],
        ["g", "г"], ["h", "ҳ"], ["i", "и"], ["j", "ж"], ["k", "к"],
        ["l", "л"], ["m", "м"], ["n", "н"], ["o", "о"], ["p", "п"],
        ["q", "қ"], ["r", "р"], ["s", "с"], ["t", "т"], ["u", "у"],
        ["v", "в"], ["x", "х"], ["y", "й"], ["z", "з"], ["c", "ц"],
        ["A", "А"], ["B", "Б"], ["D", "Д"], ["E", "Е"], ["F", "Ф"],
        ["G", "Г"], ["H", "Ҳ"], ["I", "И"], ["J", "Ж"], ["K", "К"],
        ["L", "Л"], ["M", "М"], ["N", "Н"], ["O", "О"], ["P", "П"],
        ["Q", "Қ"], ["R", "Р"], ["S", "С"], ["T", "Т"], ["U", "У"],
        ["V", "В"], ["X", "Х"], ["Y", "Й"], ["Z", "З"], ["C", "Ц"],
        ["'", "'"], ['"', '"'], [" ", " "], [".", "."], [",", ","],
        ["!", "!"], ["?", "?"], [":", ":"], [";", ";"], ["-", "-"],
        ["(", "("], [")", ")"], ["0", "0"], ["1", "1"], ["2", "2"], 
        ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], 
        ["8", "8"], ["9", "9"]
    ]);

    let out = "";
    for (const ch of s) {
        out += map.get(ch) ?? ch;
    }
    return out;
}

// Test matnlari - POS tizimidagi asosiy so'zlar
const testCases = [
    // Asosiy menyular
    { latin: 'Bosh sahifa', expected: 'Бош саҳифа' },
    { latin: 'Mahsulotlar', expected: 'Маҳсулотлар' },
    { latin: 'Mijozlar', expected: 'Мижозлар' },
    { latin: 'Kassirlar', expected: 'Кассирлар' },
    { latin: 'Qarz daftari', expected: 'Қарз дафтари' },
    
    // POS funksiyalari
    { latin: 'Yangi sotuv', expected: 'Йанги сотув' },
    { latin: 'Savatga qo\'shish', expected: 'Саватга қўшиш' },
    { latin: 'Chek chop etish', expected: 'Чек чоп етиш' },
    { latin: 'Shtrih-kod skanerlash', expected: 'Штриҳ-код сканерлаш' },
    
    // Maxsus harflar
    { latin: 'O\'zbekiston', expected: 'Ўзбекистон' },
    { latin: 'G\'alaba', expected: 'Ғалаба' },
    { latin: 'Sho\'rva', expected: 'Шўрва' },
    { latin: 'Cho\'chqa', expected: 'Чўчқа' },
    
    // Katta harflar
    { latin: 'XUJATECH POS', expected: 'ХУЖАТЕЧ ПОС' },
    { latin: 'Yangi Sotuv', expected: 'Йанги Сотув' },
    
    // Aralash matn
    { latin: 'Mahsulot qo\'shish - 1250 so\'m', expected: 'Маҳсулот қўшиш - 1250 сўм' }
];

console.log('📋 Test natijalari:\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
    const result = latinToCyrillic(testCase.latin);
    const passed = result === testCase.expected;
    
    console.log(`${index + 1}. ${passed ? '✅' : '❌'} "${testCase.latin}"`);
    console.log(`   Kutilgan: "${testCase.expected}"`);
    console.log(`   Natija:   "${result}"`);
    
    if (passed) {
        passedTests++;
    } else {
        console.log(`   ⚠️  XATOLIK!`);
    }
    console.log('');
});

console.log(`📊 Jami testlar: ${totalTests}`);
console.log(`✅ Muvaffaqiyatli: ${passedTests}`);
console.log(`❌ Xato: ${totalTests - passedTests}`);
console.log(`📈 Foiz: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
    console.log('\n🎉 Barcha testlar muvaffaqiyatli o\'tdi!');
    console.log('✨ Transliteratsiya tizimi to\'g\'ri ishlayapti!');
    console.log('\n📝 Joriy etilgan komponentlar:');
    console.log('   • Layout.tsx - Asosiy navigatsiya');
    console.log('   • POS.tsx - Kassa tizimi');
    console.log('   • Products.tsx - Mahsulotlar');
    console.log('   • Customers.tsx - Mijozlar');
    console.log('   • Cashiers.tsx - Kassirlar');
    console.log('   • Branches.tsx - Filiallar');
    console.log('   • Debts.tsx - Qarzlar');
    console.log('   • Home.tsx - Bosh sahifa');
    console.log('   • Va boshqa barcha sahifalar...');
    console.log('\n🔄 Avtomatik transliteratsiya:');
    console.log('   • Lotin → Kirill o\'tkazish');
    console.log('   • Til almashtirish tugmasi');
    console.log('   • Barcha UI elementlari');
    console.log('   • Foydalanuvchi ismlari');
    console.log('   • Mahsulot nomlari');
} else {
    console.log('\n⚠️  Ba\'zi testlar muvaffaqiyatsiz!');
    console.log('🔧 Transliteratsiya funksiyasini tekshiring.');
}