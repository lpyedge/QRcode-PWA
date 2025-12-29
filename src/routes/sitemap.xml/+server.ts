import type { RequestHandler } from './$types';
import { buildLocalePath, locales } from '$lib/i18n';

export const prerender = true;

const routePaths = ['/generate', '/scan', '/about'];

function buildUrl(origin: string, path: string) {
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export const GET: RequestHandler = async ({ url }) => {
  const origin = (import.meta.env.VITE_SITE_URL || url.origin).replace(/\/$/, '');
  const lastmod = new Date().toISOString();
  const urls = [
    buildUrl(origin, '/language'),
    ...locales.flatMap((locale) =>
      routePaths.map((path) => buildUrl(origin, buildLocalePath(locale, path)))
    ),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (loc) =>
          `  <url>\n` +
          `    <loc>${loc}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
