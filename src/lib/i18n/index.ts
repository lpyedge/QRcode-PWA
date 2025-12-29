import { writable, derived, get } from 'svelte/store';
import { zh } from './zh';
import { en, type Translations } from './en';
import { ja } from './ja';

export const localeMeta = {
  'zh-Hant': { label: '繁體中文', hreflang: 'zh-Hant', htmlLang: 'zh-Hant' },
  en: { label: 'English', hreflang: 'en', htmlLang: 'en' },
  ja: { label: '日本語', hreflang: 'ja', htmlLang: 'ja' },
} as const;

export type Locale = keyof typeof localeMeta;

export const locales = Object.keys(localeMeta) as Locale[];
export const defaultLocale: Locale = 'zh-Hant';

const localeData: Record<Locale, Translations> = {
  'zh-Hant': zh,
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

export function normalizeLocale(value?: string): Locale {
  if (value === 'zh') return 'zh-Hant';
  return isLocale(value) ? value : defaultLocale;
}

export function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length && isLocale(segments[0])) segments.shift();
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
