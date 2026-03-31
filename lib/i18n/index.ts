import zh, { type Translations } from './zh';
import en from './en';

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

const translations: Record<Locale, Translations> = { zh, en };

export function getTranslations(locale: string): Translations {
  return translations[locale as Locale] || translations[defaultLocale];
}

export function getDateLocale(locale: string): string {
  return locale === 'en' ? 'en-US' : 'zh-CN';
}

export function formatDateShort(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(getDateLocale(locale), { month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (locale === 'en') {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' });
  }
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
}

export function formatDateWithWeekday(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (locale === 'en') {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'short' });
  }
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
}

export type { Translations };
