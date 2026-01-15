import { describe, it, expect } from 'vitest';
import { pickLocale } from '$lib/utils/shareLocale';
import { SHARE_DEFAULT_LOCALE } from '$lib/utils/shareConfig';

describe('shareLocale', () => {
  it('prefers URL locale over Accept-Language', () => {
    const req = new Request('https://example.com/zh/generate', {
      headers: { 'accept-language': 'ja' }
    });
    expect(pickLocale(req)).toBe('zh');
  });

  it('falls back to Accept-Language when URL has no locale', () => {
    const req = new Request('https://example.com/share', {
      headers: { 'accept-language': 'ja,en;q=0.8' }
    });
    expect(pickLocale(req)).toBe('ja');
  });

  it('falls back to client URLs when no header or URL locale', () => {
    const req = new Request('https://example.com/share');
    expect(pickLocale(req, ['https://example.com/en/scan'])).toBe('en');
  });

  it('defaults to share default locale when no signals match', () => {
    const req = new Request('https://example.com/share', {
      headers: { 'accept-language': 'fr' }
    });
    expect(pickLocale(req, ['https://example.com/fr/scan'])).toBe(SHARE_DEFAULT_LOCALE);
  });
});
