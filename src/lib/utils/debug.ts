/**
 * Debug Utility
 * 
 * Provides a conditional logging system that can be enabled/disabled via:
 * - Environment variable (VITE_DEBUG in .env files)
 * - URL query parameter (?debug or ?debug=true)
 * - LocalStorage flag
 * 
 * Features:
 * - Automatic prefix injection (e.g., "[QR]")
 * - Console grouping support
 * - Performance timing utilities
 * - Persistent enable/disable state
 * 
 * @example
 * ```ts
 * import { debug } from './debug';
 * debug('Hello', { data: 123 }); // Only logs when enabled
 * debug.enabled(); // Check if enabled
 * debug.group('Processing');
 * debug('Step 1');
 * debug.groupEnd();
 * ```
 */

type DebugFn = (...args: any[]) => void;

type DebugAPI = DebugFn & {
  /** Check if debug logging is currently enabled */
  enabled: () => boolean;
  /** Enable or disable debug logging and persist to localStorage */
  setEnabled: (v: boolean) => void;
  /** Set the prefix shown before all debug messages */
  setPrefix: (prefix: string) => void;

  /** Start a collapsible console group */
  group: (title: string, details?: any) => void;
  /** End the current console group */
  groupEnd: () => void;

  /** Start a performance timer */
  time: (label: string) => void;
  /** End a performance timer and log the duration */
  timeEnd: (label: string) => void;
};

const STORAGE_KEY = 'debug';

/**
 * Parse a value as a boolean truthy flag.
 * Accepts: "1", "true", "yes", "on" (case-insensitive)
 */
function truthy(v: unknown): boolean {
  const s = String(v ?? '').toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

/**
 * Check if debug is enabled via environment variable.
 * Always returns true in DEV mode, or checks VITE_DEBUG env var.
 */
function readEnvFlag(): boolean {
  if (import.meta.env.DEV) return true; // Auto-enable in development
  return truthy(import.meta.env.VITE_DEBUG); // .env.development: VITE_DEBUG=true
}

/**
 * Check if debug is enabled via URL query parameter.
 * Supports: ?debug, ?debug=true, ?debug=1
 */
function readUrlFlag(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const sp = new URLSearchParams(window.location.search);
    if (!sp.has('debug')) return false;
    const v = sp.get('debug');
    // ?debug with no value is treated as true; ?debug=0/false as false
    return v === null ? true : truthy(v);
  } catch {
    return false;
  }
}

/**
 * Check if debug is enabled via localStorage persistence.
 */
function readStorageFlag(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return truthy(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

// Initialize enabled state from env, URL, or storage (checked in priority order)
let _enabled = readEnvFlag() || readUrlFlag() || readStorageFlag();
let _prefix = '[debug]';

const debugImpl: DebugAPI = (function () {
  const fn = ((...args: any[]) => {
    if (!_enabled) return;
    console.log(_prefix, ...args);
  }) as DebugAPI;

  fn.enabled = () => _enabled;

  fn.setEnabled = (v: boolean) => {
    _enabled = !!v;
    try {
      if (typeof window !== 'undefined') {
        if (_enabled) window.localStorage.setItem(STORAGE_KEY, '1');
        else window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  fn.setPrefix = (prefix: string) => {
    _prefix = prefix || '[debug]';
  };

  fn.group = (title: string, details?: any) => {
    if (!_enabled) return;
    const label = `${_prefix} ${title}`;
    console.groupCollapsed?.(label);
    if (!console.groupCollapsed) console.log(label);
    if (details !== undefined) console.log(details);
  };

  fn.groupEnd = () => {
    if (!_enabled) return;
    console.groupEnd?.();
  };

  fn.time = (label: string) => {
    if (!_enabled) return;
    console.time?.(`${_prefix} ${label}`);
  };

  fn.timeEnd = (label: string) => {
    if (!_enabled) return;
    console.timeEnd?.(`${_prefix} ${label}`);
  };

  return fn;
})();

export const debug = debugImpl;
export default debug;
