import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enGB from '../locales/en-GB.json';
import fr from '../locales/fr.json';

// Available languages
export const languages = {
  'en-GB': { name: 'English (UK)', nativeName: 'English', flag: '🇬🇧' },
  'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
} as const;

export type SupportedLanguage = keyof typeof languages;

export const defaultLanguage: SupportedLanguage = 'en-GB';

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources: {
      'en-GB': { translation: enGB },
      'fr': { translation: fr },
    },
    fallbackLng: defaultLanguage,
    debug: process.env.NODE_ENV === 'development',
    
    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'kori-language',
    },

    interpolation: {
      // React already escapes values
      escapeValue: false,
      // Format function for numbers, dates, etc.
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (value instanceof Date) {
          return new Intl.DateTimeFormat(lng).format(value);
        }
        return value;
      },
    },

    // Pluralization
    pluralSeparator: '_',
    
    // React options
    react: {
      useSuspense: false,
    },
  });

export default i18n;