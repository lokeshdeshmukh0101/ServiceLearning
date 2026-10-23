/**
 * LanguageSelector.tsx
 * Compact dropdown to switch between en/hi/mr.
 * Works in both light and dark mode; responsive (icon-only on small screens).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage, type AppLanguage, SUPPORTED_LANGUAGES } from '../../i18n';
import { useTheme } from '../../context/ThemeContext';

const FLAG: Record<AppLanguage, string> = { en: '🇺🇸', hi: '🇮🇳', mr: '🇮🇳' };
const LABEL: Record<AppLanguage, string> = { en: 'EN', hi: 'HI', mr: 'MR' };

export const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = i18n.language as AppLanguage;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (lang: AppLanguage) => {
    setAppLanguage(lang);
    setOpen(false);
  };

  const buttonCls = `flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl border transition-all
    ${isDark
      ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500'
      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'}`;

  const dropdownCls = `absolute right-0 top-full mt-1.5 z-50 w-36 rounded-2xl border shadow-xl overflow-hidden
    ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`;

  return (
    <div ref={ref} className="relative" id="language-selector-wrapper">
      <button
        id="language-selector-btn"
        onClick={() => setOpen(o => !o)}
        aria-label={t('language.selector')}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={buttonCls}
      >
        <Globe className="w-3.5 h-3.5 opacity-70" />
        <span className="hidden sm:inline">{FLAG[current as AppLanguage] ?? '🌐'}</span>
        <span>{LABEL[current as AppLanguage] ?? current.toUpperCase()}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('language.selector')}
          className={dropdownCls}
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <li key={lang}>
              <button
                id={`lang-option-${lang}`}
                role="option"
                aria-selected={lang === current}
                onClick={() => handleChange(lang)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors
                  ${lang === current
                    ? isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                    : isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span className="flex items-center gap-2">
                  <span>{FLAG[lang]}</span>
                  <span>{t(`language.${lang}`)}</span>
                </span>
                {lang === current && <Check className="w-3.5 h-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
