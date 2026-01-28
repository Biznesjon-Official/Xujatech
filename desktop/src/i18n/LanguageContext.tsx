import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate, getLanguageName, getAvailableLanguages } from './translations';
import { convertToLanguage } from '../utils/transliterate';

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
  // Asosiy til - Lotin (chunki barcha matnlar lotin da yozilgan)
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (saved === 'cyr' ? 'cyr' : 'lat') as Language;
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
    const latinText = translate(key, 'lat'); // Har doim lotin matnni olish
    return convertToLanguage(latinText, language); // Kerakli tilga o'tkazish
  };

  // Transliteratsiya funksiyasi - ismlar va boshqa dinamik matnlar uchun
  const tr = (text: string): string => {
    return convertToLanguage(text, language);
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
