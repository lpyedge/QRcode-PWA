export type RasterFormat = 'png' | 'jpg';

export type RenderSvgToBlobOptions = {
  /** Max output edge in pixels (used when `width/height/scale` not provided). Default: 1024 */
  maxEdge?: number;
  /** Explicit output width in pixels (overrides `maxEdge`). */
  width?: number;
  /** Explicit output height in pixels (overrides `maxEdge`). */
  height?: number;
  /**
   * Scale factor relative to SVG viewBox units (overrides `maxEdge`).
   * Example: if viewBox is 33x33, scale=30 -> 990x990 output.
   */
  scale?: number;
  /** Prefer integer scale for crisp QR edges. Default: true */
  preferIntegerScale?: boolean;
  /** Background fill color for JPG, and optionally for PNG. Default for JPG: '#fff' */
  backgroundColor?: string;
  /** JPEG quality (0..1). Default: 0.92 */
  jpegQuality?: number;
};

function parseViewBox(svg: string): { w: number; h: number } | null {
  // DOMParser is more reliable than regex (supports negative/exponent values).
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const el = doc.documentElement;
      if (el?.tagName?.toLowerCase() !== 'svg') return null;
      const vb = el.getAttribute('viewBox') || '';
      const parts = vb.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        const w = parts[2];
        const h = parts[3];
        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return { w, h };
      }
    } catch {
      // fall through to regex
    }
  }

  // Fallback: extract 3rd/4th values from `viewBox="minX minY w h"`
  const m = svg.match(/viewBox\s*=\s*"\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s+([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*"/i);
  if (!m) return null;
  const w = Number(m[3]);
  const h = Number(m[4]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

import { getTranslations } from '$lib/i18n';

export async function renderSvgToBlob(svg: string, format: RasterFormat, options: RenderSvgToBlobOptions = {}): Promise<Blob> {
  const i18n = getTranslations();
  if (typeof document === 'undefined') throw new Error(i18n.utils?.renderSvgToBlob?.browserError || 'renderSvgToBlob requires a browser environment');

  const vb = parseViewBox(svg);
  if (!vb) throw new Error(i18n.utils?.renderSvgToBlob?.viewBoxError || 'SVG is missing a valid viewBox');

  const maxEdge = Math.max(1, Math.floor(options.maxEdge ?? 1024));
  const preferIntegerScale = options.preferIntegerScale ?? true;

  let outW: number;
  let outH: number;

  if (Number.isFinite(options.width) || Number.isFinite(options.height)) {
    outW = Math.max(1, Math.floor(options.width ?? (vb.w / vb.h) * (options.height ?? maxEdge)));
    outH = Math.max(1, Math.floor(options.height ?? (vb.h / vb.w) * (options.width ?? maxEdge)));
  } else {
    const rawScale = Number.isFinite(options.scale) ? Math.max(1e-6, options.scale!) : maxEdge / Math.max(vb.w, vb.h);
    const scale = preferIntegerScale ? Math.max(1, Math.floor(rawScale)) : rawScale;
    outW = Math.max(1, Math.round(vb.w * scale));
    outH = Math.max(1, Math.round(vb.h * scale));
  }

  // Avoid accidentally allocating huge canvases.
  const maxDim = 8192;
  const maxPixels = 64_000_000; // ~256MB RGBA worst-case
  if (outW > maxDim || outH > maxDim || outW * outH > maxPixels) {
    throw new Error(i18n.utils?.renderSvgToBlob?.rasterSizeError || `Requested raster size is too large (${outW}x${outH})`);
  }

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.decoding = 'async';
  // If the SVG contains an embedded <image href="..."> this helps avoid tainting when CORS is configured.
  img.crossOrigin = 'anonymous';
  img.src = url;

  try {
    if (typeof img.decode === 'function') {
      await img.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(i18n.utils?.renderSvgToBlob?.failedLoadSvg || 'Failed to load SVG image'));
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(i18n.utils?.errors?.context2DUnavailable || '2D context not available');

    // Keep edges crisp; QR modules look better without filtering.
    ctx.imageSmoothingEnabled = false;

    // JPEG has no alpha; always prefill a solid background to avoid black/undefined.
    // For PNG, allow callers to force a solid background as well.
    if (format === 'jpg' || options.backgroundColor) {
      ctx.fillStyle = format === 'jpg' ? options.backgroundColor ?? '#fff' : options.backgroundColor!;
      ctx.fillRect(0, 0, outW, outH);
    }

    ctx.drawImage(img, 0, 0, outW, outH);

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error(i18n.utils?.renderSvgToBlob?.failedExport || 'Failed to export raster image'))),
        mime,
        format === 'jpg' ? Math.min(1, Math.max(0, options.jpegQuality ?? 0.92)) : undefined
      );
    });

    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
