import type { Handle } from '@sveltejs/kit';
import { localeMeta, normalizeLocale } from '$lib/i18n';

const htmlLangPattern = /<html lang="[^"]*"/;

export const handle: Handle = async ({ event, resolve }) => {
  const lang = normalizeLocale(event.params.lang);
  const response = await resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace(htmlLangPattern, `<html lang="${localeMeta[lang].htmlLang}"`),
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    response.headers.set('content-language', localeMeta[lang].hreflang);
  }

  return response;
};
