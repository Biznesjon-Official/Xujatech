import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate, getLanguageName, getAvailableLanguages } from './translations';

// Kirill -> Lotin transliteratsiya jadvali
const cyrToLatMap: Record<string, string> = {
  'А': 'A', 'а': 'a',
  'Б': 'B', 'б': 'b',
  'В': 'V', 'в': 'v',
  'Г': 'G', 'г': 'g',
  'Д': 'D', 'д': 'd',
  'Е': 'E', 'е': 'e',
  'Ё': 'Yo', 'ё': 'yo',
  'Ж': 'J', 'ж': 'j',
  'З': 'Z', 'з': 'z',
  'И': 'I', 'и': 'i',
  'Й': 'Y', 'й': 'y',
  'К': 'K', 'к': 'k',
  'Л': 'L', 'л': 'l',
  'М': 'M', 'м': 'm',
  'Н': 'N', 'н': 'n',
  'О': 'O', 'о': 'o',
  'П': 'P', 'п': 'p',
  'Р': 'R', 'р': 'r',
  'С': 'S', 'с': 's',
  'Т': 'T', 'т': 't',
  'У': 'U', 'у': 'u',
  'Ф': 'F', 'ф': 'f',
  'Х': 'X', 'х': 'x',
  'Ц': 'Ts', 'ц': 'ts',
  'Ч': 'Ch', 'ч': 'ch',
  'Ш': 'Sh', 'ш': 'sh',
  'Щ': 'Sh', 'щ': 'sh',
  'Ъ': "'", 'ъ': "'",
  'Ы': 'I', 'ы': 'i',
  'Ь': '', 'ь': '',
  'Э': 'E', 'э': 'e',
  'Ю': 'Yu', 'ю': 'yu',
  'Я': 'Ya', 'я': 'ya',
  'Ў': "O'", 'ў': "o'",
  'Қ': 'Q', 'қ': 'q',
  'Ғ': "G'", 'ғ': "g'",
  'Ҳ': 'H', 'ҳ': 'h',
};

// Lotin -> Kirill transliteratsiya jadvali
const latToCyrMap: Record<string, string> = {
  "O'": 'Ў', "o'": 'ў',
  "G'": 'Ғ', "g'": 'ғ',
  'Sh': 'Ш', 'sh': 'ш',
  'Ch': 'Ч', 'ch': 'ч',
  'Yo': 'Ё', 'yo': 'ё',
  'Yu': 'Ю', 'yu': 'ю',
  'Ya': 'Я', 'ya': 'я',
  'Ts': 'Ц', 'ts': 'ц',
  'A': 'А', 'a': 'а',
  'B': 'Б', 'b': 'б',
  'V': 'В', 'v': 'в',
  'G': 'Г', 'g': 'г',
  'D': 'Д', 'd': 'д',
  'E': 'Е', 'e': 'е',
  'J': 'Ж', 'j': 'ж',
  'Z': 'З', 'z': 'з',
  'I': 'И', 'i': 'и',
  'Y': 'Й', 'y': 'й',
  'K': 'К', 'k': 'к',
  'L': 'Л', 'l': 'л',
  'M': 'М', 'm': 'м',
  'N': 'Н', 'n': 'н',
  'O': 'О', 'o': 'о',
  'P': 'П', 'p': 'п',
  'R': 'Р', 'r': 'р',
  'S': 'С', 's': 'с',
  'T': 'Т', 't': 'т',
  'U': 'У', 'u': 'у',
  'F': 'Ф', 'f': 'ф',
  'X': 'Х', 'x': 'х',
  'Q': 'Қ', 'q': 'қ',
  'H': 'Ҳ', 'h': 'ҳ',
};

// Kirill -> Lotin transliteratsiya
function cyrillicToLatin(text: string): string {
  let result = '';
  for (const char of text) {
    result += cyrToLatMap[char] ?? char;
  }
  return result;
}

// Lotin -> Kirill transliteratsiya
function latinToCyrillic(text: string): string {
  let result = text;
  // Avval ikki harfli kombinatsiyalarni almashtirish
  const twoCharPatterns = ["O'", "o'", "G'", "g'", 'Sh', 'sh', 'Ch', 'ch', 'Yo', 'yo', 'Yu', 'yu', 'Ya', 'ya', 'Ts', 'ts'];
  for (const pattern of twoCharPatterns) {
    result = result.split(pattern).join(latToCyrMap[pattern] || pattern);
  }
  // Keyin bir harfli
  let finalResult = '';
  for (const char of result) {
    finalResult += latToCyrMap[char] ?? char;
  }
  return finalResult;
}

// Matnni joriy tilga transliteratsiya qilish
export function transliterate(text: string, targetLang: Language): string {
  if (!text) return text;
  
  // Matn qaysi alifboda ekanligini aniqlash
  const hasCyrillic = /[а-яёўқғҳА-ЯЁЎҚҒҲ]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);
  
  if (targetLang === 'lat' && hasCyrillic) {
    return cyrillicToLatin(text);
  } else if (targetLang === 'cyr' && hasLatin && !hasCyrillic) {
    return latinToCyrillic(text);
  }
  
  return text;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tr: (text: string) => string; // Transliteratsiya funksiyasi
  languageName: string;
  availableLanguages: { code: Language; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'xujatech_pos_language';

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Asosiy til - Kirill
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (saved === 'lat' ? 'lat' : 'cyr') as Language;
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    // HTML lang atributini yangilash
    document.documentElement.lang = language === 'cyr' ? 'uz-Cyrl' : 'uz-Latn';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translate(key, language);
  };

  // Transliteratsiya funksiyasi - ismlar va boshqa dinamik matnlar uchun
  const tr = (text: string): string => {
    return transliterate(text, language);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    tr,
    languageName: getLanguageName(language),
    availableLanguages: getAvailableLanguages(),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Til almashtirish komponenti
export function LanguageSwitcher({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  if (compact) {
    return (
      <button
        onClick={() => setLanguage(language === 'lat' ? 'cyr' : 'lat')}
        className={`w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${className}`}
        title={language === 'lat' ? 'Кирилл' : 'Lotin'}
      >
        {language === 'lat' ? 'Лат' : 'Кир'}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => setLanguage('lat')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          language === 'lat'
            ? 'bg-emerald-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Lotin
      </button>
      <button
        onClick={() => setLanguage('cyr')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          language === 'cyr'
            ? 'bg-emerald-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Кирилл
      </button>
    </div>
  );
}

export default LanguageContext;
