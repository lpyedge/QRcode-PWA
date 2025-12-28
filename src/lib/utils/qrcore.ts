import type { QrComputeOptions, QrMatrix, QrUint8ClampedArray } from './types';
import {
  QRCodeWriter,
  BarcodeFormat,
  EncodeHintType,
  BitMatrix,
  QRCodeReader,
  BinaryBitmap,
  HybridBinarizer,
  GlobalHistogramBinarizer,
  RGBLuminanceSource,
  DecodeHintType,
  NotFoundException,
  ChecksumException,
  FormatException,
  ResultMetadataType,
} from '@zxing/library';
import type { Result } from '@zxing/library';
import { debug } from './debug';
import { getTranslations } from '$lib/i18n';

// -------------------------
// Hints
// -------------------------
const baseHints: Map<any, any> = new Map();
baseHints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
baseHints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');

const harderHints: Map<any, any> = new Map(baseHints);
harderHints.set(DecodeHintType.TRY_HARDER, true);

// -------------------------
// Luminance buffer pools
// -------------------------
// 普通（图片/一次性）
let lumBuf = new Uint8ClampedArray(0);
// 视频专用（高频）
let videoLumBuf = new Uint8ClampedArray(0);

// 超大图不缓存，避免常驻内存
// 例如 2048*2048 = 4,194,304 (~4MB luminance)
const MAX_CACHED_PIXELS = 2048 * 2048;

function ensureLumBuffer(kind: 'normal' | 'video', needed: number): Uint8ClampedArray {
  if (needed <= 0) return new Uint8ClampedArray(0);

  // 超大图：不走池，直接 new，让 GC 回收（移动端友好）
  if (needed > MAX_CACHED_PIXELS) {
    debug('lum: allocate uncached (too large)', { kind, needed });
    return new Uint8ClampedArray(needed);
  }

  let buf = kind === 'video' ? videoLumBuf : lumBuf;
  if (buf.length < needed) {
    // 只增不减，减少频繁扩容
    // 可以扩到 1.25x，降低后续扩容次数
    const next = Math.max(needed, Math.floor(buf.length * 1.25) || needed);
    buf = new Uint8ClampedArray(next);
    if (kind === 'video') videoLumBuf = buf;
    else lumBuf = buf;
    debug('lum: grow pool', { kind, size: next, needed });
  }
  return buf;
}

function maybeShrinkVideoPool() {
  // 可选：在你 stopVideoScan 或页面空闲时调用
  // 这里不自动 shrink，避免抖动；需要你主动触发即可
  // videoLumBuf = new Uint8ClampedArray(0);
}

export function releaseVideoLumPool() {
  videoLumBuf = new Uint8ClampedArray(0);
  debug('lum: release video pool');
}

// -------------------------
// QR matrix generation (unchanged)
// -------------------------
export async function generateQrMatrix(options: QrComputeOptions): Promise<QrMatrix> {
  const writer = new QRCodeWriter();

  const hints: Map<EncodeHintType, any> = new Map();
  hints.set(EncodeHintType.CHARACTER_SET, 'UTF-8');
  hints.set(EncodeHintType.MARGIN, 0);
  if (options.errorCorrection) {
    hints.set(EncodeHintType.ERROR_CORRECTION, options.errorCorrection);
  }

  const trySizes = [1, 512];
  let matrix: BitMatrix | null = null;
  let lastErr: unknown = null;

  for (const s of trySizes) {
    try {
      matrix = writer.encode(options.content, BarcodeFormat.QR_CODE, s, s, hints);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!matrix) throw lastErr ?? new Error('Failed to generate QR BitMatrix');

  const width = matrix.getWidth();
  const height = matrix.getHeight();
  const result: QrMatrix = new Array(height);

  for (let y = 0; y < height; y++) {
    const row: number[] = new Array(width);
    for (let x = 0; x < width; x++) row[x] = matrix.get(x, y) ? 1 : 0;
    result[y] = row;
  }

  const isValidQrModuleSize = (n: number) => n >= 21 && n <= 177 && (n - 21) % 4 === 0;
  if (width !== height || !isValidQrModuleSize(width)) {
    const i18n = getTranslations();
    const tpl = i18n.utils?.qrcore?.unexpectedMatrixSize || `Unexpected QR matrix size (${width}x${height}). Not a valid QR module grid.`;
    throw new Error(tpl.replace('{w}', String(width)).replace('{h}', String(height)));
  }
  return result;
}

// -------------------------
// Core decode helpers
// -------------------------
type AttemptLabel = 'base' | 'try_harder';
type DecodeOut = {
  text: string;
  rawBytes: Uint8Array | null;
  metadata: Map<ResultMetadataType, any> | null;
  rawResult: Result;
};

function attemptDecode(luminances: Uint8ClampedArray, w: number, h: number, hints: Map<DecodeHintType, any>, label: AttemptLabel): DecodeOut {
  // 每次 new reader，避免状态污染（视频高频也稳定）
  const reader = new QRCodeReader();
  // RGBLuminanceSource 接受 Uint8ClampedArray | Int32Array，但 TS 類型定義可能不完整
  // 回退使用 any 標記此 ZXing 外部函式庫介面
  const source = new RGBLuminanceSource(luminances as any, w, h);

  const tryDecode = (binarizer: GlobalHistogramBinarizer | HybridBinarizer) => {
    const result: Result = reader.decode(new BinaryBitmap(binarizer), hints);
    const md = result.getResultMetadata?.() as Map<ResultMetadataType, any> | undefined;
    return {
      text: result.getText?.() ?? '',
      rawBytes: result.getRawBytes?.() ?? null,
      metadata: md ?? null,
      rawResult: result,
    };
  };

  try {
    debug(`decode attempt (${label}) -> GlobalHistogram`, { w, h });
    return tryDecode(new GlobalHistogramBinarizer(source));
  } catch (e: any) {
    const ex = e as unknown;
    if (e instanceof NotFoundException || e instanceof ChecksumException || e instanceof FormatException) {
      debug(`decode attempt (${label}) -> Hybrid fallback`, { w, h, err: e?.name ?? e?.message });
      return tryDecode(new HybridBinarizer(source));
    }
    throw ex;
  }
}

// -------------------------
// RGBA -> luminance (integer path, alpha composited over white)
// -------------------------
function rgbaToLuminanceInto(
  rgba: QrUint8ClampedArray,
  out: Uint8ClampedArray,
  pixelCount: number
) {
  // 权重近似 BT.709：Y ≈ (54*R + 183*G + 19*B + 128)>>8
  // alpha 合成（背景白）：Y = (Y*a + 255*(255-a))>>8
  for (let p = 0, j = 0; j < pixelCount; p += 4, j++) {
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const a = rgba[p + 3]; // 0..255

    // 先算不考虑 alpha 的亮度
    let y = (r * 54 + g * 183 + b * 19 + 128) >> 8;

    if (a === 255) {
      out[j] = y;
    } else if (a === 0) {
      out[j] = 255;
    } else {
      out[j] = (y * a + 255 * (255 - a) + 128) >> 8;
    }
  }
}

function isExpectedZxingFailure(e: any) {
  return (
    e instanceof NotFoundException ||
    e instanceof ChecksumException ||
    e instanceof FormatException ||
    /NotFound/i.test(e?.name ?? '') ||
    /Checksum/i.test(e?.name ?? '') ||
    /Format/i.test(e?.name ?? '') ||
    /not found/i.test(e?.message ?? '') ||
    /checksum/i.test(e?.message ?? '') ||
    /format/i.test(e?.message ?? '')
  );
}

// -------------------------
// Public decode APIs
// -------------------------

/**
 * 通用：图片/一次性解码使用（走 normal pool）
 */
export function decodeQrFromUint8ClampedArray(rgba: QrUint8ClampedArray, w: number, h: number) {
  if (!rgba || typeof rgba.length !== 'number' || rgba.length !== w * h * 4) {
    const i18n = getTranslations();
    const tpl = i18n.utils?.qrcore?.rgbaLengthMismatch || `RGBA length mismatch: got ${rgba?.length ?? 'undefined'}, expected ${w * h * 4} (${w}x${h})`;
    const got = String(rgba?.length ?? 'undefined');
    const expected = String(w * h * 4);
    throw new Error(tpl.replace('{got}', got).replace('{expected}', expected).replace('{w}', String(w)).replace('{h}', String(h)));
  }

  const pixelCount = w * h;
  const buf = ensureLumBuffer('normal', pixelCount);
  const lum = buf.subarray(0, pixelCount);

  rgbaToLuminanceInto(rgba, lum, pixelCount);

  try {
    return attemptDecode(lum, w, h, baseHints, 'base');
  } catch (e1: any) {
    if (!isExpectedZxingFailure(e1)) throw e1;
    debug('base decode failed; retry with TRY_HARDER', { w, h, err: e1?.name ?? e1?.message });
    return attemptDecode(lum, w, h, harderHints, 'try_harder');
  }
}

/**
 * 视频专用：高频调用（走 video pool，显著降低 GC）
 * - 逻辑与 decodeQrFromUint8ClampedArray 完全一致
 * - 只是 luminance buffer 从 video pool 取
 */
export function decodeQrFromVideoRgba(rgba: QrUint8ClampedArray, w: number, h: number) {
  if (!rgba || typeof rgba.length !== 'number' || rgba.length !== w * h * 4) {
    const i18n = getTranslations();
    const tpl = i18n.utils?.qrcore?.rgbaLengthMismatch || `RGBA length mismatch: got ${rgba?.length ?? 'undefined'}, expected ${w * h * 4} (${w}x${h})`;
    const got = String(rgba?.length ?? 'undefined');
    const expected = String(w * h * 4);
    throw new Error(tpl.replace('{got}', got).replace('{expected}', expected).replace('{w}', String(w)).replace('{h}', String(h)));
  }

  const pixelCount = w * h;
  const buf = ensureLumBuffer('video', pixelCount);
  const lum = buf.subarray(0, pixelCount);

  rgbaToLuminanceInto(rgba, lum, pixelCount);

  try {
    return attemptDecode(lum, w, h, baseHints, 'base');
  } catch (e1: any) {
    if (!isExpectedZxingFailure(e1)) throw e1;
    debug('video base failed; retry TRY_HARDER', { w, h, err: e1?.name ?? e1?.message });
    return attemptDecode(lum, w, h, harderHints, 'try_harder');
  }
}

export default {
  generateQrMatrix,
  decodeQrFromUint8ClampedArray,
  decodeQrFromVideoRgba,
  releaseVideoLumPool,
};
