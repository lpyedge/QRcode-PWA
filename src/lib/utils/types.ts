/* Shared types for QR utilities (core + browser adapters)
 * This file contains only data types and pure enums related to data and rendering options.
 * No UI-specific file format enums or DOM types are included here.
 */

export type QrMatrix = number[][]; // 1 = dark module, 0 = light module

// Intermediate decoded image buffer used by browser adapters (RGBA)
// Each pixel is 4 bytes (R,G,B,A) - aligned with `Uint8ClampedArray` image data.
export type QrUint8ClampedArray = Uint8ClampedArray;

export type QrErrorLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrComputeOptions {
  content: string;
  errorCorrection?: QrErrorLevel;
}

export interface QrRenderOptions {
  darkColor?: string; // CSS color for dark modules (default '#000')
  lightColor?: string; // CSS color for light modules (default '#fff')
  shape?: 'square' | 'circle'; // module shape for SVG rendering
}

/**
 * Shared decode options for browser adapters (image/video).
 * - `roi` may be specified in absolute pixels or as relative fractions (0..1).
 * - `scale` enlarges the cropped ROI before decoding; integer > 0 recommended.
 */
export interface DecodeOptions {
  roi?: { x: number; y: number; width: number; height: number };
  scale?: number;
  // Optional padding ratio applied when using BarcodeDetector crop localization.
  // Defaults to 0.1 (10%). Accepts values like 0.1 (10%).
  padRatio?: number;
  // Optional scale applied to detector-cropped ROI before decoding. Values <1 will downscale.
  // Default is 1 (no change). Useful to speed up decoding on large crops.
  cropScale?: number;
  // Minimum and maximum padding in pixels applied to detector crops.
  padMin?: number;
  padMax?: number;
}

// Unified decode result returned by browser adapters. Avoids throwing for benign ZXing misses.
export type DecodeResult =
  | { ok: true; text: string; rawBytes?: Uint8Array | null; metadata?: any }
  | { ok: false; reason: 'not_found' | 'checksum' | 'format' | 'unknown'; error?: unknown };

/**
 * Normalized detection result shape used when BarcodeDetector is available.
 * This mirrors the important fields we consume: optional rawValue, a boundingBox
 * (DOMRectReadOnly) and corner points for perspective handling.
 */
export type DetectedQR = {
  rawValue?: string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: { x: number; y: number }[];
};

// Business payload interfaces
export interface WifiData {
  ssid: string;
  password?: string;
  authentication?: 'WEP' | 'WPA' | 'nopass';
  hidden?: boolean;
}

export interface VCardData {
  fullName?: string;
  org?: string;
  title?: string;
  email?: string;
  tel?: string;
  url?: string;
  adr?: string; // single-line address
}

export interface SmsData {
  phone: string;
  message?: string;
}

export interface UrlData {
  url: string;
}
