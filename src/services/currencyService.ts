/**
 * NeextPlay Global Multi-Currency Engine
 * Prominently supports Bangladeshi Taka (BDT - ৳) alongside all global fiat and crypto currencies.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateVsEur: number;
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rateVsEur: 132.5, decimals: 2, symbolPosition: 'prefix' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateVsEur: 1.08, decimals: 2, symbolPosition: 'prefix' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateVsEur: 1.0, decimals: 2, symbolPosition: 'prefix' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateVsEur: 0.85, decimals: 2, symbolPosition: 'prefix' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateVsEur: 90.5, decimals: 2, symbolPosition: 'prefix' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rateVsEur: 5.60, decimals: 2, symbolPosition: 'prefix' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateVsEur: 165.0, decimals: 0, symbolPosition: 'prefix' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateVsEur: 1.48, decimals: 2, symbolPosition: 'prefix' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateVsEur: 1.64, decimals: 2, symbolPosition: 'prefix' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', rateVsEur: 36.2, decimals: 2, symbolPosition: 'prefix' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rateVsEur: 7.82, decimals: 2, symbolPosition: 'prefix' },
  USDT: { code: 'USDT', symbol: '₮', name: 'Tether USD', rateVsEur: 1.08, decimals: 2, symbolPosition: 'suffix' },
  BTC: { code: 'BTC', symbol: '₿', name: 'Bitcoin', rateVsEur: 0.000015, decimals: 6, symbolPosition: 'suffix' },
  ETH: { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', rateVsEur: 0.00038, decimals: 4, symbolPosition: 'suffix' },
};

export function formatCurrencyAmount(amountInEur: number, targetCurrencyCode: string = 'BDT'): string {
  const conf = SUPPORTED_CURRENCIES[targetCurrencyCode] || SUPPORTED_CURRENCIES.BDT;
  const converted = amountInEur * conf.rateVsEur;
  
  const formattedNumber = converted.toLocaleString('en-US', {
    minimumFractionDigits: conf.decimals,
    maximumFractionDigits: conf.decimals,
  });

  if (conf.symbolPosition === 'prefix') {
    return `${conf.symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${conf.symbol}`;
}

export function convertAmount(amountInEur: number, targetCurrencyCode: string = 'BDT'): number {
  const conf = SUPPORTED_CURRENCIES[targetCurrencyCode] || SUPPORTED_CURRENCIES.BDT;
  return Number((amountInEur * conf.rateVsEur).toFixed(conf.decimals));
}
