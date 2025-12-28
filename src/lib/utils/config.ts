/**
 * Application Configuration Constants
 * 
 * Centralized configuration for magic numbers and settings.
 * Import these constants instead of using hard-coded values.
 */

export const CONFIG = {
  /** Scanner-related configuration */
  scanner: {
    /** Maximum number of scan history items to keep */
    maxHistory: 5,
    /** Default frames per second for QR scanning */
    defaultFps: 10,
    /** High FPS for tracking mode */
    trackFps: 24,
    /** Timeout for decode operations in milliseconds */
    decodeTimeout: 10000,
    /** Vibration duration on successful scan (ms) */
    vibrationDuration: 120,
  },

  /** Generator-related configuration */
  generator: {
    /** Debounce delay for preview rendering in milliseconds */
    debounceMs: 250,
    /** Maximum text content length */
    maxTextLength: 4000,
    /** Maximum URL length */
    maxUrlLength: 2048,
    /** Maximum Wi-Fi SSID length */
    maxSsidLength: 32,
    /** Maximum Wi-Fi password length */
    maxPasswordLength: 63,
    /** Default QR code size in pixels */
    defaultSize: 320,
    /** Minimum QR code size in pixels */
    minSize: 200,
    /** Maximum QR code size in pixels */
    maxSize: 550,
    /** Default quiet zone margin in modules */
    defaultMargin: 1,
    /** Minimum quiet zone margin in modules */
    minMargin: 0,
    /** Maximum quiet zone margin in modules */
    maxMargin: 5,
    /** Default error correction level */
    defaultErrorCorrectionLevel: 'M',
    /** Minimum error correction level required when logo is enabled */
    minErrorCorrectionLevelForLogo: 'Q',
  },

  /** QR decode configuration */
  decode: {
    /** Maximum canvas pool size */
    canvasPoolMax: 12,
    /** Maximum cached pixels for luminance buffer */
    maxCachedPixels: 2048 * 2048,
    /** Default max edge for search mode */
    maxEdgeSearch: 640,
    /** Default max edge for full-frame mode */
    maxEdgeFull: 1280,
    /** Track failure threshold before returning to search mode */
    trackFailThreshold: 8,
    /** Rescue scan interval in milliseconds */
    rescueEveryMs: 1200,
    /** Default dedupe interval in milliseconds */
    dedupeMs: 800,
  },

  /** Rasterization configuration */
  raster: {
    /** Maximum dimension for rasterized output */
    maxDimension: 8192,
    /** Maximum total pixels for rasterized output */
    maxPixels: 64_000_000,
    /** Default max edge for output */
    defaultMaxEdge: 1024,
    /** Default JPEG quality */
    defaultJpegQuality: 0.92,
    /** Default export format */
    defaultExportFormat: 'png',
  },

  /** PWA configuration */
  pwa: {
    /** Service worker update check interval in milliseconds */
    updateCheckInterval: 60 * 60 * 1000, // 1 hour
    /** Days before showing install prompt again after dismissal */
    dismissResetDays: 7,
  },

  /** Logo configuration for QR codes */
  logo: {
    /** Default logo size ratio */
    defaultSizeRatio: 0.22,
    /** Minimum logo size ratio */
    minSizeRatio: 0.05,
    /** Maximum logo size ratio */
    maxSizeRatio: 0.45,
    /** Default padding ratio around logo */
    defaultPaddingRatio: 0.03,
    /** Maximum padding ratio around logo */
    maxPaddingRatio: 0.12,
    /** Default corner radius for rounded logos */
    defaultCornerRadius: 0.6,
  },
} as const;

/** Type for the configuration object */
export type AppConfig = typeof CONFIG;

export default CONFIG;
