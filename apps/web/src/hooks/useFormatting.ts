import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '../i18n/config';
import {
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  getTextDirection,
} from '../i18n/format';

/**
 * Hook for accessing formatting utilities with current locale
 */
export function useFormatting() {
  const { i18n } = useTranslation();
  const locale = i18n.language as SupportedLanguage;

  return {
    locale,
    textDirection: getTextDirection(locale),
    
    formatDate: (date: Date | string | number, format?: string) =>
      formatDate(date, format, locale),
    
    formatRelativeTime: (date: Date | string | number) =>
      formatRelativeTime(date, locale),
    
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, options, locale),
    
    formatCurrency: (value: number, currency?: string) =>
      formatCurrency(value, currency, locale),
    
    formatPercentage: (value: number, decimals?: number) =>
      formatPercentage(value, decimals, locale),
    
    formatFileSize: (bytes: number) =>
      formatFileSize(bytes, locale),
  };
}