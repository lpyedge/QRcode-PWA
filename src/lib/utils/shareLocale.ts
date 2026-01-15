import { SHARE_DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from './shareConfig';

export { SUPPORTED_LOCALES } from './shareConfig';
export type { SupportedLocale } from './shareConfig';

function normalizeLocaleTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function extractLocaleFromPath(pathname: string): SupportedLocale | null {
  const seg = pathname.split('/').filter(Boolean);
  const first = seg[0]?.toLowerCase();
  if (!first) return null;
  return SUPPORTED_LOCALES.includes(first as SupportedLocale) ? (first as SupportedLocale) : null;
}

export function pickLocaleFromHeader(header: string | null): SupportedLocale | null {
  if (!header) return null;
  const candidates = header
    .split(',')
    .map((part) => normalizeLocaleTag(part.split(';')[0] ?? ''))
    .filter(Boolean);

  for (const cand of candidates) {
    const base = cand.split('-')[0] ?? '';
    if (SUPPORTED_LOCALES.includes(base as SupportedLocale)) {
      return base as SupportedLocale;
    }
  }
  return null;
}

export function pickLocaleFromUrl(url: string): SupportedLocale | null {
  try {
    const u = new URL(url);
    return extractLocaleFromPath(u.pathname);
  } catch {
    return null;
  }
}

export function pickLocaleFromClients(clientUrls: string[]): SupportedLocale | null {
  for (const url of clientUrls) {
    const loc = pickLocaleFromUrl(url);
    if (loc) return loc;
  }
  return null;
}

export function pickLocale(request: Request, clientUrls: string[] = []): SupportedLocale {
  return (
    pickLocaleFromUrl(request.url) ??
    pickLocaleFromHeader(request.headers.get('accept-language')) ??
    pickLocaleFromClients(clientUrls) ??
    SHARE_DEFAULT_LOCALE
  );
}
