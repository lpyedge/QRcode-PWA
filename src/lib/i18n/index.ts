import { writable, derived, get } from 'svelte/store';
import { zh, type Translations } from './zh';

type Locale = 'zh';

const localeData: Record<Locale, Translations> = {
  zh,
};

// 当前语言存储
export const locale = writable<Locale>('zh');

// 派生的翻译对象
export const t = derived(locale, ($locale) => {
  const translations = localeData[$locale];
  
  // 通过键路径获取翻译文本
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

// 获取当前翻译对象（用于直接访问）
// 使用 get() 同步读取当前值，避免订阅导致的记忆体泄漏
export function getTranslations(): Translations {
  return localeData[get(locale)];
}
