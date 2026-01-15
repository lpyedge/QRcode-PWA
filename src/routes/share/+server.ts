import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { pickLocale } from '$lib/utils/shareLocale';

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
    const locale = pickLocale(request);

    // Dev environment: Web Share Target requires SW, which is not always active in dev
    // Disable sharing in dev; production uses SW for full Web Share Target support
    throw redirect(303, `/${locale}/generate`);
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

// GET not supported; /share is POST-only for Web Share Target API
// Note: Web Share Target API is not supported on iOS/Safari
// Android/Chrome users can use the system share menu to send to this PWA
