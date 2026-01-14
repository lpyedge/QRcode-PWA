/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

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
    const db = await openShareDB();
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const locale = await pickLocale(request);

    if (image && image.size > 0) {
      // Store image blob
      const blob = await image.arrayBuffer();
      await saveToIDB(db, {
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
      await saveToIDB(db, {
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
    const locale = await safePickLocaleFallback(request);
    return Response.redirect(`/${locale}/generate`, 303);
  }
}

async function handleShareDataRetrieval(id: string): Promise<Response> {
  try {
    const db = await openShareDB();
    const data = await getFromIDB(db, id);

    if (!data) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete after retrieval (one-time use)
    await deleteFromIDB(db, id);

    if (data.type === 'image') {
      const meta = JSON.stringify(data.metadata ?? {});
      const buffer = data.data as ArrayBuffer;
      const blob = new Blob([buffer], { type: data.metadata?.mimetype || 'image/png' });
      return new Response(blob, {
        headers: {
          'Content-Type': blob.type,
          'X-Share-Meta': meta
        }
      });
    } else {
      return new Response(JSON.stringify({
        type: 'text',
        data: data.data
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Share data retrieval error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// IndexedDB helpers
const DB_NAME = 'qrcode-share';
const DB_VERSION = 1;
const STORE_NAME = 'shared-data';

const SUPPORTED_LOCALES = ['en', 'zh', 'ja'];

function extractLocaleFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean);
    const first = seg[0]?.toLowerCase();
    if (SUPPORTED_LOCALES.includes(first)) return first;
    return null;
  } catch {
    return null;
  }
}

async function pickLocale(request: Request): Promise<string> {
  // 1) Try active clients (honor current UI language)
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      const loc = extractLocaleFromUrl(client.url);
      if (loc) return loc;
    }
  } catch {
    /* ignore */
  }

  // 2) Use Accept-Language
  const header = request.headers.get('accept-language') || '';
  const candidates = header
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean);

  for (const cand of candidates) {
    const base = cand.split('-')[0];
    if (SUPPORTED_LOCALES.includes(base)) return base;
  }

  // 3) Fallback to default
  return 'en';
}

async function safePickLocaleFallback(request: Request): Promise<string> {
  try {
    return await pickLocale(request);
  } catch {
    return 'en';
  }
}

function openShareDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

function saveToIDB(db: IDBDatabase, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getFromIDB(db: IDBDatabase, id: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

function deleteFromIDB(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
