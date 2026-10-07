import React from 'react';
import { Globe, Coins } from 'lucide-react';
import { useI18n } from '../../services/i18nContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';
import { SUPPORTED_CURRENCIES } from '../../services/currencyService';

export const LanguageCurrencyBar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, currency, setCurrency } = useI18n();

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {/* Dual Language Selector (English & Bengali) */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg sm:rounded-xl px-1 sm:px-2 py-0.5 sm:py-1 text-xs shadow-sm">
        <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 mr-1 sm:mr-1.5 flex-shrink-0" />
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          aria-label="Language selector"
          className="bg-transparent text-slate-200 text-[11px] sm:text-xs font-semibold outline-none cursor-pointer hover:text-white transition"
        >
          {SUPPORTED_LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code} className="bg-slate-900 text-white font-medium">
              {lang.flag} {compact ? lang.code.toUpperCase() : lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Currency Selector (with BDT prominently supported) */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg sm:rounded-xl px-1 sm:px-2 py-0.5 sm:py-1 text-xs shadow-sm">
        <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 mr-1 sm:mr-1.5 flex-shrink-0" />
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          aria-label="Currency selector"
          className="bg-transparent text-slate-200 text-[11px] sm:text-xs font-bold outline-none cursor-pointer hover:text-amber-300 transition"
        >
          {Object.values(SUPPORTED_CURRENCIES).map(curr => (
            <option key={curr.code} value={curr.code} className="bg-slate-900 text-white font-mono">
              {curr.code} ({curr.symbol})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
