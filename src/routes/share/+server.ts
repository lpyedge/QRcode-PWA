import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

const SUPPORTED_LOCALES = ['en', 'zh', 'ja'];

function pickLocale(request: Request): string {
  const url = new URL(request.url);
  const seg = url.pathname.split('/').filter(Boolean);
  const first = seg[0]?.toLowerCase();
  if (first && SUPPORTED_LOCALES.includes(first)) return first;

  const header = request.headers.get('accept-language') || '';
  const candidates = header
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean);
  for (const cand of candidates) {
    const base = cand.split('-')[0];
    if (SUPPORTED_LOCALES.includes(base)) return base;
  }

  return 'en';
}

/**
 * Handle Web Share Target POST requests
 * This route is triggered when users share content to the PWA
 * 
 * Implementation note:
 * - For adapter-static, we cannot handle POST on the server
 * - This handler will never execute in production (static deployment)
 * - The actual handling is done by the Service Worker (see dev-dist/sw.js)
 * - SW intercepts POST to /share, stores data in IndexedDB, and redirects
 * - This file exists to satisfy SvelteKit routing structure and dev server
 */

export async function POST({ request }: RequestEvent) {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title')?.toString() || '';
    const text = formData.get('text')?.toString() || '';
    const url = formData.get('url')?.toString() || '';
    const image = formData.get('image') as File | null;

    // Determine target based on shared content type
    const locale = pickLocale(request);

    if (image && image.size > 0) {
      // Image shared -> redirect to scanner
      // In production, SW handles storage and redirect
      // In dev, we can't easily store in IndexedDB server-side, so just redirect
      throw redirect(303, `/${locale}/scan`);
    } else if (text || title || url) {
      // Text shared -> redirect to generator with query params
      const params = new URLSearchParams();
      if (title) params.set('title', title);
      if (text) params.set('text', text);
      if (url) params.set('url', url);
      throw redirect(303, `/${locale}/generate?${params.toString()}`);
    } else {
      // No valid data, redirect to home
      throw redirect(303, `/${locale}/generate`);
    }
  } catch (error) {
    // If error is a redirect, rethrow it
    if (error && typeof error === 'object' && 'status' in error && error.status === 303) {
      throw error;
    }
    
    console.error('Share handling error:', error);
    const locale = pickLocale(request);
    throw redirect(303, `/${locale}/generate`);
  }
}

// GET fallback: if someone navigates directly to /share
export async function GET(event: RequestEvent) {
  const locale = pickLocale(event.request);
  const url = new URL(event.request.url);

  // iOS does not support Web Share Target; as a fallback, accept text/title/url query params via GET
  const params = new URLSearchParams();
  const title = url.searchParams.get('title') ?? '';
  const text = url.searchParams.get('text') ?? '';
  const targetUrl = url.searchParams.get('url') ?? '';
  if (title) params.set('title', title);
  if (text) params.set('text', text);
  if (targetUrl) params.set('url', targetUrl);

  if ([...params.keys()].length > 0) {
    throw redirect(303, `/${locale}/generate?${params.toString()}`);
  }

  throw redirect(303, `/${locale}/generate`);
}
