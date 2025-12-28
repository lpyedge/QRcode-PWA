/**
 * QR Code Payload Builder
 * 
 * Generates properly formatted QR code content for various data types.
 * All builders include input validation and sanitization to prevent
 * injection attacks and format corruption.
 */

import { getTranslations } from '$lib/i18n';
import { CONFIG } from '$utils/config';

// ============================================================================
// Type Definitions
// ============================================================================

export type GeneratorMode = 'text' | 'url' | 'wifi' | 'email' | 'tel' | 'sms' | 'vcard';
export type GeneratorShapeStyle = 'square' | 'circle' | 'rounded' | 'fluid';
export type GeneratorEyeStyle = 'square' | 'circle';
export type GeneratorGradientDirection = 'to-r' | 'to-br' | 'to-b' | 'to-bl' | 'to-l' | 'to-tl' | 'to-t' | 'to-tr';
export type GeneratorLogoShape = 'square' | 'circle' | 'rounded';
export type GeneratorLogoBackgroundMode = 'auto' | 'none' | 'custom';

export interface GeneratorSettings {
  mode: GeneratorMode;
  content: string;
  linkUrl: string;
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WPA2' | 'WEP' | 'nopass';
  hidden: boolean;
  emailAddress: string;
  emailSubject: string;
  emailBody: string;
  telNumber: string;
  smsNumber: string;
  smsMessage: string;
  vcardFullName: string;
  vcardCompany: string;
  vcardTitle: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardWebsite: string;
  vcardAddress: string;
  vcardNote: string;
  size: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  shapeStyle?: GeneratorShapeStyle;
  shapeColor?: string;
  shapeGradient: {
    enabled: boolean;
    from: string;
    to: string;
    direction: GeneratorGradientDirection;
  };
  borderStyle: GeneratorEyeStyle;
  borderColor: string;
  centerStyle: GeneratorEyeStyle;
  centerColor: string;
  backgroundColor?: string;
  backgroundTransparent?: boolean;
  logo: {
    enabled: boolean;
    href: string;
    sizeRatio: number;
    paddingRatio: number;
    shape: GeneratorLogoShape;
    backgroundMode: GeneratorLogoBackgroundMode;
    backgroundColor: string;
  };
}

const _i18n = getTranslations();

export const DEFAULT_SETTINGS: GeneratorSettings = {
  mode: 'text',
  content: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.content) || '',
  linkUrl: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.linkUrl) || '',
  ssid: '',
  password: '',
  encryption: 'WPA',
  hidden: false,
  emailAddress: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.emailAddress) || '',
  emailSubject: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.emailSubject) || '',
  emailBody: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.emailBody) || '',
  telNumber: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.telNumber) || '',
  smsNumber: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.smsNumber) || '',
  smsMessage: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.smsMessage) || '',
  vcardFullName: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.vcardFullName) || '',
  vcardCompany: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.vcardCompany) || '',
  vcardTitle: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.vcardTitle) || '',
  vcardPhone: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.vcardPhone) || '',
  vcardEmail: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.vcardEmail) || '',
  vcardWebsite: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.vcardWebsite) || '',
  vcardAddress: (_i18n.generator && _i18n.generator.defaults && _i18n.generator.defaults.vcardAddress) || '',
  vcardNote: '',
  size: CONFIG.generator.defaultSize,
  margin: CONFIG.generator.defaultMargin,
  errorCorrectionLevel: CONFIG.generator.defaultErrorCorrectionLevel,
  shapeStyle: 'square',
  shapeColor: '#000000',
  shapeGradient: {
    enabled: false,
    from: '#000000',
    to: '#000000',
    direction: 'to-r',
  },
  borderStyle: 'square',
  borderColor: '#000000',
  centerStyle: 'square',
  centerColor: '#000000',
  backgroundColor: '#ffffff',
  backgroundTransparent: false,
  logo: {
    enabled: false,
    href: '',
    sizeRatio: CONFIG.logo.defaultSizeRatio,
    paddingRatio: CONFIG.logo.defaultPaddingRatio,
    shape: 'rounded',
    backgroundMode: 'auto',
    backgroundColor: '#ffffff',
  },
};

// ============================================================================
// Input Validation & Sanitization
// ============================================================================

/** Normalize single-line text */
function normalizeSingleLine(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

/** Normalize multiline text */
function normalizeMultiline(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/** Check if string is valid email */
function isLikelyEmailAddress(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const normalized = normalizeSingleLine(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

/** 
 * Check if string is a valid and safe URL.
 * Only allows http/https protocols to prevent javascript: or data: injection.
 */
function isValidUrl(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    // Block URLs with embedded credentials (potential phishing)
    if (url.username || url.password) return false;
    return true;
  } catch {
    return false;
  }
}

/** Normalize phone number */
function normalizePhone(value: string): string {
  if (!value || typeof value !== 'string') return '';
  const raw = value.trim();
  if (/[^0-9+*#()\s.\-]/.test(raw)) return '';
  const cleaned = raw.replace(/[^\d+*#]/g, '');
  const hasLeadingPlus = cleaned.startsWith('+');
  const normalized = cleaned.replace(/\+/g, '');
  const result = hasLeadingPlus ? '+' + normalized : normalized;
  return /\d/.test(result) ? result : '';
}

/** Escape Wi-Fi value */
function escapeWifiValue(value: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\r?\n/g, ' ').replace(/([\\;,:"])/g, '\\$1');
}

/** Escape vCard value */
function escapeVcardValue(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r?\n/g, '\\n');
}

/** 
 * Normalize Wi-Fi encryption type for QR code format.
 * Note: WPA2 is treated as WPA per Wi-Fi QR code specification.
 */
function normalizeWifiEncryption(type: string): 'WPA' | 'WEP' | 'nopass' {
  const normalized = String(type).toUpperCase();
  // Wi-Fi QR spec uses 'WPA' for both WPA and WPA2
  if (normalized === 'WPA2' || normalized === 'WPA') return 'WPA';
  if (normalized === 'WEP') return 'WEP';
  return 'nopass';
}

// ============================================================================
// Payload Builders
// ============================================================================

export function buildPayload(settings: GeneratorSettings): string {
  if (!settings || typeof settings !== 'object') {
    const i18n = getTranslations();
    throw new Error(i18n.errors?.invalidSettings || 'Invalid settings object');
  }
  const mode = settings.mode || 'text';
  switch (mode) {
    case 'text': return buildTextPayload(settings);
    case 'url': return buildUrlPayload(settings);
    case 'wifi': return buildWifiPayload(settings);
    case 'email': return buildEmailPayload(settings);
    case 'tel': return buildTelPayload(settings);
    case 'sms': return buildSmsPayload(settings);
    case 'vcard': return buildVcardPayload(settings);
    default: {
      const i18n = getTranslations();
      const tpl = i18n.errors?.unsupportedMode || `Unsupported mode: ${mode}`;
      throw new Error(tpl.replace('{mode}', String(mode)));
    }
  }
}

function buildTextPayload(settings: GeneratorSettings): string {
  const value = normalizeMultiline(settings.content);
  const i18n = getTranslations();
  if (!value) throw new Error(i18n.payloads.errors.enterText);
  if (value.length > 4000) throw new Error(i18n.payloads.errors.textTooLong);
  return value;
}

function buildUrlPayload(settings: GeneratorSettings): string {
  const value = normalizeSingleLine(settings.linkUrl);
  const i18n = getTranslations();
  if (!value) throw new Error(i18n.payloads.errors.enterLink);
  if (!isValidUrl(value)) throw new Error(i18n.payloads.errors.invalidLink);
  if (value.length > 2048) throw new Error(i18n.payloads.errors.linkTooLong);
  return value;
}

function buildWifiPayload(settings: GeneratorSettings): string {
  const ssid = settings.ssid.trim();
  const i18n = getTranslations();
  if (!ssid) throw new Error(i18n.payloads.errors.enterSsid);
  if (ssid.length > 32) throw new Error('SSID too long (max 32 characters)');
  const encryption = normalizeWifiEncryption(settings.encryption);
  const password = encryption === 'nopass' ? '' : settings.password.trim();
  if (encryption !== 'nopass' && !password) {
    throw new Error(i18n.payloads.errors.wifiNeedPassword.replace('{encryption}', encryption));
  }
  if (password.length > 63) {
    throw new Error('Password too long (max 63 characters)');
  }
  const hidden = settings.hidden ? 'true' : 'false';
  return `WIFI:T:${encryption};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(password)};H:${hidden};;`;
}

function buildEmailPayload(settings: GeneratorSettings): string {
  const address = normalizeSingleLine(settings.emailAddress);
  const i18n = getTranslations();
  if (!address) throw new Error(i18n.payloads.errors.enterEmail);
  if (!isLikelyEmailAddress(address)) throw new Error(i18n.payloads.errors.invalidEmail);
  const params = new URLSearchParams();
  const subject = normalizeSingleLine(settings.emailSubject);
  const body = normalizeMultiline(settings.emailBody);
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  const query = params.toString();
  return query ? `mailto:${address}?${query}` : `mailto:${address}`;
}

function buildTelPayload(settings: GeneratorSettings): string {
  const number = normalizePhone(settings.telNumber);
  const i18n = getTranslations();
  if (!number) throw new Error(i18n.payloads.errors.enterValidPhone);
  return `tel:${number}`;
}

function buildSmsPayload(settings: GeneratorSettings): string {
  const number = normalizePhone(settings.smsNumber);
  const i18n = getTranslations();
  if (!number) throw new Error(i18n.payloads.errors.enterValidSms);
  const message = normalizeSingleLine(settings.smsMessage);
  return message ? `sms:${number}?body=${encodeURIComponent(message)}` : `sms:${number}`;
}

function buildVcardPayload(settings: GeneratorSettings): string {
  const fullName = settings.vcardFullName.trim();
  const i18n = getTranslations();
  if (!fullName) throw new Error(i18n.payloads.errors.enterContactName);
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcardValue(fullName)}`,
  ];
  const company = settings.vcardCompany.trim();
  if (company) lines.push(`ORG:${escapeVcardValue(company)}`);
  const title = settings.vcardTitle.trim();
  if (title) lines.push(`TITLE:${escapeVcardValue(title)}`);
  const phone = normalizePhone(settings.vcardPhone);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  const email = normalizeSingleLine(settings.vcardEmail);
  if (email && isLikelyEmailAddress(email)) lines.push(`EMAIL;TYPE=WORK:${email}`);
  const website = normalizeSingleLine(settings.vcardWebsite);
  if (website && isValidUrl(website)) lines.push(`URL:${website}`);
  const address = settings.vcardAddress.trim();
  if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVcardValue(address)};;;;`);
  const note = settings.vcardNote.trim();
  if (note) lines.push(`NOTE:${escapeVcardValue(note)}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

// ============================================================================
// Exports for Testing
// ============================================================================

export const _internal = {
  normalizeSingleLine,
  normalizeMultiline,
  isLikelyEmailAddress,
  isValidUrl,
  normalizePhone,
  escapeWifiValue,
  escapeVcardValue,
  normalizeWifiEncryption,
};
