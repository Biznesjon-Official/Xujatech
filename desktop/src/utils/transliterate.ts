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
  'u': 'у', 'x': 'х', 'y': 'й', 'z': 'з', 'c': 'ц',
  'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д',
  'E': 'Е', 'F': 'Ф', 'H': 'Ҳ', 'I': 'И', 'J': 'Ж',
  'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О',
  'P': 'П', 'Q': 'Қ', 'R': 'Р', 'S': 'С', 'T': 'Т',
  'U': 'У', 'X': 'Х', 'Y': 'Й', 'Z': 'З', 'C': 'Ц',
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
 * Lotin -> Kirill transliteratsiya (Yangilangan versiya)
 * Istisnolar:
 *  - "g'" => "ғ" (G' => Ғ)
 *  - "sh" => "ш"
 *  - "ch" => "ч"
 *  - "ng" hech qachon bitta harfga (masalan "ң") o'tmaydi, "н"+"г" bo'lib qoladi
 */
export function latinToCyrillic(input: string): string {
  if (typeof input !== "string") return "";

  // 1) Avval digraflar va apostrofli harflar: o', g', sh, ch (case-insensitive), lekin case'ni saqlashga harakat qilamiz
  const applyCase = (pattern: string, lower: string, upper: string, title: string) => (m: string) => {
    if (m === m.toUpperCase()) return upper;                // "SH", "G'", "O'"
    if (m[0] === m[0].toUpperCase() && m[1] === m[1].toLowerCase()) return title; // "Sh", "G'", "O'"
    return lower;                                           // "sh", "g'", "o'"
  };

  let s = input
    .replace(/o'/gi, applyCase("o'", "ў", "Ў", "Ў"))
    .replace(/g'/gi, applyCase("g'", "ғ", "Ғ", "Ғ"))
    .replace(/sh/gi, applyCase("sh", "ш", "Ш", "Ш"))
    .replace(/ch/gi, applyCase("ch", "ч", "Ч", "Ч"));

  // 2) "ng" ni maxsus o'tkazmaymiz (ya'ni "ң" qilmaymiz) — shunchaki keyingi xaritada "n"+"g" bo'lib ketadi.

  // 3) Qolgan harflar xaritasi
  const map = new Map([
    ["a", "а"], ["b", "б"], ["d", "д"], ["e", "е"], ["f", "ф"],
    ["g", "г"], ["h", "ҳ"], ["i", "и"], ["j", "ж"], ["k", "к"],
    ["l", "л"], ["m", "м"], ["n", "н"], ["o", "о"], ["p", "п"],
    ["q", "қ"], ["r", "р"], ["s", "с"], ["t", "т"], ["u", "у"],
    ["v", "в"], ["x", "х"], ["y", "й"], ["z", "з"], ["c", "ц"],
    // Katta harflar
    ["A", "А"], ["B", "Б"], ["D", "Д"], ["E", "Е"], ["F", "Ф"],
    ["G", "Г"], ["H", "Ҳ"], ["I", "И"], ["J", "Ж"], ["K", "К"],
    ["L", "Л"], ["M", "М"], ["N", "Н"], ["O", "О"], ["P", "П"],
    ["Q", "Қ"], ["R", "Р"], ["S", "С"], ["T", "Т"], ["U", "У"],
    ["V", "В"], ["X", "Х"], ["Y", "Й"], ["Z", "З"], ["C", "Ц"],
    // Apostroflar va maxsus belgilar
    ["'", "'"], ['"', '"'], [" ", " "], [".", "."], [",", ","],
    ["!", "!"], ["?", "?"], [":", ":"], [";", ";"], ["-", "-"],
    ["(", "("], [")", ")"], ["[", "["], ["]", "]"], ["{", "{"], ["}", "}"],
    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
    ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
  ]);

  let out = "";
  for (const ch of s) {
    out += map.get(ch) ?? ch;
  }
  return out;
}

/**
 * Matn Kirill yozuvidami tekshirish
 */
export function isCyrillic(text: string): boolean {
  if (!text) return false;
  return /[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(text);
}

/**
 * Tanlangan tilga qarab konvertatsiya (Soddalashtirilgan)
 */
export function convertToLanguage(text: string, targetLang: 'cyr' | 'lat'): string {
  if (!text) return text;
  
  if (targetLang === 'lat') {
    return text; // Lotin matni o'zgartirilmaydi
  } else {
    return latinToCyrillic(text); // Avtomatik kirill ga o'tkazish
  }
}
