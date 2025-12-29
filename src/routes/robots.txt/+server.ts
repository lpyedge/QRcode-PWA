import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async ({ url }) => {
  const origin = (import.meta.env.VITE_SITE_URL || url.origin).replace(/\/$/, '');
  const body = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
