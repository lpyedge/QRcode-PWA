/**
 * QR Code SVG Stylization
 * 
 * Post-processes plain QR SVGs to apply visual styles:
 * - Module shapes: square, circle, rounded corners, fluid
 * - Color fills: solid or linear gradients
 * - Finder (eye) customization: shape and color overrides
 * - Logo integration: center cutout with background shape
 * 
 * Key Features:
 * - Non-destructive: Works on any valid QR SVG
 * - Export-friendly: Uses attributes over CSS for compatibility
 * - Efficient: Reuses gradient defs for performance
 * - Robust: SSR-safe fallback for server-side rendering
 * 
 * The function preserves QR code readability while applying aesthetic transforms.
 * For logo integration, it automatically removes modules in the center region.
 * 
 * @example
 * ```ts
 * const styled = stylizeSvg(plainSvg, {
 *   shapeStyle: 'rounded',
 *   shapeColor: '#000',
 *   shapeGradient: {
 *     enabled: true,
 *     from: '#667eea',
 *     to: '#764ba2',
 *     direction: 'diagonal'
 *   },
 *   logo: {
 *     href: 'data:image/png;base64,...',
 *     sizeRatio: 0.22,
 *     shape: 'circle'
 *   }
 * });
 * ```
 */

import { debug } from './debug';

export type QrGradientDirection = 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl' | 'to-t' | 'to-tr' | 'horizontal' | 'vertical' | 'diagonal';
export type QrModuleStyle = 'square' | 'circle' | 'rounded' | 'fluid';
export type QrEyeStyle = 'square' | 'circle';

export type QrLogoOptions = {
  /**
   * Image URL for `<image href="...">`.
   * Prefer `data:` URLs to avoid CORS-tainting when exporting to canvas.
   */
  href: string;
  /** Logo size relative to QR content width (0..1). Default: 0.22 */
  sizeRatio?: number;
  /** Extra padding around the logo cutout (0..1 of content width). Default: 0.03 */
  paddingRatio?: number;
  /** Background shape behind the logo. Default: 'rounded' */
  shape?: 'square' | 'circle' | 'rounded';
  /** Background fill behind the logo. Default: backgroundColor ?? '#fff' */
  backgroundColor?: string | null;
  /** Corner radius in modules when `shape='rounded'`. Default: 0.6 */
  cornerRadius?: number;
};

export type QrStylizeOptions = {
  /** Module (data) color */
  shapeColor?: string;
  /** Background color (`null` to keep transparent) */
  backgroundColor?: string | null;

  /** Module geometry */
  shapeStyle?: QrModuleStyle;
  /** Rounded corner radius in module units (0..0.5). Default: 0.25 */
  roundedRadius?: number;
  /** Fluid corner radius in module units (0..0.5). Default: 0.42 */
  fluidRadius?: number;

  /** Optional module gradient */
  shapeGradient?: {
    enabled: boolean;
    from: string;
    to: string;
    direction: QrGradientDirection;
  };

  /** Finder (eye) styling */
  borderStyle?: QrEyeStyle;
  borderColor?: string;
  centerStyle?: QrEyeStyle;
  centerColor?: string;

  /** Center logo with cutout */
  logo?: QrLogoOptions;
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeColor(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;
  if (value === 'transparent' || value === 'currentColor') return value;
  // Hex colors: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return value;
  // RGB/RGBA
  if (/^rgba?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?(\s*,\s*\d+(\.\d+)?)?\s*\)$/i.test(value)) return value;
  // HSL/HSLA
  if (/^hsla?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?%(\s*,\s*\d+(\.\d+)?)?\s*\)$/i.test(value)) return value;
  // CSS variables
  if (/^var\(--[-\w]+\)$/.test(value)) return value;
  
  debug('sanitizeColor: rejected invalid color', value);
  return null;
}

function safeHref(href: string) {
  // Keep it strict by default: allow `data:` and `blob:` for safe canvas export.
  // Callers can still pass other values, but we won't embed them silently.
  const v = href.trim();
  if (/^(data:image\/|blob:)/i.test(v)) return v;
  return null;
}

function getOrCreateDefs(doc: Document, svgEl: SVGSVGElement) {
  let defs = svgEl.querySelector('defs');
  if (!defs) {
    defs = doc.createElementNS(SVG_NS, 'defs');
    svgEl.insertBefore(defs, svgEl.firstChild);
  }
  return defs;
}

function parseNumberAttr(el: Element, name: string): number | null {
  const raw = el.getAttribute(name);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function ensureGroup(doc: Document, svgEl: SVGSVGElement, role: string, insertBefore?: Element | null) {
  let g = svgEl.querySelector(`g[data-qr-role="${role}"]`) as SVGGElement | null;
  if (!g) {
    g = doc.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-qr-role', role);
    if (insertBefore) svgEl.insertBefore(g, insertBefore);
    else svgEl.appendChild(g);
  }
  return g;
}

function circleD(cx: number, cy: number, r: number) {
  // Two arcs to form a circle.
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
}

function squareRingD(x: number, y: number, outer: number, innerInset: number) {
  const i = innerInset;
  const inner = outer - i * 2;
  return `M ${x} ${y} h ${outer} v ${outer} h ${-outer} Z M ${x + i} ${y + i} h ${inner} v ${inner} h ${-inner} Z`;
}

function moduleFluidPathD(x: number, y: number, r: number, roundTL: boolean, roundTR: boolean, roundBR: boolean, roundBL: boolean) {
  const rr = clamp(r, 0, 0.5);
  const tl = roundTL ? rr : 0;
  const tr = roundTR ? rr : 0;
  const br = roundBR ? rr : 0;
  const bl = roundBL ? rr : 0;

  const x0 = x;
  const y0 = y;
  const x1 = x + 1;
  const y1 = y + 1;

  return [
    `M ${x0 + tl} ${y0}`,
    `L ${x1 - tr} ${y0}`,
    tr ? `A ${tr} ${tr} 0 0 1 ${x1} ${y0 + tr}` : `L ${x1} ${y0}`,
    `L ${x1} ${y1 - br}`,
    br ? `A ${br} ${br} 0 0 1 ${x1 - br} ${y1}` : `L ${x1} ${y1}`,
    `L ${x0 + bl} ${y1}`,
    bl ? `A ${bl} ${bl} 0 0 1 ${x0} ${y1 - bl}` : `L ${x0} ${y1}`,
    `L ${x0} ${y0 + tl}`,
    tl ? `A ${tl} ${tl} 0 0 1 ${x0 + tl} ${y0}` : `L ${x0} ${y0}`,
    'Z',
  ].join(' ');
}

function getQrMeta(svgEl: SVGSVGElement) {
  const cols = parseNumberAttr(svgEl, 'data-qr-cols');
  const rows = parseNumberAttr(svgEl, 'data-qr-rows');
  const margin = parseNumberAttr(svgEl, 'data-qr-margin');
  const contentX = parseNumberAttr(svgEl, 'data-qr-content-x');
  const contentY = parseNumberAttr(svgEl, 'data-qr-content-y');
  const contentW = parseNumberAttr(svgEl, 'data-qr-content-w');
  const contentH = parseNumberAttr(svgEl, 'data-qr-content-h');
  if (
    cols === null ||
    rows === null ||
    margin === null ||
    contentX === null ||
    contentY === null ||
    contentW === null ||
    contentH === null
  ) {
    return null;
  }
  return { cols, rows, margin, contentX, contentY, contentW, contentH };
}

function isInFinderRegion(x: number, y: number, cols: number, rows: number) {
  const inTL = x >= 0 && x < 7 && y >= 0 && y < 7;
  const inTR = x >= cols - 7 && x < cols && y >= 0 && y < 7;
  const inBL = x >= 0 && x < 7 && y >= rows - 7 && y < rows;
  return inTL || inTR || inBL;
}

/**
 * Apply a styling pass to a pure module-grid SVG.
 * - background/module fill (solid or gradient)
 * - module geometry (square/circle/rounded/fluid)
 * - optional finder (eye) overrides
 * - optional centered logo cutout + image
 *
 * Returns a new SVG string. If DOM APIs are unavailable (SSR), it applies a safe
 * minimal CSS-injection fallback for basic fills and returns the original markup
 * for structural transforms.
 */
export function stylizeSvg(svg: string, opts: QrStylizeOptions = {}): string {
  if (!svg || typeof svg !== 'string') return svg;

  // SSR fallback: only inject simple fills.
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    const moduleFill = sanitizeColor(opts.shapeColor);
    const bgFill = opts.backgroundColor === null ? null : sanitizeColor(opts.backgroundColor);
    const rules: string[] = [];
    if (moduleFill) rules.push(`.qr-module{fill:${moduleFill};}`);
    if (bgFill) rules.push(`.qr-bg{fill:${bgFill};}`);
    if (rules.length === 0) return svg;
    const styleTag = `<style type="text/css"><![CDATA[${rules.join('')}]]></style>`;
    return svg.replace(/<svg([^>]*)>/i, (m) => `${m}${styleTag}`);
  }

  try {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.documentElement as unknown as SVGSVGElement;
    if (!svgEl || svgEl.tagName.toLowerCase() !== 'svg') return svg;

    const meta = getQrMeta(svgEl);

    // Ensure a stable per-SVG uid for defs ids.
    let uid = svgEl.getAttribute('data-qr-uid') || '';
    if (!uid) {
      uid = Math.random().toString(36).slice(2, 10);
      svgEl.setAttribute('data-qr-uid', uid);
    }

    // Background fill (prefer setting the element attribute for export reliability).
    const bg = svgEl.querySelector('[data-qr-role="bg"]') as SVGRectElement | null;
    if (bg) {
      if (opts.backgroundColor === null) {
        bg.removeAttribute('fill');
        bg.setAttribute('fill', 'none');
      } else if (opts.backgroundColor !== undefined) {
        const bgFill = sanitizeColor(opts.backgroundColor);
        if (bgFill) bg.setAttribute('fill', bgFill);
      }
    }

    // Create/normalize a modules group so we can apply a single fill rule.
    const modules = Array.from(svgEl.querySelectorAll('[data-qr-role="module"]'));
    const firstModule = modules[0] ?? null;
    const modulesGroup = ensureGroup(doc, svgEl, 'modules', firstModule);
    for (const m of modules) {
      if (m.parentNode !== modulesGroup) modulesGroup.appendChild(m);
    }

    // Finder overrides (replace the 3 finder regions with dedicated nodes).
    const wantsFinder =
      opts.borderStyle !== undefined ||
      opts.centerStyle !== undefined ||
      opts.borderColor !== undefined ||
      opts.centerColor !== undefined;

    if (wantsFinder && meta) {
      const borderFill = sanitizeColor(opts.borderColor) || sanitizeColor(opts.shapeColor) || '#000';
      const centerFill = sanitizeColor(opts.centerColor) || borderFill;
      const borderStyle = opts.borderStyle ?? 'square';
      const centerStyle = opts.centerStyle ?? 'square';

      const findersGroup = ensureGroup(doc, svgEl, 'finders', modulesGroup);
      while (findersGroup.firstChild) findersGroup.removeChild(findersGroup.firstChild);

      // Remove module nodes that fall into the finder regions (we'll redraw them).
      for (const node of Array.from(modulesGroup.querySelectorAll('[data-qr-role="module"]'))) {
        const mx = parseNumberAttr(node, 'data-qr-x');
        const my = parseNumberAttr(node, 'data-qr-y');
        if (mx === null || my === null) continue;
        if (isInFinderRegion(mx, my, meta.cols, meta.rows)) node.parentNode?.removeChild(node);
      }

      const origins = [
        { x: meta.contentX, y: meta.contentY }, // TL
        { x: meta.contentX + meta.cols - 7, y: meta.contentY }, // TR
        { x: meta.contentX, y: meta.contentY + meta.rows - 7 }, // BL
      ];

      for (const o of origins) {
        const outerSize = 7;
        const innerInset = 1;
        const innerSize = 3;

        // Border ring (outer 7 minus inner 5).
        const border = doc.createElementNS(SVG_NS, 'path');
        border.setAttribute('fill', borderFill);
        border.setAttribute('fill-rule', 'evenodd');
        if (borderStyle === 'circle') {
          const cx = o.x + outerSize / 2;
          const cy = o.y + outerSize / 2;
          const d = `${circleD(cx, cy, outerSize / 2)} ${circleD(cx, cy, outerSize / 2 - innerInset)}`;
          border.setAttribute('d', d);
        } else {
          border.setAttribute('d', squareRingD(o.x, o.y, outerSize, innerInset));
        }
        findersGroup.appendChild(border);

        // Center dot (3x3).
        if (centerStyle === 'circle') {
          const c = doc.createElementNS(SVG_NS, 'circle');
          c.setAttribute('cx', String(o.x + outerSize / 2));
          c.setAttribute('cy', String(o.y + outerSize / 2));
          c.setAttribute('r', String(innerSize / 2));
          c.setAttribute('fill', centerFill);
          findersGroup.appendChild(c);
        } else {
          const r = doc.createElementNS(SVG_NS, 'rect');
          r.setAttribute('x', String(o.x + 2));
          r.setAttribute('y', String(o.y + 2));
          r.setAttribute('width', String(innerSize));
          r.setAttribute('height', String(innerSize));
          r.setAttribute('fill', centerFill);
          findersGroup.appendChild(r);
        }
      }
    }

    // Module fill: solid or gradient.
    const moduleSolidFill = sanitizeColor(opts.shapeColor);
    const gradientEnabled = Boolean(opts.shapeGradient?.enabled);
    if (gradientEnabled && meta) {
      const from = sanitizeColor(opts.shapeGradient?.from) || moduleSolidFill || '#000';
      const to = sanitizeColor(opts.shapeGradient?.to) || moduleSolidFill || '#000';
      const dir = opts.shapeGradient?.direction ?? 'horizontal';
      const defs = getOrCreateDefs(doc, svgEl);
      const gradId = `qr-grad-${uid}`;

      // Replace previous gradient if any.
      const old = defs.querySelector(`#${gradId}`);
      if (old) old.parentNode?.removeChild(old);

      const lg = doc.createElementNS(SVG_NS, 'linearGradient');
      lg.setAttribute('id', gradId);
      lg.setAttribute('gradientUnits', 'userSpaceOnUse');
      const x0 = meta.contentX;
      const y0 = meta.contentY;
      const x1 = meta.contentX + meta.contentW;
      const y1 = meta.contentY + meta.contentH;

      let gx1 = x0, gy1 = y0, gx2 = x1, gy2 = y0; // default horizontal (to-r)

      switch (dir) {
        case 'to-r':
        case 'horizontal':
          gx1 = x0; gy1 = y0; gx2 = x1; gy2 = y0;
          break;
        case 'to-br':
        case 'diagonal':
          gx1 = x0; gy1 = y0; gx2 = x1; gy2 = y1;
          break;
        case 'to-b':
        case 'vertical':
          gx1 = x0; gy1 = y0; gx2 = x0; gy2 = y1;
          break;
        case 'to-bl':
          gx1 = x1; gy1 = y0; gx2 = x0; gy2 = y1;
          break;
        case 'to-l':
          gx1 = x1; gy1 = y0; gx2 = x0; gy2 = y0;
          break;
        case 'to-tl':
          gx1 = x1; gy1 = y1; gx2 = x0; gy2 = y0;
          break;
        case 'to-t':
          gx1 = x0; gy1 = y1; gx2 = x0; gy2 = y0;
          break;
        case 'to-tr':
          gx1 = x0; gy1 = y1; gx2 = x1; gy2 = y0;
          break;
      }

      lg.setAttribute('x1', String(gx1));
      lg.setAttribute('y1', String(gy1));
      lg.setAttribute('x2', String(gx2));
      lg.setAttribute('y2', String(gy2));

      const s0 = doc.createElementNS(SVG_NS, 'stop');
      s0.setAttribute('offset', '0%');
      s0.setAttribute('stop-color', from);
      const s1 = doc.createElementNS(SVG_NS, 'stop');
      s1.setAttribute('offset', '100%');
      s1.setAttribute('stop-color', to);
      lg.appendChild(s0);
      lg.appendChild(s1);
      defs.appendChild(lg);

      modulesGroup.setAttribute('fill', `url(#${gradId})`);
    } else if (moduleSolidFill) {
      modulesGroup.setAttribute('fill', moduleSolidFill);
    }

    // Module geometry transforms.
    const style = opts.shapeStyle ?? 'square';
    if (style === 'square') svgEl.setAttribute('shape-rendering', 'crispEdges');
    else svgEl.setAttribute('shape-rendering', 'geometricPrecision');

    if (style === 'circle') {
      const rects = Array.from(modulesGroup.querySelectorAll('rect[data-qr-role="module"]'));
      for (const r of rects) {
        const x = parseFloat(r.getAttribute('x') || '0');
        const y = parseFloat(r.getAttribute('y') || '0');
        const cx = x + 0.5;
        const cy = y + 0.5;
        const id = r.getAttribute('id');
        const cls = r.getAttribute('class');

        const circle = doc.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', String(cx));
        circle.setAttribute('cy', String(cy));
        circle.setAttribute('r', '0.5');
        if (id) circle.setAttribute('id', id);
        if (cls) circle.setAttribute('class', cls);
        for (let i = 0; i < r.attributes.length; i++) {
          const a = r.attributes[i];
          if (a.name.startsWith('data-')) circle.setAttribute(a.name, a.value);
        }
        r.parentNode?.replaceChild(circle, r);
      }
    } else if (style === 'rounded') {
      const rr = clamp(opts.roundedRadius ?? 0.25, 0, 0.5);
      const rects = Array.from(modulesGroup.querySelectorAll('rect[data-qr-role="module"]'));
      for (const r of rects) {
        r.setAttribute('rx', String(rr));
        r.setAttribute('ry', String(rr));
      }
    } else if (style === 'fluid' && meta) {
      const r = clamp(opts.fluidRadius ?? 0.42, 0, 0.5);

      const nodes = Array.from(modulesGroup.querySelectorAll('[data-qr-role="module"]'));
      const occupied = new Set<string>();
      const coords: Array<{ node: Element; x: number; y: number; sx: number; sy: number }> = [];
      for (const node of nodes) {
        const mx = parseNumberAttr(node, 'data-qr-x');
        const my = parseNumberAttr(node, 'data-qr-y');
        const sx = parseNumberAttr(node, 'data-qr-sx') ?? parseNumberAttr(node, 'x') ?? 0;
        const sy = parseNumberAttr(node, 'data-qr-sy') ?? parseNumberAttr(node, 'y') ?? 0;
        if (mx === null || my === null) continue;
        occupied.add(`${mx},${my}`);
        coords.push({ node, x: mx, y: my, sx, sy });
      }

      for (const { node, x, y, sx, sy } of coords) {
        const n = occupied.has(`${x},${y - 1}`);
        const s = occupied.has(`${x},${y + 1}`);
        const w = occupied.has(`${x - 1},${y}`);
        const e = occupied.has(`${x + 1},${y}`);

        const roundTL = !n && !w;
        const roundTR = !n && !e;
        const roundBR = !s && !e;
        const roundBL = !s && !w;

        // If already a path (e.g., repeated stylize), keep it and update `d`.
        let p: SVGPathElement | null =
          node.tagName.toLowerCase() === 'path' ? (node as SVGPathElement) : null;

        if (!p) {
          p = doc.createElementNS(SVG_NS, 'path');
          const id = node.getAttribute('id');
          const cls = node.getAttribute('class');
          if (id) p.setAttribute('id', id);
          if (cls) p.setAttribute('class', cls);
          for (let i = 0; i < node.attributes.length; i++) {
            const a = node.attributes[i];
            if (a.name.startsWith('data-')) p.setAttribute(a.name, a.value);
          }
          node.parentNode?.replaceChild(p, node);
        }

        p.setAttribute('d', moduleFluidPathD(sx, sy, r, roundTL, roundTR, roundBR, roundBL));
      }
    }

    // Center logo: this is intentionally opt-in; if enabled, it is applied last
    // because it may remove modules inside the cutout region.
    if (opts.logo && meta) {
      const href = safeHref(opts.logo.href);
      if (href) {
        const sizeRatio = clamp(opts.logo.sizeRatio ?? 0.22, 0.05, 0.45);
        const paddingRatio = clamp(opts.logo.paddingRatio ?? 0.03, 0, 0.2);
        const cutoutSize = meta.contentW * sizeRatio;
        const pad = meta.contentW * paddingRatio;
        const box = cutoutSize + pad * 2;
        const x = meta.contentX + (meta.contentW - box) / 2;
        const y = meta.contentY + (meta.contentH - box) / 2;
        const cx = x + box / 2;
        const cy = y + box / 2;

        const cutoutShape = opts.logo.shape ?? 'rounded';
        const rr = clamp(opts.logo.cornerRadius ?? 0.6, 0, box / 2);
        const inRoundedSquare = (px: number, py: number) => {
          const dx = Math.abs(px - cx);
          const dy = Math.abs(py - cy);
          const half = box / 2;
          if (dx <= half - rr && dy <= half) return true;
          if (dy <= half - rr && dx <= half) return true;
          const qx = dx - (half - rr);
          const qy = dy - (half - rr);
          return qx * qx + qy * qy <= rr * rr;
        };

        const shouldCut = (sx: number, sy: number) => {
          const px = sx + 0.5;
          const py = sy + 0.5;
          if (cutoutShape === 'circle') {
            const r = box / 2;
            const dx = px - cx;
            const dy = py - cy;
            return dx * dx + dy * dy <= r * r;
          }
          if (cutoutShape === 'rounded') return inRoundedSquare(px, py);
          return sx >= x && sx < x + box && sy >= y && sy < y + box;
        };

        // Remove modules under the cutout.
        for (const node of Array.from(modulesGroup.querySelectorAll('[data-qr-role="module"]'))) {
          const sx = parseNumberAttr(node, 'data-qr-sx') ?? parseNumberAttr(node, 'x');
          const sy = parseNumberAttr(node, 'data-qr-sy') ?? parseNumberAttr(node, 'y');
          if (sx === null || sy === null) continue;
          if (shouldCut(sx, sy)) node.parentNode?.removeChild(node);
        }

        const logoGroup = ensureGroup(doc, svgEl, 'logo', modulesGroup);
        while (logoGroup.firstChild) logoGroup.removeChild(logoGroup.firstChild);

        const bgFill =
          opts.logo.backgroundColor === null
            ? null
            : sanitizeColor(opts.logo.backgroundColor) ||
              (opts.backgroundColor === null ? null : sanitizeColor(opts.backgroundColor)) ||
              '#fff';

        // Background behind the logo (helps scan reliability).
        if (bgFill) {
          if (cutoutShape === 'circle') {
            const c = doc.createElementNS(SVG_NS, 'circle');
            c.setAttribute('cx', String(cx));
            c.setAttribute('cy', String(cy));
            c.setAttribute('r', String(box / 2));
            c.setAttribute('fill', bgFill);
            logoGroup.appendChild(c);
          } else {
            const r = doc.createElementNS(SVG_NS, 'rect');
            r.setAttribute('x', String(x));
            r.setAttribute('y', String(y));
            r.setAttribute('width', String(box));
            r.setAttribute('height', String(box));
            if (cutoutShape === 'rounded') {
              r.setAttribute('rx', String(rr));
              r.setAttribute('ry', String(rr));
            }
            r.setAttribute('fill', bgFill);
            logoGroup.appendChild(r);
          }
        }

        const img = doc.createElementNS(SVG_NS, 'image');
        img.setAttribute('href', href);
        img.setAttribute('x', String(x + pad));
        img.setAttribute('y', String(y + pad));
        img.setAttribute('width', String(cutoutSize));
        img.setAttribute('height', String(cutoutSize));
        img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        logoGroup.appendChild(img);
      }
    }

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
}

export default { stylizeSvg };
