/**
 * QR Code Encoding and SVG Generation
 * 
 * Generates clean, standards-compliant QR code SVGs from text content.
 * Produces unstyled SVG with semantic attributes for downstream processing.
 * 
 * Key Features:
 * - Error correction level control (L/M/Q/H)
 * - Configurable quiet zone (margin)
 * - Optional background rectangle
 * - Semantic data attributes for post-processing
 * - Clean rect-per-module output
 * 
 * The generated SVG uses viewBox for scaling and includes data attributes
 * (data-qr-cols, data-qr-rows, data-qr-margin) to preserve matrix metadata.
 * 
 * @example
 * ```ts
 * const svg = await generateSvg(
 *   { content: 'Hello', errorCorrectionLevel: 'M' },
 *   { margin: 4, includeBackground: true }
 * );
 * ```
 */

import type { QrComputeOptions, QrMatrix } from './types';
import { generateQrMatrix } from './qrcore';
import { getTranslations } from '$lib/i18n';

export type QrSvgRenderOptions = {
  /** Quiet zone in modules. Standard QR recommends 4. */
  margin?: number;
  /**
   * Output a background rect node. The rect does not set a `fill` attribute
   * so background coloring is delegated to the upper layer (CSS or post-processing).
   */
  includeBackground?: boolean;

  /** Optional classes for styling in the upper layer */
  svgClass?: string; // default: 'qr'

  /**
   * Note: This generator emits an SVG with a `viewBox` but does not set
   * explicit `width`/`height` attributes. Callers should control displayed
  * or exported raster size via CSS or by adding width/height when embedding
  * or exporting the SVG.
  */
  bgClass?: string; // default: 'qr-bg'
  moduleClass?: string; // default: 'qr-module'

  /** Optional id prefix to make ids stable across renders */
  idPrefix?: string;
};

export async function generateSvg(computeOptions: QrComputeOptions, renderOptions?: QrSvgRenderOptions): Promise<string> {
  const matrix: QrMatrix = await generateQrMatrix(computeOptions);
  const svg = generateSvgFromMatrix(matrix, renderOptions);
  return svg;
}

/**
 * Generate a clean QR SVG from matrix.
 * - 1 module = 1 rect
 * - no color/fancy style applied here
 * - adds useful attributes for upper-layer styling/merging
 */
export function generateSvgFromMatrix(matrix: QrMatrix, opts: QrSvgRenderOptions = {}): string {
  if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0]) || matrix[0].length === 0) {
    const i18n = getTranslations();
    throw new Error(i18n.utils?.errors?.invalidQrMatrix || 'Invalid QR matrix');
  }
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== cols) {
      const i18n = getTranslations();
      throw new Error(i18n.utils?.errors?.jaggedQrMatrix || 'Jagged QR matrix is not supported');
    }
  }

  const margin = Math.max(0, Math.floor(opts.margin ?? 4));
  const includeBackground = opts.includeBackground ?? true;

  const svgClass = opts.svgClass ?? 'qr';
  const bgClass = opts.bgClass ?? 'qr-bg';
  const moduleClass = opts.moduleClass ?? 'qr-module';
  const idPrefix = opts.idPrefix ? String(opts.idPrefix) : '';

  const vbW = cols + margin * 2;
  const vbH = rows + margin * 2;

  const escAttr = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" shape-rendering="crispEdges" class="${escAttr(
      svgClass
    )}" data-qr-cols="${cols}" data-qr-rows="${rows}" data-qr-margin="${margin}" data-qr-content-x="${margin}" data-qr-content-y="${margin}" data-qr-content-w="${cols}" data-qr-content-h="${rows}">`
  );

  if (includeBackground) {
    // Use stable role name for background so upper-layer stylizer can reliably find it.
    parts.push(`<rect x="0" y="0" width="${vbW}" height="${vbH}" class="${escAttr(bgClass)}" data-qr-role="bg"/>`);
  }

  for (let y = 0; y < rows; y++) {
    const row = matrix[y];
    for (let x = 0; x < cols; x++) {
      if (!row[x]) continue;
      const px = x + margin;
      const py = y + margin;
      const id = idPrefix ? ` id="${escAttr(idPrefix)}-m-${x}-${y}"` : '';
      // Use stable role name 'module' for module elements to match stylizer expectations.
      parts.push(
        `<rect${id} x="${px}" y="${py}" width="1" height="1" class="${escAttr(moduleClass)}" data-qr-role="module" data-qr-x="${x}" data-qr-y="${y}" data-qr-sx="${px}" data-qr-sy="${py}"/>`
      );
    }
  }

  parts.push('</svg>');
  return parts.join('\n');
}

export default { generateSvg };
