export const SUPPORTED_LOCALES = ['en', 'zh', 'ja'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const SHARE_DEFAULT_LOCALE: SupportedLocale = 'en';
export const SHARE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SHARE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const SHARE_CLEANUP_COUNTER_THRESHOLD = 10; // Every 10 shares
