/**
 * O'zbek Kirill → Lotin transliteratsiya
 */

const cyrToLat: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'yo', 'ж': 'j', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'sh', 'ъ': "'", 'ы': 'i', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  // O'zbek maxsus harflari
  'ў': "o'", 'қ': 'q', 'ғ': "g'", 'ҳ': 'h',
  // Katta harflar
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
  'Е': 'E', 'Ё': 'Yo', 'Ж': 'J', 'З': 'Z', 'И': 'I',
  'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
  'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
  'У': 'U', 'Ф': 'F', 'Х': 'X', 'Ц': 'Ts', 'Ч': 'Ch',
  'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': "'", 'Ы': 'I', 'Ь': '',
  'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
  'Ў': "O'", 'Қ': 'Q', 'Ғ': "G'", 'Ҳ': 'H',
};

const latToCyr: Record<string, string> = {
  "o'": 'ў', "O'": 'Ў', "g'": 'ғ', "G'": 'Ғ',
  'sh': 'ш', 'Sh': 'Ш', 'ch': 'ч', 'Ch': 'Ч',
  'yo': 'ё', 'Yo': 'Ё', 'yu': 'ю', 'Yu': 'Ю',
  'ya': 'я', 'Ya': 'Я', 'ts': 'ц', 'Ts': 'Ц',
  'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д',
  'e': 'е', 'f': 'ф', 'h': 'ҳ', 'i': 'и', 'j': 'ж',
  'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
  'p': 'п', 'q': 'қ', 'r': 'р', 's': 'с', 't': 'т',
  'u': 'у', 'x': 'х', 'y': 'й', 'z': 'з',
  'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д',
  'E': 'Е', 'F': 'Ф', 'H': 'Ҳ', 'I': 'И', 'J': 'Ж',
  'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О',
  'P': 'П', 'Q': 'Қ', 'R': 'Р', 'S': 'С', 'T': 'Т',
  'U': 'У', 'X': 'Х', 'Y': 'Й', 'Z': 'З',
};

/**
 * Kirill → Lotin
 */
export function cyrillicToLatin(text: string): string {
  if (!text) return text;
  let result = '';
  for (const char of text) {
    result += cyrToLat[char] || char;
  }
  return result;
}

/**
 * Lotin → Kirill
 */
export function latinToCyrillic(text: string): string {
  if (!text) return text;
  let result = text;
  
  // Avval 2 harfli kombinatsiyalarni almashtirish
  const twoCharCombos = ["o'", "O'", "g'", "G'", 'sh', 'Sh', 'ch', 'Ch', 'yo', 'Yo', 'yu', 'Yu', 'ya', 'Ya', 'ts', 'Ts'];
  for (const combo of twoCharCombos) {
    result = result.split(combo).join(latToCyr[combo] || combo);
  }
  
  // Keyin 1 harfli
  let finalResult = '';
  for (const char of result) {
    finalResult += latToCyr[char] || char;
  }
  return finalResult;
}

/**
 * Matn Kirill yozuvidami tekshirish
 */
export function isCyrillic(text: string): boolean {
  if (!text) return false;
  return /[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(text);
}

/**
 * Tanlangan tilga qarab konvertatsiya
 */
export function convertToLanguage(text: string, targetLang: 'cyr' | 'lat'): string {
  if (!text) return text;
  
  const textIsCyrillic = isCyrillic(text);
  
  if (targetLang === 'lat' && textIsCyrillic) {
    return cyrillicToLatin(text);
  }
  
  if (targetLang === 'cyr' && !textIsCyrillic) {
    return latinToCyrillic(text);
  }
  
  return text;
}
