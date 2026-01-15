import type { ShareMetadata, ShareTextData } from './shareDb';

export type ShareFetchError = {
  key: string;
  fallback: string;
  status?: number;
};

export type ShareTextResult =
  | { ok: true; data: ShareTextData }
  | { ok: false; error: ShareFetchError };

export type ShareImageData = {
  file: File;
  blob: Blob;
  meta: ShareMetadata;
};

export type ShareImageResult =
  | { ok: true; data: ShareImageData }
  | { ok: false; error: ShareFetchError };

const SHARE_ERRORS = {
  notFound: { key: 'share.errors.notFound', fallback: 'Shared data not found' },
  expired: { key: 'share.errors.expired', fallback: 'Shared data expired' },
  invalid: { key: 'share.errors.invalid', fallback: 'Shared data is invalid' },
  fetchFailed: { key: 'share.errors.fetchFailed', fallback: 'Failed to load shared data' }
} as const;

function errorFromResponse(response: Response): ShareFetchError {
  if (response.status === 404) return { ...SHARE_ERRORS.notFound, status: response.status };
  if (response.status === 410) return { ...SHARE_ERRORS.expired, status: response.status };
  return { ...SHARE_ERRORS.fetchFailed, status: response.status };
}

function coerceString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeTextData(input: unknown): ShareTextData | null {
  if (!input || typeof input !== 'object') return null;
  const data = input as Record<string, unknown>;
  return {
    title: coerceString(data.title),
    text: coerceString(data.text),
    url: coerceString(data.url)
  };
}

function parseMetaHeader(header: string | null): ShareMetadata {
  if (!header) return {};
  try {
    const parsed = JSON.parse(header);
    return parsed && typeof parsed === 'object' ? (parsed as ShareMetadata) : {};
  } catch {
    return {};
  }
}

export async function fetchSharedText(shareId: string): Promise<ShareTextResult> {
  try {
    const response = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`, { cache: 'no-store' });
    if (!response.ok) {
      return { ok: false, error: errorFromResponse(response) };
    }

    const json = await response.json();
    if (!json || json.type !== 'text') {
      return { ok: false, error: SHARE_ERRORS.invalid };
    }

    const data = normalizeTextData(json.data);
    if (!data) {
      return { ok: false, error: SHARE_ERRORS.invalid };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: SHARE_ERRORS.fetchFailed };
  }
}

export async function fetchSharedImage(shareId: string): Promise<ShareImageResult> {
  try {
    const response = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`, { cache: 'no-store' });
    if (!response.ok) {
      return { ok: false, error: errorFromResponse(response) };
    }

    const meta = parseMetaHeader(response.headers.get('x-share-meta'));
    const blob = await response.blob();
    const filename = meta.filename || 'shared.png';
    const mimetype = meta.mimetype || blob.type || 'image/png';
    const file = new File([blob], filename, { type: mimetype });

    return { ok: true, data: { file, blob, meta: { ...meta, filename, mimetype } } };
  } catch {
    return { ok: false, error: SHARE_ERRORS.fetchFailed };
  }
}
