import type { RequestHandler } from './$types';
import { buildLocalePath, locales, localeMeta, defaultLocale } from '$lib/i18n';

export const prerender = true;

const routePaths = ['/generate', '/scan', '/about'];

function buildUrl(origin: string, path: string) {
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildHreflangLinks(origin: string, path: string): string {
  const links = locales.map(
    (locale) =>
      `      <xhtml:link rel="alternate" hreflang="${localeMeta[locale].hreflang}" href="${buildUrl(origin, buildLocalePath(locale, path))}" />`
  );
  // x-default points to default locale (en)
  links.push(
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${buildUrl(origin, buildLocalePath(defaultLocale, path))}" />`
  );
  return links.join('\n');
}

export const GET: RequestHandler = async ({ url }) => {
  const origin = (import.meta.env.VITE_SITE_URL || url.origin).replace(/\/$/, '');
  const lastmod = new Date().toISOString().split('T')[0]; // Use date only for lastmod

  // Generate URLs for all locale + path combinations
  const urlEntries = locales.flatMap((locale) =>
    routePaths.map((path) => {
      const loc = buildUrl(origin, buildLocalePath(locale, path));
      const hreflangLinks = buildHreflangLinks(origin, path);
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
${hreflangLinks}
  </url>`;
    })
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
