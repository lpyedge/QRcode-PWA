import { writable, derived, get } from 'svelte/store';
import { zh } from './zh';
import { en, type Translations } from './en';
import { ja } from './ja';

export const localeMeta = {
  zh: { label: '中文', hreflang: 'zh', htmlLang: 'zh' },
  en: { label: 'English', hreflang: 'en', htmlLang: 'en' },
  ja: { label: '日本語', hreflang: 'ja', htmlLang: 'ja' },
} as const;

export type Locale = keyof typeof localeMeta;

export const locales = Object.keys(localeMeta) as Locale[];
export const defaultLocale: Locale = 'en';

const localeData: Record<Locale, Translations> = {
  zh: zh,
  en,
  ja,
};

export const locale = writable<Locale>(defaultLocale);

export const t = derived(locale, ($locale) => {
  const translations = localeData[$locale];

  return function (key: string, fallback?: string): string {
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return fallback ?? key;
      }
    }

    return typeof value === 'string' ? value : (fallback ?? key);
  };
});

export function isLocale(value?: string): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Check if a path segment looks like a locale code (including legacy ones).
 * This is used for stripping locale prefixes from paths.
 */
function isLocaleSegment(value?: string): boolean {
  if (!value) return false;
  // Match current locales
  if ((locales as readonly string[]).includes(value)) return true;
  // Match legacy/variant Chinese locales (zh-Hant, zh-Hans, zh-TW, etc.)
  if (value.startsWith('zh-')) return true;
  return false;
}

export function normalizeLocale(value?: string): Locale {
  // Map various Chinese locale codes to 'zh'
  if (value?.startsWith('zh')) return 'zh';
  return isLocale(value) ? value : defaultLocale;
}

export function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // Use isLocaleSegment to handle both current and legacy locale codes
  if (segments.length && isLocaleSegment(segments[0])) segments.shift();
  const rest = `/${segments.join('/')}`;
  return rest === '/' ? '/' : rest;
}

export function buildLocalePath(localeValue: Locale, path = '/'): string {
  const normalized = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${localeValue}${normalized}`;
}

export function getTranslations(): Translations {
  return localeData[get(locale)];
}
