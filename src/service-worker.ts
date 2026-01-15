/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { pickLocale } from './lib/utils/shareLocale';
import { SHARE_CLEANUP_COUNTER_THRESHOLD, SHARE_CLEANUP_INTERVAL_MS, SHARE_TTL_MS } from './lib/utils/shareConfig';
import { cleanupExpiredShares, getAndDeleteShare, openShareDb, saveShare } from './lib/utils/shareDb';

declare let self: ServiceWorkerGlobalScope;

// Workbox configuration
self.skipWaiting();
clientsClaim();

// Clean up old caches
cleanupOutdatedCaches();

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Web Share Target API handler
 * Intercepts POST requests to /share and processes shared content
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Handle share target POST
  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // Handle shared data retrieval
  if (url.pathname === '/api/share' && url.searchParams.has('id')) {
    event.respondWith(handleShareDataRetrieval(url.searchParams.get('id')!));
    return;
  }
});

async function handleShareTarget(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title')?.toString() || '';
    const text = formData.get('text')?.toString() || '';
    const url = formData.get('url')?.toString() || '';
    const image = formData.get('image') as File | null;

    // Store in IndexedDB
    const db = await openShareDb();
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const locale = pickLocale(request, await listClientUrls());

    // Cleanup expired data in background (throttled: every 10 shares or 5 minutes)
    cleanupCounter++;
    const now = Date.now();
    if (cleanupCounter >= SHARE_CLEANUP_COUNTER_THRESHOLD || now - lastCleanupTime >= SHARE_CLEANUP_INTERVAL_MS) {
      lastCleanupTime = now;
      cleanupCounter = 0;
      cleanupExpiredShares(db, SHARE_TTL_MS).catch((e) => console.warn('Share cleanup failed:', e));
    }

    if (image && image.size > 0) {
      // Store image blob
      const blob = await image.arrayBuffer();
      await saveShare(db, {
        id,
        type: 'image',
        timestamp: Date.now(),
        data: blob,
        metadata: { title, text, url, filename: image.name, mimetype: image.type }
      });

      // Redirect to scanner with share ID
      return Response.redirect(`/${locale}/scan?share=${id}`, 303);
    } else if (text || title || url) {
      // Store text data
      await saveShare(db, {
        id,
        type: 'text',
        timestamp: Date.now(),
        data: { title, text, url },
        metadata: {}
      });

      // Redirect to generator with share ID
      return Response.redirect(`/${locale}/generate?share=${id}`, 303);
    } else {
      // No valid data
      return Response.redirect(`/${locale}/generate`, 303);
    }
  } catch (error) {
    console.error('Share target handling error:', error);
    const locale = pickLocale(request, await listClientUrls());
    return Response.redirect(`/${locale}/generate`, 303);
  }
}

async function handleShareDataRetrieval(id: string): Promise<Response> {
  try {
    const db = await openShareDb();
    
    // Get and delete in single readwrite transaction (atomic operation)
    const data = await getAndDeleteShare(db, id);

    if (!data) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    let response: Response;
    if (data.type === 'image') {
      const meta = JSON.stringify(data.metadata ?? {});
      const buffer = data.data as ArrayBuffer;
      const blob = new Blob([buffer], { type: data.metadata?.mimetype || 'image/png' });
      response = new Response(blob, {
        headers: {
          'Content-Type': blob.type,
          'X-Share-Meta': meta,
          'Cache-Control': 'no-store'
        }
      });
    } else {
      response = new Response(JSON.stringify({
        type: 'text',
        data: data.data
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    return response;
  } catch (error) {
    console.error('Share data retrieval error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}

// Throttle cleanup to avoid performance impact
let lastCleanupTime = 0;
let cleanupCounter = 0;

async function listClientUrls(): Promise<string[]> {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    return clients.map((client) => client.url);
  } catch {
    return [];
  }
}
