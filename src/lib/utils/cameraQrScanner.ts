/**
 * QR Camera Scanner
 * 
 * High-level abstraction for video-based QR code scanning.
 * Manages camera lifecycle, device switching, zoom control, and continuous decode loops.
 * 
 * Key Features:
 * - Camera permission handling and device enumeration
 * - Automatic camera switching (front/back)
 * - Zoom control with capability detection
 * - Continuous scanning with configurable FPS
 * - Robust error handling and stream cleanup
 * 
 * @example
 * ```ts
 * const scanner = new QrCameraScanner((text) => {
 *   console.log('Decoded:', text);
 * });
 * 
 * await scanner.startCamera({
 *   video: videoElement,
 *   facingMode: 'environment'
 * });
 * 
 * scanner.startScanning({ fps: 15, stopOnFirstResult: true });
 * ```
 */

import type { DecodeOptions } from './types';
import { QRDecoder } from './qrdecode';
import { debug } from './debug';

export type FacingMode = 'user' | 'environment';

export type StartCameraOptions = {
  video: HTMLVideoElement;
  deviceId?: string;
  facingMode?: FacingMode;
  width?: number;
  height?: number;
  audio?: boolean;
  playsInline?: boolean;
};

export type ScanLoopOptions = {
  fps?: number;
  decode?: DecodeOptions;
  stopOnFirstResult?: boolean;
  onDecodeError?: (e: unknown) => void;
};

export type VideoReadyState =
  | { ready: true; reason: 'ok'; width: number; height: number }
  | { ready: false; reason: 'no_video' | 'no_stream' | 'track_ended' | 'no_intrinsic_size' | 'not_playing'; width?: number; height?: number };

export type ScannerStatus = {
  videoReady: VideoReadyState;
  scanning: boolean;
  inFlight: boolean;
};

export type QrScannerControls = {
  startCamera: (opts: StartCameraOptions) => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  getZoomCapabilities: () => { supported: boolean; min?: number; max?: number; step?: number; current?: number };
  setZoom: (zoom: number) => Promise<boolean>;
  startScanning: (opts: ScanLoopOptions) => void;
  stopScanning: () => void;
  listVideoDevices: () => Promise<MediaDeviceInfo[]>;
  getActiveDeviceId: () => string | null;
  getFacingModeGuess: () => FacingMode | null;
  getVideoReady: () => VideoReadyState;
  getScanningState: () => { scanning: boolean; inFlight: boolean };
  dispose: () => void;
};

type ZoomCap = { min: number; max: number; step?: number };
type MediaTrackCapabilitiesWithZoom = MediaTrackCapabilities & { zoom?: ZoomCap };
type MediaTrackSettingsWithZoom = MediaTrackSettings & { zoom?: number };

function getZoomCap(caps: MediaTrackCapabilities): ZoomCap | null {
  const zoom = (caps as MediaTrackCapabilitiesWithZoom).zoom;
  if (!zoom || typeof zoom !== 'object') return null;
  if (typeof zoom.min !== 'number' || typeof zoom.max !== 'number') return null;
  return zoom;
}

/**
 * QrCameraScanner
 * - encapsulates camera lifecycle + scan loop
 * - internal QRDecoder instance per scanner
 * - robust: cleans up tracks, avoids concurrent decode ticks, supports switching cameras
 */
export class QrCameraScanner {
  private decoder = new QRDecoder();
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private activeDeviceId: string | null = null;
  private scanning = false;
  private videoScanHandle: { stop: () => void; isRunning: () => boolean } | null = null;
  private videoHasIntrinsicSize = false;
  private cachedDevices: MediaDeviceInfo[] | null = null;
  private lastScanOpts: ScanLoopOptions | null = null;
  private controls?: QrScannerControls;
  private onResult: (text: string) => void;
  private statusSubs = new Set<(s: ScannerStatus) => void>();
  private switchInProgress = false;

  private emitStatus() {
    if (this.statusSubs.size === 0) return;
    let status: ScannerStatus;
    try {
      status = { videoReady: this.getVideoReady(), scanning: this.scanning, inFlight: false };
    } catch {
      return;
    }
    for (const cb of this.statusSubs) {
      try {
        cb(status);
      } catch {
        // ignore subscriber errors
      }
    }
  }

  constructor(onResult: (text: string) => void) {
    this.onResult = onResult;
  }

  async listVideoDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
    this.cachedDevices = cams;
    return cams;
  }

  stopCamera() {
    // stopScanning is idempotent; stopCamera centralizes teardown
    this.stopScanning();
    // reset intrinsic size flag so callers don't assume video still has frames
    this.videoHasIntrinsicSize = false;
    if (this.stream) {
      for (const t of this.stream.getTracks()) t.stop();
    }
    this.stream = null;
    this.activeDeviceId = null;

    if (this.videoEl) {
      try {
        // pause before clearing srcObject to avoid playing invisible media
        try { this.videoEl.pause(); } catch { /* pause may fail */ }
        this.videoEl.srcObject = null;
      } catch { /* srcObject assignment may fail */ }
    }

    this.emitStatus();
  }

  async startCamera(opts: StartCameraOptions) {
    this.stopCamera();

    this.videoEl = opts.video;
    // clear intrinsic size flag at the start of a new startCamera flow
    this.videoHasIntrinsicSize = false;

    if (opts.playsInline ?? true) {
      this.videoEl.playsInline = true;
      this.videoEl.setAttribute('playsinline', 'true');
      this.videoEl.setAttribute('webkit-playsinline', 'true');
    }
    this.videoEl.muted = true;
    this.videoEl.autoplay = true;

    const videoConstraints: MediaTrackConstraints = {
      width: opts.width ? { ideal: opts.width } : undefined,
      height: opts.height ? { ideal: opts.height } : undefined,
    };

    if (opts.deviceId) {
      videoConstraints.deviceId = { exact: opts.deviceId };
    } else if (opts.facingMode) {
      videoConstraints.facingMode = { ideal: opts.facingMode };
    } else {
      videoConstraints.facingMode = { ideal: 'environment' };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: opts.audio ?? false });
    } catch (e) {
      // If getUserMedia fails, ensure we don't leave partial state bound to this scanner
      try { this.stopCamera(); } catch { /* cleanup may fail */ }
      throw e;
    }

    const track = this.stream.getVideoTracks()[0];
    // If the track ends (device removed/permission revoked), ensure we teardown
    try {
      track.addEventListener?.('ended', () => {
        try { this.stopCamera(); } catch { /* cleanup may fail */ }
      });
    } catch { /* event listener may fail */ }
    const settings = track.getSettings();
    this.activeDeviceId = settings.deviceId ?? null;

    try {
      this.videoEl.srcObject = this.stream;
    } catch (err) {
      this.stopCamera();
      throw err;
    }


    // Wait for either metadata or data to be available (more robust).
    // Add a short timeout fallback so we don't hang forever on some devices.
    await new Promise<void>((resolve) => {
      const v = this.videoEl!;
      let finished = false;
      let tid: ReturnType<typeof setTimeout> | null = null;
      const cleanup = () => {
        v.removeEventListener('loadeddata', done);
        v.removeEventListener('loadedmetadata', done);
        v.removeEventListener('resize', done);
        if (tid !== null) {
          clearTimeout(tid);
          tid = null;
        }
      };
      const done = () => {
        if (finished) return;
        finished = true;
        // mark whether we obtained an intrinsic video size at this point
        try { this.videoHasIntrinsicSize = !!(v.videoWidth && v.videoHeight); } catch { /* property access may fail */ }
        cleanup();
        resolve();
      };
      // Require actual intrinsic video dimensions to avoid CSS-driven clientWidth early-resolve
      if (v.readyState >= 1 && v.videoWidth && v.videoHeight) { done(); return; }
      v.addEventListener('loadeddata', done, { once: true });
      v.addEventListener('loadedmetadata', done, { once: true });
      v.addEventListener('resize', done, { once: true });
      // 3s fallback
      tid = setTimeout(done, 3000);
    });

    try {
      await this.videoEl.play();
    } catch (_e) {
      // Swallow playback errors silently to avoid noisy console output in production.
      // Callers may still observe no frames; they can detect that via other UX.
    }

    try { await this.listVideoDevices(); } catch { /* device enumeration may fail */ }

    // Record whether the video element ended up with an intrinsic frame size.
    try {
      this.videoHasIntrinsicSize = !!(this.videoEl?.videoWidth && this.videoEl?.videoHeight);
    } catch { /* property access may fail */ }

    this.emitStatus();
  }

  getActiveDeviceId() {
    return this.activeDeviceId;
  }

  public getVideoReady(): VideoReadyState {
    const v = this.videoEl;
    if (!v) return { ready: false, reason: 'no_video' };

    const w = v.videoWidth || 0;
    const h = v.videoHeight || 0;

    if (!this.stream) return { ready: false, reason: 'no_stream', width: w || undefined, height: h || undefined };

    const track = this.stream.getVideoTracks?.()[0];
    try {
      if (track && track.readyState === 'ended') return { ready: false, reason: 'track_ended', width: w || undefined, height: h || undefined };
    } catch { /* track state access may fail */ }

    // If the media element reports ended/paused, surface that as not_playing
    try {
      if (v.ended) return { ready: false, reason: 'track_ended', width: w || undefined, height: h || undefined };
      if (v.paused) return { ready: false, reason: 'not_playing', width: w || undefined, height: h || undefined };
    } catch { /* video state access may fail */ }

    const hasSize = this.videoHasIntrinsicSize || (w > 0 && h > 0);
    if (!hasSize) return { ready: false, reason: 'no_intrinsic_size', width: w || undefined, height: h || undefined };

    if (v.readyState < 2) return { ready: false, reason: 'not_playing', width: w, height: h };

    return { ready: true, reason: 'ok', width: w, height: h };
  }

  getFacingModeGuess(): FacingMode | null {
    if (!this.cachedDevices || !this.activeDeviceId) return null;
    // Prefer track settings if available
    try {
      const facing = this.stream?.getVideoTracks()[0]?.getSettings()?.facingMode;
      if (facing === 'user' || facing === 'environment') return facing;
    } catch { /* track settings may not be available */ }

    const d = this.cachedDevices.find((x) => x.deviceId === this.activeDeviceId);
    if (!d?.label) return null;
    const label = d.label.toLowerCase();
    if (label.includes('front')) return 'user';
    if (label.includes('back') || label.includes('rear')) return 'environment';
    return null;
  }

  async switchCamera() {
    if (!this.videoEl) throw new Error('No video element bound. Call startCamera first.');
    if (this.switchInProgress) {
      debug('switchCamera already in progress, ignoring');
      return;
    }
    
    this.switchInProgress = true;
    try {
      const wasScanning = this.scanning;
      const last = this.lastScanOpts;

      // Explicitly stop scanning first so we have a consistent state and epoch bump
      this.stopScanning();

      const devices = this.cachedDevices ?? (await this.listVideoDevices());
      if (devices.length <= 1) return;
      const idx = this.activeDeviceId ? devices.findIndex((d) => d.deviceId === this.activeDeviceId) : -1;
      const next = devices[(idx + 1 + devices.length) % devices.length];

      await this.startCamera({ video: this.videoEl, deviceId: next.deviceId, playsInline: true });

      // If scanning was active before switch, resume with previous options
      if (wasScanning && last) this.startScanning(last);

      this.emitStatus();
    } finally {
      this.switchInProgress = false;
    }
  }

  getZoomCapabilities() {
    if (!this.stream) return { supported: false };
    const track = this.stream.getVideoTracks()[0];
    const caps = track.getCapabilities?.() ?? {} as MediaTrackCapabilities;
    const settings = track.getSettings?.() ?? {} as MediaTrackSettings;
    const zoomCap = getZoomCap(caps);
    if (!zoomCap) return { supported: false };
    const current = (settings as MediaTrackSettingsWithZoom).zoom;
    return { supported: true, min: zoomCap.min, max: zoomCap.max, step: zoomCap.step, current };
  }

  async setZoom(zoom: number): Promise<boolean> {
    if (!this.stream) return false;
    const track = this.stream.getVideoTracks()[0];
    const caps = track.getCapabilities?.() ?? {} as MediaTrackCapabilities;
    const zoomCap = getZoomCap(caps);
    if (!zoomCap) return false;
    const z = Math.max(zoomCap.min, Math.min(zoomCap.max, zoom));
    try {
      // TypeScript doesn't include zoom in MediaTrackConstraintSet, but it's a valid constraint
      await track.applyConstraints({ advanced: [{ zoom: z } as any] });
      return true;
    } catch {
      return false;
    }
  }

  stopScanning() {
    this.scanning = false;
    if (this.videoScanHandle) {
      this.videoScanHandle.stop();
      this.videoScanHandle = null;
    }
    this.emitStatus();
  }

  startScanning(opts: ScanLoopOptions) {
    this.lastScanOpts = opts;
    if (!this.videoEl) throw new Error('No video element bound. Call startCamera first.');
    
    // If already scanning, stop first
    this.stopScanning();

    this.scanning = true;
    this.emitStatus();

    const fps = opts.fps ?? 10;
    const stopOnFirst = opts.stopOnFirstResult ?? true;

    this.videoScanHandle = this.decoder.startVideoScan(this.videoEl, {
      fpsSearch: fps,
      fpsTrack: fps * 2,
      decode: opts.decode,
      onResult: (res) => {
        if (res.ok) {
          this.onResult(res.text);
          if (stopOnFirst) {
            this.stopScanning();
          }
        }
      },
      onError: (e) => {
        opts.onDecodeError?.(e);
      }
    });
  }

  dispose() {
    // stopCamera will also stop scanning and teardown video tracks
    this.stopCamera();
    // Clear references so scanner instance no longer holds DOM or device info
    this.videoEl = null;
    this.cachedDevices = null;
    this.lastScanOpts = null;
    try { this.decoder.dispose(); } catch { /* decoder may already be disposed */ }

    this.emitStatus();
  }

  subscribeStatus(cb: (s: ScannerStatus) => void): () => void {
    this.statusSubs.add(cb);
    try {
      cb({ videoReady: this.getVideoReady(), scanning: this.scanning, inFlight: false });
    } catch {
      // ignore
    }
    return () => {
      this.statusSubs.delete(cb);
    };
  }

  // Expose a control-like object for compatibility if desired
  asControls(): QrScannerControls {
    if (this.controls) return this.controls;
    this.controls = {
      startCamera: (opts) => this.startCamera(opts),
      stopCamera: () => this.stopCamera(),
      switchCamera: () => this.switchCamera(),
      getZoomCapabilities: () => this.getZoomCapabilities(),
      setZoom: (z) => this.setZoom(z),
      startScanning: (o) => this.startScanning(o),
      stopScanning: () => this.stopScanning(),
      listVideoDevices: () => this.listVideoDevices(),
      getActiveDeviceId: () => this.getActiveDeviceId(),
      getFacingModeGuess: () => this.getFacingModeGuess(),
      getVideoReady: () => this.getVideoReady(),
      getScanningState: () => ({ scanning: this.scanning, inFlight: false }),
      dispose: () => this.dispose(),
    };
    return this.controls;
  }
}
