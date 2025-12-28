/**
 * Unit tests for QR code payload builders
 * Tests validation, sanitization, and format generation
 */
import { describe, it, expect } from 'vitest';
import { buildPayload, _internal, DEFAULT_SETTINGS, type GeneratorSettings } from '$lib/utils/payloads';

describe('Payload Internal Utilities', () => {
  describe('normalizeSingleLine', () => {
    it('should trim and normalize whitespace', () => {
      expect(_internal.normalizeSingleLine('  hello   world  ')).toBe('hello world');
      expect(_internal.normalizeSingleLine('hello\nworld')).toBe('hello world');
      expect(_internal.normalizeSingleLine('hello\tworld')).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(_internal.normalizeSingleLine('')).toBe('');
      expect(_internal.normalizeSingleLine('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(_internal.normalizeSingleLine(null as any)).toBe('');
      expect(_internal.normalizeSingleLine(undefined as any)).toBe('');
    });
  });

  describe('normalizeMultiline', () => {
    it('should preserve newlines but remove control characters', () => {
      const input = 'line1\nline2\rline3';
      const result = _internal.normalizeMultiline(input);
      expect(result).toContain('line1');
      expect(result).toContain('line2');
    });

    it('should remove null bytes and other control chars', () => {
      const input = 'hello\x00world\x07test';
      const result = _internal.normalizeMultiline(input);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x07');
    });
  });

  describe('isLikelyEmailAddress', () => {
    it('should validate correct email formats', () => {
      expect(_internal.isLikelyEmailAddress('test@example.com')).toBe(true);
      expect(_internal.isLikelyEmailAddress('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(_internal.isLikelyEmailAddress('invalid')).toBe(false);
      expect(_internal.isLikelyEmailAddress('invalid@')).toBe(false);
      expect(_internal.isLikelyEmailAddress('@example.com')).toBe(false);
      expect(_internal.isLikelyEmailAddress('no-at-sign.com')).toBe(false);
    });

    it('should handle empty or non-string input', () => {
      expect(_internal.isLikelyEmailAddress('')).toBe(false);
      expect(_internal.isLikelyEmailAddress(null as any)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate http and https URLs', () => {
      expect(_internal.isValidUrl('https://example.com')).toBe(true);
      expect(_internal.isValidUrl('http://test.org/path?query=1')).toBe(true);
    });

    it('should reject non-http protocols', () => {
      expect(_internal.isValidUrl('ftp://example.com')).toBe(false);
      expect(_internal.isValidUrl('javascript:alert(1)')).toBe(false);
      expect(_internal.isValidUrl('file:///etc/passwd')).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(_internal.isValidUrl('not-a-url')).toBe(false);
      expect(_internal.isValidUrl('//example.com')).toBe(false);
      expect(_internal.isValidUrl('')).toBe(false);
    });
  });

  describe('normalizePhone', () => {
    it('should extract digits and preserve leading +', () => {
      expect(_internal.normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
      expect(_internal.normalizePhone('555-1234')).toBe('5551234');
      expect(_internal.normalizePhone('+86 138 0000 0000')).toBe('+8613800000000');
    });

    it('should handle special chars used in phone dialing', () => {
      expect(_internal.normalizePhone('555*123#')).toBe('555*123#');
    });

    it('should reject invalid characters', () => {
      expect(_internal.normalizePhone('abc-123')).toBe('');
      expect(_internal.normalizePhone('测试')).toBe('');
    });

    it('should return empty for numbers without digits', () => {
      expect(_internal.normalizePhone('+++')).toBe('');
      expect(_internal.normalizePhone('---')).toBe('');
    });
  });

  describe('escapeWifiValue', () => {
    it('should escape special characters', () => {
      expect(_internal.escapeWifiValue('test;value')).toBe('test\\;value');
      expect(_internal.escapeWifiValue('test,value')).toBe('test\\,value');
      expect(_internal.escapeWifiValue('test:value')).toBe('test\\:value');
      expect(_internal.escapeWifiValue('test"value')).toBe('test\\"value');
    });

    it('should replace newlines with spaces', () => {
      expect(_internal.escapeWifiValue('line1\nline2')).toBe('line1 line2');
      expect(_internal.escapeWifiValue('line1\r\nline2')).toBe('line1 line2');
    });
  });

  describe('escapeVcardValue', () => {
    it('should escape special vCard characters', () => {
      expect(_internal.escapeVcardValue('test,value')).toBe('test\\,value');
      expect(_internal.escapeVcardValue('test;value')).toBe('test\\;value');
      expect(_internal.escapeVcardValue('test\\value')).toBe('test\\\\value');
    });

    it('should convert newlines to \\n', () => {
      expect(_internal.escapeVcardValue('line1\nline2')).toBe('line1\\nline2');
      expect(_internal.escapeVcardValue('line1\r\nline2')).toBe('line1\\nline2');
    });
  });

  describe('normalizeWifiEncryption', () => {
    it('should normalize to supported types', () => {
      expect(_internal.normalizeWifiEncryption('WPA')).toBe('WPA');
      expect(_internal.normalizeWifiEncryption('wpa')).toBe('WPA');
      expect(_internal.normalizeWifiEncryption('WPA2')).toBe('WPA');
      expect(_internal.normalizeWifiEncryption('WEP')).toBe('WEP');
      expect(_internal.normalizeWifiEncryption('wep')).toBe('WEP');
    });

    it('should default to nopass for unknown types', () => {
      expect(_internal.normalizeWifiEncryption('unknown')).toBe('nopass');
      expect(_internal.normalizeWifiEncryption('')).toBe('nopass');
    });
  });
});

describe('Payload Builders', () => {
  describe('buildPayload - text mode', () => {
    it('should build simple text payload', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'text', content: 'Hello World' };
      expect(buildPayload(settings)).toBe('Hello World');
    });

    it('should reject empty text', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'text', content: '' };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should reject text over 4000 characters', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'text', content: 'a'.repeat(4001) };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should normalize multiline text', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'text', content: 'line1\nline2\x00bad' };
      const result = buildPayload(settings);
      expect(result).not.toContain('\x00');
    });
  });

  describe('buildPayload - url mode', () => {
    it('should build valid URL payload', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'url', linkUrl: 'https://example.com' };
      expect(buildPayload(settings)).toBe('https://example.com');
    });

    it('should reject empty URL', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'url', linkUrl: '' };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should reject invalid URL', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'url', linkUrl: 'not-a-url' };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should reject non-http protocols', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'url', linkUrl: 'javascript:alert(1)' };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should reject URL over 2048 characters', () => {
      const settings: GeneratorSettings = { ...DEFAULT_SETTINGS, mode: 'url', linkUrl: 'https://example.com/' + 'a'.repeat(2040) };
      expect(() => buildPayload(settings)).toThrow();
    });
  });

  describe('buildPayload - wifi mode', () => {
    it('should build WPA Wi-Fi payload', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'wifi',
        ssid: 'TestNetwork',
        password: 'password123',
        encryption: 'WPA',
        hidden: false
      };
      const result = buildPayload(settings);
      expect(result).toContain('WIFI:');
      expect(result).toContain('T:WPA');
      expect(result).toContain('S:TestNetwork');
      expect(result).toContain('P:password123');
      expect(result).toContain('H:false');
    });

    it('should build open Wi-Fi payload', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'wifi',
        ssid: 'OpenNetwork',
        encryption: 'nopass',
        hidden: false
      };
      const result = buildPayload(settings);
      expect(result).toContain('T:nopass');
      expect(result).toContain('P:');
    });

    it('should reject empty SSID', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'wifi',
        ssid: '',
        encryption: 'WPA'
      };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should reject encrypted network without password', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'wifi',
        ssid: 'SecureNetwork',
        password: '',
        encryption: 'WPA'
      };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should reject SSID over 32 characters', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'wifi',
        ssid: 'a'.repeat(33),
        password: 'pass',
        encryption: 'WPA'
      };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should reject password over 63 characters', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'wifi',
        ssid: 'Network',
        password: 'a'.repeat(64),
        encryption: 'WPA'
      };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should escape special characters in SSID and password', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'wifi',
        ssid: 'Test;Network',
        password: 'pass:word',
        encryption: 'WPA',
        hidden: false
      };
      const result = buildPayload(settings);
      expect(result).toContain('S:Test\\;Network');
      expect(result).toContain('P:pass\\:word');
    });
  });

  describe('buildPayload - email mode', () => {
    it('should build simple email payload', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'email',
        emailAddress: 'test@example.com',
        emailSubject: '',  // Override i18n defaults
        emailBody: ''      // Override i18n defaults
      };
      expect(buildPayload(settings)).toBe('mailto:test@example.com');
    });

    it('should build email with subject and body', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'email',
        emailAddress: 'test@example.com',
        emailSubject: 'Hello',
        emailBody: 'Test message'
      };
      const result = buildPayload(settings);
      expect(result).toContain('mailto:test@example.com?');
      expect(result).toContain('subject=Hello');
      expect(result).toContain('body=Test+message');
    });

    it('should reject invalid email', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'email',
        emailAddress: 'invalid-email'
      };
      expect(() => buildPayload(settings)).toThrow();
    });
  });

  describe('buildPayload - tel mode', () => {
    it('should build phone payload', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'tel',
        telNumber: '+1 (555) 123-4567'
      };
      expect(buildPayload(settings)).toBe('tel:+15551234567');
    });

    it('should reject invalid phone number', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'tel',
        telNumber: 'not-a-number'
      };
      expect(() => buildPayload(settings)).toThrow();
    });
  });

  describe('buildPayload - sms mode', () => {
    it('should build SMS payload without message', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'sms',
        smsNumber: '5551234',
        smsMessage: ''  // Override i18n defaults
      };
      expect(buildPayload(settings)).toBe('sms:5551234');
    });

    it('should build SMS payload with message', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'sms',
        smsNumber: '5551234',
        smsMessage: 'Hello'
      };
      const result = buildPayload(settings);
      expect(result).toContain('sms:5551234?body=Hello');
    });
  });

  describe('buildPayload - vcard mode', () => {
    it('should build minimal vCard', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'vcard',
        vcardFullName: 'John Doe'
      };
      const result = buildPayload(settings);
      expect(result).toContain('BEGIN:VCARD');
      expect(result).toContain('VERSION:3.0');
      expect(result).toContain('FN:John Doe');
      expect(result).toContain('END:VCARD');
    });

    it('should build complete vCard', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'vcard',
        vcardFullName: 'John Doe',
        vcardCompany: 'Acme Corp',
        vcardTitle: 'Developer',
        vcardPhone: '5551234',
        vcardEmail: 'john@example.com',
        vcardWebsite: 'https://example.com',
        vcardAddress: '123 Main St'
      };
      const result = buildPayload(settings);
      expect(result).toContain('ORG:Acme Corp');
      expect(result).toContain('TITLE:Developer');
      expect(result).toContain('TEL;TYPE=CELL:5551234');
      expect(result).toContain('EMAIL;TYPE=WORK:john@example.com');
      expect(result).toContain('URL:https://example.com');
      expect(result).toContain('ADR;TYPE=WORK:;;123 Main St;;;;');
    });

    it('should reject empty name', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'vcard',
        vcardFullName: ''
      };
      expect(() => buildPayload(settings)).toThrow();
    });

    it('should escape special vCard characters', () => {
      const settings: GeneratorSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'vcard',
        vcardFullName: 'John,Doe',
        vcardCompany: 'Acme;Corp'
      };
      const result = buildPayload(settings);
      expect(result).toContain('FN:John\\,Doe');
      expect(result).toContain('ORG:Acme\\;Corp');
    });
  });

  describe('buildPayload - error handling', () => {
    it('should reject invalid settings object', () => {
      expect(() => buildPayload(null as any)).toThrow();
      expect(() => buildPayload(undefined as any)).toThrow();
    });

    it('should reject unsupported mode', () => {
      const settings: any = { ...DEFAULT_SETTINGS, mode: 'unsupported' };
      expect(() => buildPayload(settings)).toThrow();
    });
  });
});
