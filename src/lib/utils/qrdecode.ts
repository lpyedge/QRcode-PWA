/**
 * QR Code Decoder with Video Scanning
 * 
 * Multi-strategy QR decoder supporting various input sources:
 * - Canvas and ImageBitmap
 * - HTMLImageElement and HTMLVideoElement
 * - File objects (via FileReader)
 * - Continuous video scanning with adaptive framerate
 * 
 * Supports both native BarcodeDetector API (when available) and ZXing fallback.
 * Includes intelligent ROI tracking for efficient video scanning.
 * 
 * Video Scanning Modes:
 * - Search mode: Low-frequency full-frame scanning to find QR codes
 * - Track mode: High-frequency ROI scanning for smooth tracking
 * - Rescue scans: Periodic full-frame fallback to prevent loss
 * 
 * @example
 * ```ts
 * const decoder = new QRDecoder();
 * 
 * // Single image decode
 * const result = await decoder.decodeFromImage(imgElement);
 * 
 * // Video scanning
 * const handle = decoder.scanVideo(videoElement, {
 *   fpsSearch: 12,
 *   fpsTrack: 24,
 *   onResult: (res) => console.log(res.text)
 * });
 * ```
 */

import type { QrUint8ClampedArray, DecodeOptions, DetectedQR, DecodeResult } from './types';
import { getTranslations } from '$lib/i18n';
import {
  decodeQrFromUint8ClampedArray,
  decodeQrFromVideoRgba,
  releaseVideoLumPool,
} from './qrcore';
import { NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import { debug } from './debug';

type BarcodeDetectorLike = { detect(source: ImageBitmapSource): Promise<DetectedQR[]> };
type DrawSource = CanvasImageSource;

type CanvasEntry = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };
type TargetKind = 'shared' | 'crop';

export type VideoScanMode = 'search' | 'track';

export type VideoScanOptions = {
  /** search 阶段解码频率（低频省资源） */
  fpsSearch?: number; // default 12
  /** track 阶段解码频率（高频更跟手，但ROI小） */
  fpsTrack?: number; // default 24

  /** search 阶段最大边（通常 480/640 就够） */
  maxEdgeSearch?: number; // default 640
  /** 兜底全尺寸最大边（低频用，成功率更高） */
  maxEdgeFull?: number; // default 1280

  /** track 失败多少次后回到 search */
  trackFailThreshold?: number; // default 8

  /** 每隔多久做一次“兜底 full-frame”（ms）。0 表示禁用 */
  rescueEveryMs?: number; // default 1200

  /** ROI padding / cropScale 仍沿用你 DecodeOptions 的语义 */
  decode?: DecodeOptions;

  /** 每次成功解码回调（你业务里拿到 text 后可直接停止） */
  onResult: (res: DecodeResult & { frameTs: number; mode: VideoScanMode }) => void;

  /** 错误回调 */
  onError?: (error: unknown) => void;

  /** 每次尝试（可选，用于你调试/埋点） */
  onAttempt?: (info: { mode: VideoScanMode; frameTs: number }) => void;

  /** 是否自动去重（同 text 连续 N ms 内只回调一次） */
  dedupeMs?: number; // default 800
};

type VideoScanHandle = {
  stop: () => void;
  isRunning: () => boolean;
  getMode: () => VideoScanMode;
};

type DetectOutcome =
  | { supported: false; threw?: unknown; detections: null }
  | { supported: true; threw?: unknown; detections: DetectedQR[] };

export class QRDecoder {
  // Canvas pools (memory for speed)
  private sharedPool = new Map<string, CanvasEntry>();
  private cropPool = new Map<string, CanvasEntry>();
  private static readonly POOL_MAX = 12;

  private _barcodeDetectorSupported: boolean | null = null;
  private _barcodeDetectorInstance: BarcodeDetectorLike | null = null;
  private _bdInitPromise: Promise<boolean> | null = null;

  // --------------------------
  // BarcodeDetector
  // --------------------------
  private async ensureBarcodeDetector(): Promise<boolean> {
    if (this._barcodeDetectorSupported !== null) return this._barcodeDetectorSupported;
    if (this._bdInitPromise) return this._bdInitPromise;

    this._bdInitPromise = (async () => {
      try {
        const globalObj = (typeof window !== 'undefined' ? window : globalThis) as unknown;
        if (
          typeof globalObj !== 'object' ||
          !globalObj ||
          !('BarcodeDetector' in (globalObj as any))
        ) {
          this._barcodeDetectorSupported = false;
          return false;
        }

        const BarcodeDetectorCtor = (globalObj as any).BarcodeDetector;
        const getSupported = typeof BarcodeDetectorCtor?.getSupportedFormats === 'function';
        if (getSupported) {
          const formats = await BarcodeDetectorCtor.getSupportedFormats();
          if (!Array.isArray(formats) || !formats.includes('qr_code')) {
            this._barcodeDetectorSupported = false;
            this._barcodeDetectorInstance = null;
            return false;
          }
        }

        try {
          this._barcodeDetectorInstance = new BarcodeDetectorCtor({ formats: ['qr_code'] });
          this._barcodeDetectorSupported = true;
        } catch {
          this._barcodeDetectorSupported = false;
          this._barcodeDetectorInstance = null;
        }
      } catch {
        this._barcodeDetectorSupported = false;
        this._barcodeDetectorInstance = null;
      }

      if (!this._barcodeDetectorSupported) this._barcodeDetectorInstance = null;
      debug('BarcodeDetector supported?', this._barcodeDetectorSupported);
      return this._barcodeDetectorSupported;
    })();

    try {
      return await this._bdInitPromise;
    } finally {
      this._bdInitPromise = null;
    }
  }

  private async detectWithBarcodeDetector(source: ImageBitmapSource): Promise<DetectOutcome> {
    const supported = await this.ensureBarcodeDetector();
    if (!supported) {
      debug('BD unsupported');
      return { supported: false, detections: null };
    }

    const inst = this._barcodeDetectorInstance;
    if (!inst) {
      debug('BD supported but instance missing');
      return { supported: true, detections: [] };
    }

    try {
      const detections = (await inst.detect(source)) as DetectedQR[];
      if (!detections || detections.length === 0) debug('BD miss (0 result)');
      else debug('BD hit', detections.length);
      return { supported: true, detections };
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? (e as { message: unknown }).message : e;
      debug('BD threw', message);
      return { supported: true, threw: e, detections: [] };
    }
  }

  // --------------------------
  // Canvas pool helpers
  // --------------------------
  private getPool(kind: TargetKind) {
    return kind === 'shared' ? this.sharedPool : this.cropPool;
  }

  private ensurePooledCanvas(kind: TargetKind, width: number, height: number): CanvasEntry {
    const w = Math.max(1, width | 0);
    const h = Math.max(1, height | 0);
    const key = `${w}x${h}`;

    const pool = this.getPool(kind);
    const existing = pool.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx =
      (canvas.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings) ||
        canvas.getContext('2d')) as CanvasRenderingContext2D | null;

    if (!ctx) {
      const i18n = getTranslations();
      throw new Error(i18n.utils?.errors?.context2DUnavailable || '2D context not available');
    }

    const entry: CanvasEntry = { canvas, ctx };
    pool.set(key, entry);

    // Simple trim (FIFO)
    if (pool.size > QRDecoder.POOL_MAX) {
      const firstKey = pool.keys().next().value;
      if (firstKey) pool.delete(firstKey);
    }

    debug(`pool create ${kind}`, key, 'poolSize=', pool.size);
    return entry;
  }

  // --------------------------
  // ROI / size helpers
  // --------------------------
  private isRelativeRoi(roi: { x: number; y: number; width: number; height: number }) {
    return (
      roi.x >= 0 && roi.x <= 1 &&
      roi.y >= 0 && roi.y <= 1 &&
      roi.width > 0 && roi.width <= 1 &&
      roi.height > 0 && roi.height <= 1
    );
  }

  private computeRoi(
    roi: { x: number; y: number; width: number; height: number } | undefined,
    w: number,
    h: number
  ) {
    let sx = 0;
    let sy = 0;
    let sWidth = w;
    let sHeight = h;

    if (roi) {
      if (this.isRelativeRoi(roi)) {
        sx = Math.round(roi.x * w);
        sy = Math.round(roi.y * h);
        sWidth = Math.round(roi.width * w);
        sHeight = Math.round(roi.height * h);
      } else {
        sx = Math.round(roi.x);
        sy = Math.round(roi.y);
        sWidth = Math.round(roi.width);
        sHeight = Math.round(roi.height);
      }

      if (sx < 0) sx = 0;
      if (sy < 0) sy = 0;
      if (sWidth <= 0) sWidth = w - sx;
      if (sHeight <= 0) sHeight = h - sy;
      if (sx + sWidth > w) sWidth = w - sx;
      if (sy + sHeight > h) sHeight = h - sy;
    }

    return { sx, sy, sWidth, sHeight };
  }

  private clampSmallRoi(
    sx: number,
    sy: number,
    sWidth: number,
    sHeight: number,
    w: number,
    h: number,
    minSize = 32
  ) {
    let nx = sx;
    let ny = sy;
    let nw = sWidth;
    let nh = sHeight;

    if (nw < minSize) {
      const diff = minSize - nw;
      nx = Math.max(0, nx - Math.floor(diff / 2));
      nw = Math.min(w - nx, minSize);
    }
    if (nh < minSize) {
      const diff = minSize - nh;
      ny = Math.max(0, ny - Math.floor(diff / 2));
      nh = Math.min(h - ny, minSize);
    }

    if (nx + nw > w) nw = w - nx;
    if (ny + nh > h) nh = h - ny;

    return { sx: nx, sy: ny, sWidth: nw, sHeight: nh };
  }

  private clampSize(w: number, h: number, maxEdge = 1280) {
    const m = Math.max(w, h);
    if (m <= maxEdge) return { w, h };
    const s = maxEdge / m;
    return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
  }

  // ROI cropScale adaptive
  private adaptCropScale(base: number, roiW: number, roiH: number, srcW: number, srcH: number) {
    const b = Math.max(0.25, Math.min(2, base));
    const area = Math.max(1, roiW * roiH);
    const srcArea = Math.max(1, srcW * srcH);
    const ratio = area / srcArea;

    let s = b;
    if (ratio < 0.10) s = Math.min(2, b * 1.5);
    else if (ratio > 0.60) s = Math.max(0.5, b * 0.8);
    return s;
  }

  // Normalize canvas state
  private prepareCanvasForDraw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    try {
      if (typeof ctx.setTransform === 'function') ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // `filter` and shadow* may not be present on all TS lib.dom versions; guard with try
      try { (ctx as unknown as { filter: string }).filter = 'none'; } catch { /* optional property */ }
      try { (ctx as unknown as { shadowColor: string }).shadowColor = 'transparent'; } catch { /* optional property */ }
      try { (ctx as unknown as { shadowBlur: number }).shadowBlur = 0; } catch { /* optional property */ }
      try { (ctx as unknown as { shadowOffsetX: number }).shadowOffsetX = 0; } catch { /* optional property */ }
      try { (ctx as unknown as { shadowOffsetY: number }).shadowOffsetY = 0; } catch { /* optional property */ }
      try { ctx.imageSmoothingEnabled = false; } catch { /* optional property */ }
      if (typeof ctx.clearRect === 'function') ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      if (typeof ctx.fillRect === 'function') ctx.fillRect(0, 0, canvas.width, canvas.height);
    } catch { /* canvas setup failed, continue anyway */ }
  }

  private getImageDataFromCtx(ctx: CanvasRenderingContext2D, w: number, h: number) {
    try {
      return ctx.getImageData(0, 0, w, h);
    } catch {
      const i18n = getTranslations();
      throw new Error(i18n.utils?.errors?.imageDataAccess || 'Unable to access image data (canvas may be tainted by cross-origin content)');
    }
  }

  /**
   * Draw/copy a source rect into pooled canvas and return rgba view.
   * Video 场景下 self-copy 最危险：一旦 source===target，宁可直接 bypass（避免被 clear 成白图）
   */
  private getRgbaFromSource(
    source: DrawSource,
    sx: number, sy: number, sWidth: number, sHeight: number,
    targetW: number, targetH: number,
    targetKind: TargetKind,
    srcW: number,
    srcH: number,
  ) {
    sx = Math.max(0, Math.round(sx));
    sy = Math.max(0, Math.round(sy));
    sWidth = Math.max(1, Math.round(sWidth));
    sHeight = Math.max(1, Math.round(sHeight));
    targetW = Math.max(1, Math.round(targetW));
    targetH = Math.max(1, Math.round(targetH));

    // final clamp
    sx = Math.min(sx, Math.max(0, srcW - 1));
    sy = Math.min(sy, Math.max(0, srcH - 1));
    sWidth = Math.min(sWidth, srcW - sx);
    sHeight = Math.min(sHeight, srcH - sy);

    const { canvas, ctx } = this.ensurePooledCanvas(targetKind, targetW, targetH);

    // 更鲁棒：只要 source 就是 target canvas，就 bypass（不要清空自己再画自己）
    const isSelfCanvas = targetKind === 'shared' && source instanceof HTMLCanvasElement && source === canvas;

    if (!isSelfCanvas) {
      this.prepareCanvasForDraw(ctx, canvas);
      try { ctx.imageSmoothingEnabled = false; } catch { /* optional property */ }
      ctx.drawImage(source as CanvasImageSource, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);

      if (debug.enabled()) {
        try { ctx.getImageData(0, 0, 1, 1); } catch { /* tainted canvas check */ }
      }
    } else {
      debug('self-canvas bypass (shared)');
      try {
        if (typeof ctx.setTransform === 'function') ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        (ctx as unknown as { filter: string }).filter = 'none';
      } catch { /* canvas state reset failed */ }
    }

    const imageData = this.getImageDataFromCtx(ctx, canvas.width, canvas.height);
    return {
      rgba: imageData.data as unknown as QrUint8ClampedArray,
      w: canvas.width,
      h: canvas.height,
      canvas,
      ctx,
    };
  }

  // --------------------------
  // Public API
  // --------------------------
  public dispose(): void {
    this.sharedPool.clear();
    this.cropPool.clear();
    this._barcodeDetectorInstance = null;
    this._barcodeDetectorSupported = null;
    this._bdInitPromise = null;

    // Release video luminance pool
    try { releaseVideoLumPool(); } catch { /* pool may already be released */ }
    
    debug('QRDecoder disposed', { sharedPoolSize: 0, cropPoolSize: 0 });
  }

  /** 一次性：解码 canvas 当前帧 */
  public async decodeFromCanvas(canvas: HTMLCanvasElement, options?: DecodeOptions): Promise<DecodeResult> {
    return this.decodeFromSource(canvas, canvas.width, canvas.height, options);
  }

  /** 一次性：解码 image */
  public async decodeFromImage(img: HTMLImageElement, options?: DecodeOptions): Promise<DecodeResult> {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) {
      const i18n = getTranslations();
      throw new Error(i18n.utils?.errors?.imageNoSize || 'Image has no intrinsic size');
    }
    return this.decodeFromSource(img, w, h, options);
  }

  /** 一次性：解码 video 当前帧（保留；实时扫码请用 startVideoScan） */
  public async decodeFromVideo(video: HTMLVideoElement, options?: DecodeOptions): Promise<DecodeResult> {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      const i18n = getTranslations();
      throw new Error(i18n.utils?.errors?.videoNoFrame || 'Video has no frame size yet — wait for video to be ready');
    }
    return this.decodeFromSource(video, w, h, options);
  }

  public async decodeFromElement(
    el: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    options?: DecodeOptions
  ): Promise<DecodeResult> {
    if (el instanceof HTMLCanvasElement) return this.decodeFromCanvas(el, options);
    if (el instanceof HTMLImageElement) return this.decodeFromImage(el, options);
    if (el instanceof HTMLVideoElement) return this.decodeFromVideo(el, options);
    const i18n = getTranslations();
    throw new Error(i18n.utils?.errors?.unsupportedElement || 'Unsupported element type');
  }

  public async decodeFromFile(file: File, options?: DecodeOptions): Promise<DecodeResult> {
    if (!file.type.startsWith('image/')) {
      const i18n = getTranslations();
      throw new Error(i18n.utils?.errors?.fileNotImage || 'File is not an image');
    }

    if (typeof createImageBitmap === 'function') {
      try {
        const bmp = await createImageBitmap(file);
        try {
          return await this.decodeFromSource(bmp, bmp.width, bmp.height, options);
        } finally {
          try { (bmp as unknown as { close?: () => void }).close?.(); } catch { /* close may not exist */ }
        }
      } catch {
        // fallback below
      }
    }

    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => {
          const i18n = getTranslations();
          reject(new Error(i18n.utils?.errors?.failedLoadImage || 'Failed to load image file'));
        };
      });
      // decode 完成后再 revoke 更明确
      const res = await this.decodeFromImage(img, options);
      return res;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  public async decodeFromFileInput(input: HTMLInputElement, options?: DecodeOptions): Promise<DecodeResult> {
    const file = input.files?.[0];
    if (!file) {
      const i18n = getTranslations();
      throw new Error(i18n.utils?.errors?.noFileProvided || 'No file provided');
    }
    return this.decodeFromFile(file, options);
  }

  // --------------------------
  // 新增：视频流实时扫码（最优实践）
  // --------------------------
  public startVideoScan(video: HTMLVideoElement, opts: VideoScanOptions): VideoScanHandle {
    const fpsSearch = Math.max(1, opts.fpsSearch ?? 12);
    const fpsTrack = Math.max(1, opts.fpsTrack ?? 24);
    const maxEdgeSearch = Math.max(64, opts.maxEdgeSearch ?? 640);
    const maxEdgeFull = Math.max(maxEdgeSearch, opts.maxEdgeFull ?? 1280);
    const trackFailThreshold = Math.max(1, opts.trackFailThreshold ?? 8);
    const rescueEveryMs = Math.max(0, opts.rescueEveryMs ?? 1200);
    const dedupeMs = Math.max(0, opts.dedupeMs ?? 800);
    const decodeOpt = opts.decode;

    let running = true;
    let mode: VideoScanMode = 'search';

    let lastAttemptTs = 0;
    let lastRescueTs = 0;

    let lastBox: DetectedQR['boundingBox'] | null = null;
    let trackFailCount = 0;

    let lastText: string | null = null;
    let lastTextTs = 0;

    const getFrameSize = () => ({ w: video.videoWidth || 0, h: video.videoHeight || 0 });

    const shouldAttempt = (frameTs: number) => {
      const fps = mode === 'search' ? fpsSearch : fpsTrack;
      const minDt = 1000 / fps;
      return (frameTs - lastAttemptTs) >= minDt;
    };

    const emitResult = (res: DecodeResult, frameTs: number) => {
      const text = (res.ok ? res.text : null) as string | null;
      if (res.ok && text) {
        if (dedupeMs > 0 && lastText === text && (frameTs - lastTextTs) < dedupeMs) {
          debug('video dedupe hit', { text, dt: frameTs - lastTextTs });
          return;
        }
        lastText = text;
        lastTextTs = frameTs;
      }
      opts.onResult({ ...res, frameTs, mode });
    };

    const attemptROI = async (frameTs: number, box: any) => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return null;

      const padRatio = Math.max(0, Math.min(0.5, decodeOpt?.padRatio ?? 0.1));
      const baseCropScale = Math.max(0.25, Math.min(2, decodeOpt?.cropScale ?? 1));
      const padMin = Math.max(0, decodeOpt?.padMin ?? 4);
      const padMax = Math.max(padMin, decodeOpt?.padMax ?? 40);

      const sx0 = Math.floor(box.x);
      const sy0 = Math.floor(box.y);
      const sWidth0 = Math.floor(box.width);
      const sHeight0 = Math.floor(box.height);

      const padX = Math.max(padMin, Math.min(padMax, Math.round(sWidth0 * padRatio)));
      const padY = Math.max(padMin, Math.min(padMax, Math.round(sHeight0 * padRatio)));

      const sx = Math.max(0, sx0 - padX);
      const sy = Math.max(0, sy0 - padY);
      const sWidth = Math.min(w - sx, sWidth0 + padX * 2);
      const sHeight = Math.min(h - sy, sHeight0 + padY * 2);
      const clamped = this.clampSmallRoi(sx, sy, sWidth, sHeight, w, h);

      const cropScale = this.adaptCropScale(baseCropScale, clamped.sWidth, clamped.sHeight, w, h);
      const targetW0 = Math.max(1, Math.round(clamped.sWidth * cropScale));
      const targetH0 = Math.max(1, Math.round(clamped.sHeight * cropScale));
      const target = this.clampSize(targetW0, targetH0, maxEdgeFull);

      debug.group('video ROI attempt', { mode, frameTs, box, roi: clamped, cropScale, target });
      try {
        const { rgba, w: rw, h: rh } = this.getRgbaFromSource(
          video,
          clamped.sx, clamped.sy, clamped.sWidth, clamped.sHeight,
          target.w, target.h,
          'crop',
          w, h
        );

        // ✅ 视频：走视频专用 luminance pool（大幅降 GC）
        const out = this.performDecodeVideo(rgba, rw, rh);

        debug('video ROI decode ->', out.ok ? 'OK' : out.reason);
        return out;
      } finally {
        debug.groupEnd();
      }
    };

    const attemptSearch = async (frameTs: number) => {
      const { w, h } = getFrameSize();
      if (!w || !h) return null;

      debug.group('video SEARCH full-frame', { frameTs, w, h, maxEdgeSearch });
      try {
        return await this.tryFullFrame(video, w, h, maxEdgeSearch, true /* isVideo */);
      } finally {
        debug.groupEnd();
      }
    };

    const attemptRescueFull = async (frameTs: number) => {
      const { w, h } = getFrameSize();
      if (!w || !h) return null;

      debug.group('video RESCUE full-frame', { frameTs, w, h, maxEdgeFull });
      try {
        return await this.tryFullFrame(video, w, h, maxEdgeFull, true /* isVideo */);
      } finally {
        debug.groupEnd();
      }
    };

    const tick = async (frameTs: number) => {
      if (!running) return;

      const { w, h } = getFrameSize();
      if (!w || !h) {
        scheduleNext();
        return;
      }

      if (!shouldAttempt(frameTs)) {
        scheduleNext();
        return;
      }
      lastAttemptTs = frameTs;
      opts.onAttempt?.({ mode, frameTs });

      debug.group('video tick', { mode, frameTs, w, h, lastBox, trackFailCount });

      try {
        // 1) BarcodeDetector 优先（能 rawValue 就直接成功）
        const bd = await this.detectWithBarcodeDetector(video);
        if (bd.supported && bd.detections && bd.detections.length > 0) {
          const ordered = bd.detections.slice().sort((a, b) =>
            ((b.boundingBox?.width ?? 1) * (b.boundingBox?.height ?? 1)) -
            ((a.boundingBox?.width ?? 1) * (a.boundingBox?.height ?? 1))
          );

          for (const d of ordered) {
            if (typeof d.rawValue === 'string' && d.rawValue.length > 0) {
              lastBox = d.boundingBox ?? null;
              mode = 'track';
              trackFailCount = 0;
              debug('video BD rawValue hit');
              emitResult(
                { ok: true, text: d.rawValue, rawBytes: null, metadata: { boundingBox: d.boundingBox ?? null, cornerPoints: d.cornerPoints ?? null } },
                frameTs
              );
              return;
            }
          }

          if (ordered[0]?.boundingBox) lastBox = ordered[0].boundingBox;
        }

        // 2) track：优先 ROI
        if (mode === 'track' && lastBox) {
          const roiOut = await attemptROI(frameTs, lastBox);
          if (roiOut && roiOut.ok) {
            trackFailCount = 0;
            emitResult(roiOut, frameTs);
            return;
          } else {
            trackFailCount++;
            debug('video track fail', trackFailCount, roiOut?.reason);
            if (trackFailCount >= trackFailThreshold) {
              debug('video track -> search (threshold)');
              mode = 'search';
              trackFailCount = 0;
              lastBox = null;
            }
          }
        }

        // 3) search：低频 downsample full-frame
        if (mode === 'search') {
          const out = await attemptSearch(frameTs);
          if (out && out.ok) {
            mode = 'track';
            trackFailCount = 0;
            emitResult(out, frameTs);
            return;
          }
        }

        // 4) rescue：低频 full-frame（更大 maxEdgeFull）
        if (rescueEveryMs > 0 && (frameTs - lastRescueTs) >= rescueEveryMs) {
          lastRescueTs = frameTs;
          const rescue = await attemptRescueFull(frameTs);
          if (rescue && rescue.ok) {
            mode = 'track';
            trackFailCount = 0;
            emitResult(rescue, frameTs);
            return;
          }
        }
      } catch (e: unknown) {
        const message = e && typeof e === 'object' && 'message' in e ? (e as { message: unknown }).message : e;
        debug('video tick error', message);
        opts.onError?.(e);
      } finally {
        debug.groupEnd();
        scheduleNext();
      }
    };

    const scheduleNext = () => {
      if (!running) return;
      if (hasRequestVideoFrameCallback(video)) {
        video.requestVideoFrameCallback((now: number) => tick(now));
      } else {
        requestAnimationFrame((t) => tick(t));
      }
    };

type VideoWithRequestVideoFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback: (cb: (now: number) => void) => number;
};

function hasRequestVideoFrameCallback(video: HTMLVideoElement): video is VideoWithRequestVideoFrameCallback {
  return typeof (video as VideoWithRequestVideoFrameCallback).requestVideoFrameCallback === 'function';
}

    debug('startVideoScan', {
      fpsSearch, fpsTrack, maxEdgeSearch, maxEdgeFull,
      trackFailThreshold, rescueEveryMs, dedupeMs,
    });
    scheduleNext();

    return {
      stop: () => {
        if (!running) return;
        running = false;
        debug('stopVideoScan');

        // ✅ 非常重要：释放视频 luminance pool（避免常驻大内存）
        try { releaseVideoLumPool(); } catch { /* pool may already be released */ }
      },
      isRunning: () => running,
      getMode: () => mode,
    };
  }

  // --------------------------
  // Core decode (一次性入口)
  // --------------------------
  private async decodeFromSource(
    source: DrawSource,
    srcW: number,
    srcH: number,
    options?: DecodeOptions
  ): Promise<DecodeResult> {
    const padRatio = Math.max(0, Math.min(0.5, options?.padRatio ?? 0.1));
    const baseCropScale = Math.max(0.25, Math.min(2, options?.cropScale ?? 1));
    const padMin = Math.max(0, options?.padMin ?? 4);
    const padMax = Math.max(padMin, options?.padMax ?? 40);

    const MAX_EDGE = 1280;
    const FAST_EDGE = 640;

    debug('decodeFromSource', {
      srcW, srcH,
      padRatio, baseCropScale, padMin, padMax,
      hasBD: this._barcodeDetectorSupported,
      sourceType: source && typeof source === 'object' && 'constructor' in source ? source.constructor?.name : typeof source,
    });

    let cachedUnknown: DecodeResult | null = null;

    // BarcodeDetector + ROI
    const canDetect =
      source instanceof HTMLCanvasElement ||
      source instanceof HTMLVideoElement ||
      source instanceof HTMLImageElement ||
      (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap);

    if (canDetect) {
      const bd = await this.detectWithBarcodeDetector(source);
      const detections = bd.supported ? bd.detections : null;

      if (detections && detections.length > 0) {
        const ordered = detections.slice().sort((a, b) =>
          ((b.boundingBox?.width ?? 1) * (b.boundingBox?.height ?? 1)) -
          ((a.boundingBox?.width ?? 1) * (a.boundingBox?.height ?? 1))
        );

        // rawValue short-circuit
        for (const d of ordered) {
          const box = d?.boundingBox;
          if (typeof d.rawValue === 'string' && d.rawValue.length > 0) {
            debug('BD rawValue hit');
            return {
              ok: true,
              text: d.rawValue,
              rawBytes: null,
              metadata: { boundingBox: box ?? null, cornerPoints: d.cornerPoints ?? null },
            };
          }
        }

        // ROI attempts
        for (const d of ordered) {
          const box = d?.boundingBox;
          if (!box || typeof box.x !== 'number' || typeof box.y !== 'number' || typeof box.width !== 'number' || typeof box.height !== 'number') {
            continue;
          }

          const sx0 = Math.floor(box.x);
          const sy0 = Math.floor(box.y);
          const sWidth0 = Math.floor(box.width);
          const sHeight0 = Math.floor(box.height);

          const padX = Math.max(padMin, Math.min(padMax, Math.round(sWidth0 * padRatio)));
          const padY = Math.max(padMin, Math.min(padMax, Math.round(sHeight0 * padRatio)));

          const sx = Math.max(0, sx0 - padX);
          const sy = Math.max(0, sy0 - padY);
          const sWidth = Math.min(srcW - sx, sWidth0 + padX * 2);
          const sHeight = Math.min(srcH - sy, sHeight0 + padY * 2);

          const clamped = this.clampSmallRoi(sx, sy, sWidth, sHeight, srcW, srcH);
          const cropScale = this.adaptCropScale(baseCropScale, clamped.sWidth, clamped.sHeight, srcW, srcH);

          const targetW0 = Math.max(1, Math.round(clamped.sWidth * cropScale));
          const targetH0 = Math.max(1, Math.round(clamped.sHeight * cropScale));
          const clampedTarget = this.clampSize(targetW0, targetH0, MAX_EDGE);

          debug('ROI attempt', { box, padX, padY, roi: clamped, cropScale, target: clampedTarget });

          try {
            const { rgba, w: rw, h: rh } = this.getRgbaFromSource(
              source,
              clamped.sx, clamped.sy, clamped.sWidth, clamped.sHeight,
              clampedTarget.w, clampedTarget.h,
              'crop',
              srcW, srcH
            );

            // ✅ 一次性：仍走普通 decode（不占用 video pool）
            const out = this.performDecodeOnce(rgba, rw, rh);

            if (out.ok) {
              debug('ROI qrcore success');
              return {
                ok: true,
                text: out.text,
                rawBytes: out.rawBytes,
                metadata: { ...(out.metadata || {}), boundingBox: box, cornerPoints: d.cornerPoints ?? null },
              };
            }

            if (out.reason === 'unknown') {
              cachedUnknown = out;
              continue;
            }
          } catch (e: unknown) {
            const message = e && typeof e === 'object' && 'message' in e ? (e as { message: unknown }).message : e;
            debug('ROI attempt error (ignored)', message);
          }
        }
      }
    }

    // Full-frame fallback（分级降采样）
    // ✅ 修复：只有在确实会 downsample 时才做 FAST（否则小图会重复 decode）
    if (srcW > FAST_EDGE || srcH > FAST_EDGE) {
      try {
        const fast = await this.tryFullFrame(source, srcW, srcH, FAST_EDGE, false /* isVideo */);
        if (fast.ok) {
          debug('FAST full-frame success');
          return fast;
        }
      } catch (e: unknown) {
        const message = e && typeof e === 'object' && 'message' in e ? (e as { message: unknown }).message : e;
        debug('FAST full-frame error (ignored)', message);
      }
    }

    try {
      const full = await this.tryFullFrame(source, srcW, srcH, MAX_EDGE, false /* isVideo */);
      if (full.ok) return full;
      if (full.reason !== 'unknown') return full;
      return cachedUnknown ?? full;
    } catch (e) {
      return cachedUnknown ?? { ok: false, reason: 'unknown', error: e };
    }
  }

  private async tryFullFrame(
    source: DrawSource,
    srcW: number,
    srcH: number,
    maxEdge: number,
    isVideo: boolean
  ): Promise<DecodeResult> {
    let targetW = srcW;
    let targetH = srcH;
    if (srcW > maxEdge || srcH > maxEdge) {
      const scaled = this.clampSize(srcW, srcH, maxEdge);
      targetW = scaled.w;
      targetH = scaled.h;
    }

    debug('full-frame attempt', { maxEdge, srcW, srcH, targetW, targetH, isVideo });

    const { rgba, w: rw, h: rh } = this.getRgbaFromSource(
      source,
      0, 0, srcW, srcH,
      targetW, targetH,
      'shared',
      srcW, srcH
    );

    // ✅ 视频帧走 video decode；一次性走 once decode
    return isVideo ? this.performDecodeVideo(rgba, rw, rh) : this.performDecodeOnce(rgba, rw, rh);
  }

  // --------------------------
  // Decode adapters (关键：分别调用新版 qrcore)
  // --------------------------
  private performDecodeOnce(rgba: QrUint8ClampedArray, w: number, h: number): DecodeResult {
    try {
      const res = decodeQrFromUint8ClampedArray(rgba, w, h);
      return { ok: true, text: res.text, rawBytes: res.rawBytes ?? null, metadata: res.metadata ?? null };
    } catch (e: any) {
      return this.classifyDecodeError(e);
    }
  }

  private performDecodeVideo(rgba: QrUint8ClampedArray, w: number, h: number): DecodeResult {
    try {
      const res = decodeQrFromVideoRgba(rgba, w, h);
      return { ok: true, text: res.text, rawBytes: res.rawBytes ?? null, metadata: res.metadata ?? null };
    } catch (e: any) {
      return this.classifyDecodeError(e);
    }
  }

  private classifyDecodeError(e: any): DecodeResult {
    const name = e?.name ?? '';
    const msg = e?.message ?? '';

    if (e instanceof NotFoundException || /NotFound/i.test(name) || /not found/i.test(msg)) {
      return { ok: false, reason: 'not_found' };
    }
    if (e instanceof ChecksumException || /Checksum/i.test(name) || /checksum/i.test(msg)) {
      return { ok: false, reason: 'checksum' };
    }
    if (e instanceof FormatException || /Format/i.test(name) || /format/i.test(msg)) {
      return { ok: false, reason: 'format' };
    }

    debug('performDecode unknown error', name, msg, e);
    return { ok: false, reason: 'unknown', error: e };
  }
}
