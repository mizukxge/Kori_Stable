import { format as dateFnsFormat } from 'date-fns';
import { enGB, fr } from 'date-fns/locale';
import type { SupportedLanguage } from './config';

// Date-fns locale map
const dateLocales: Record<SupportedLanguage, Locale> = {
  'en-GB': enGB,
  'fr': fr,
};

/**
 * Format a date according to the current locale
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = 'PPP',
  locale: SupportedLanguage = 'en-GB'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  return dateFnsFormat(dateObj, formatStr, {
    locale: dateLocales[locale],
  });
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: SupportedLanguage = 'en-GB'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return locale === 'fr' ? 'À l\'instant' : 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return locale === 'fr' 
      ? `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`
      : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return locale === 'fr'
      ? `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`
      : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return locale === 'fr'
      ? `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`
      : `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return formatDate(dateObj, 'PPP', locale);
}

/**
 * Format a number according to the current locale
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: SupportedLanguage = 'en-GB'
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency according to the current locale
 */
export function formatCurrency(
  value: number,
  currency: string = 'GBP',
  locale: SupportedLanguage = 'en-GB'
): string {
  // Map locale to currency defaults
  const currencyDefaults: Record<SupportedLanguage, string> = {
    'en-GB': 'GBP',
    'fr': 'EUR',
  };

  const currencyToUse = currency || currencyDefaults[locale];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyToUse,
  }).format(value);
}

/**
 * Format percentage according to the current locale
 */
export function formatPercentage(
  value: number,
  decimals: number = 0,
  locale: SupportedLanguage = 'en-GB'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(
  bytes: number,
  locale: SupportedLanguage = 'en-GB'
): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = locale === 'fr' 
    ? ['o', 'Ko', 'Mo', 'Go', 'To']
    : ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  
  return `${formatNumber(value, { maximumFractionDigits: 2 }, locale)} ${sizes[i]}`;
}

/**
 * Get the appropriate locale for Intl APIs
 */
export function getIntlLocale(locale: SupportedLanguage): string {
  return locale;
}

/**
 * Check if locale uses RTL (Right-to-Left)
 */
export function isRTL(locale: SupportedLanguage): boolean {
  // For now, none of our locales are RTL
  // Add 'ar' (Arabic), 'he' (Hebrew), etc. when supported
  const rtlLocales: SupportedLanguage[] = [];
  return rtlLocales.includes(locale);
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: SupportedLanguage): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}