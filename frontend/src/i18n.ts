/**
 * i18n.ts — react-i18next setup
 * Languages: en (default), hi, mr
 * Persisted to localStorage key 'kh_language'
 * English fallback for all missing keys
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import mrTranslation from './locales/mr/translation.json';

export type AppLanguage = 'en' | 'hi' | 'mr';
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'hi', 'mr'];
const LS_KEY = 'kh_language';

function getStoredLanguage(): AppLanguage {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)) {
      return stored as AppLanguage;
    }
  } catch {}
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      hi: { translation: hiTranslation },
      mr: { translation: mrTranslation },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnNull: false,
    returnEmptyString: false,
  });

/** Change language, persist to localStorage, update <html lang>. */
export function setAppLanguage(lang: AppLanguage): void {
  i18n.changeLanguage(lang);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEY, lang);
  } catch {}
  try {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', lang);
  } catch {}
}

// Set initial <html lang> on load (browser only)
try {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', getStoredLanguage());
  }
} catch {}

export default i18n;
