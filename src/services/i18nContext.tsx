/**
 * NeextPlay i18n & Currency Context Provider
 * Powers universal multi-language translations and multi-currency formatting everywhere.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TRANSLATIONS, SUPPORTED_LANGUAGES, LanguageDef } from '../i18n/translations';
import { SUPPORTED_CURRENCIES, CurrencyConfig, formatCurrencyAmount, convertAmount } from './currencyService';

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  currentLanguageDef: LanguageDef;
  t: (key: string, fallback?: string) => string;
  currency: string;
  setCurrency: (curr: string) => void;
  currentCurrencyConfig: CurrencyConfig;
  formatMoney: (amountInEur: number) => string;
  convertFromEur: (amountInEur: number) => number;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'neextplay_active_lang';
const CURR_STORAGE_KEY = 'neextplay_active_curr';

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('bn');
  const [currency, setCurrencyState] = useState<string>('BDT');

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang && TRANSLATIONS[savedLang]) {
      setLanguageState(savedLang);
    }
    const savedCurr = localStorage.getItem(CURR_STORAGE_KEY);
    if (savedCurr && SUPPORTED_CURRENCIES[savedCurr]) {
      setCurrencyState(savedCurr);
    }
  }, []);

  const setLanguage = (lang: string) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  };

  const setCurrency = (curr: string) => {
    if (SUPPORTED_CURRENCIES[curr]) {
      setCurrencyState(curr);
      localStorage.setItem(CURR_STORAGE_KEY, curr);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    const enDict = TRANSLATIONS.en;
    if (enDict[key]) return enDict[key];
    return fallback || key;
  };

  const currentLanguageDef =
    SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const currentCurrencyConfig =
    SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.EUR;

  const formatMoney = (amountInEur: number): string => {
    return formatCurrencyAmount(amountInEur, currency);
  };

  const convertFromEur = (amountInEur: number): number => {
    return convertAmount(amountInEur, currency);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageDef,
        t,
        currency,
        setCurrency,
        currentCurrencyConfig,
        formatMoney,
        convertFromEur,
      }}
    >
      <div dir={currentLanguageDef.dir || 'ltr'} className="w-full">
        {children}
      </div>
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
