/**
 * Unified Error Handling Utilities
 * 
 * Provides centralized error handling, custom error types,
 * and user-friendly error message formatting.
 */

import { getTranslations } from '$lib/i18n';

/** Error codes for QR-related errors */
export type QrErrorCode =
  | 'INVALID_SETTINGS'
  | 'UNSUPPORTED_MODE'
  | 'EMPTY_CONTENT'
  | 'CONTENT_TOO_LONG'
  | 'INVALID_URL'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_SSID'
  | 'INVALID_PASSWORD'
  | 'DECODE_FAILED'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_NOT_AVAILABLE'
  | 'CANVAS_TAINTED'
  | 'RENDER_FAILED'
  | 'UNKNOWN';

/**
 * Custom error class for QR-related errors.
 * Includes an error code for programmatic handling.
 */
export class QrError extends Error {
  readonly code: QrErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(code: QrErrorCode, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'QrError';
    this.code = code;
    this.context = context;
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QrError);
    }
  }

  /**
   * Create a user-friendly error message using i18n translations.
   */
  toUserMessage(): string {
    const i18n = getTranslations();
    const fallback = this.message;
    
    // Try to find a translated message for this error code
    const errorMessages = i18n.errors as Record<string, string> | undefined;
    if (errorMessages && typeof errorMessages[this.code] === 'string') {
      return errorMessages[this.code];
    }
    
    return fallback;
  }
}

/**
 * Convert any error to a user-friendly message.
 * Handles QrError, standard Error, and unknown error types.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof QrError) {
    return error.toUserMessage();
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Safe wrapper for async operations with error handling.
 * Returns a tuple of [result, error] similar to Go-style error handling.
 */
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Safe wrapper for sync operations with error handling.
 */
export function safeSync<T>(
  operation: () => T
): [T, null] | [null, Error] {
  try {
    const result = operation();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Log error with context for debugging.
 * Only logs in development mode.
 */
export function logError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error, extra ?? '');
  }
}

/**
 * Utility to check if an error is a specific QrError code.
 */
export function isQrError(error: unknown, code?: QrErrorCode): error is QrError {
  if (!(error instanceof QrError)) return false;
  if (code === undefined) return true;
  return error.code === code;
}

export default {
  QrError,
  getErrorMessage,
  safeAsync,
  safeSync,
  logError,
  isQrError,
};
