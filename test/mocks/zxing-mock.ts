/**
 * Mock for ZXing library in tests
 * 
 * Provides minimal mock implementations of ZXing types used in the codebase.
 */

import { vi } from 'vitest';

// Mock EncodeHintType enum
export const EncodeHintType = {
  CHARACTER_SET: 'CHARACTER_SET',
  MARGIN: 'MARGIN',
  ERROR_CORRECTION: 'ERROR_CORRECTION',
} as const;

// Mock DecodeHintType enum  
export const DecodeHintType = {
  POSSIBLE_FORMATS: 'POSSIBLE_FORMATS',
  CHARACTER_SET: 'CHARACTER_SET',
  TRY_HARDER: 'TRY_HARDER',
} as const;

// Mock BarcodeFormat enum
export const BarcodeFormat = {
  QR_CODE: 'QR_CODE',
} as const;

// Mock exception classes
export class NotFoundException extends Error {
  constructor(message?: string) {
    super(message || 'Not found');
    this.name = 'NotFoundException';
  }
}

export class ChecksumException extends Error {
  constructor(message?: string) {
    super(message || 'Checksum error');
    this.name = 'ChecksumException';
  }
}

export class FormatException extends Error {
  constructor(message?: string) {
    super(message || 'Format error');
    this.name = 'FormatException';
  }
}

// Mock ResultMetadataType enum
export const ResultMetadataType = {
  ERROR_CORRECTION_LEVEL: 'ERROR_CORRECTION_LEVEL',
} as const;

// Mock BitMatrix class
export class BitMatrix {
  private data: boolean[][];
  private width: number;
  private height: number;

  constructor(width: number, height?: number) {
    this.width = width;
    this.height = height ?? width;
    this.data = Array(this.height).fill(null).map(() => Array(this.width).fill(false));
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  get(x: number, y: number): boolean {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
    return this.data[y][x];
  }

  set(x: number, y: number, value: boolean): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.data[y][x] = value;
    }
  }
}

// Mock QRCodeWriter class
export class QRCodeWriter {
  encode(content: string, format: typeof BarcodeFormat.QR_CODE, width: number, height: number, hints?: Map<unknown, unknown>): BitMatrix {
    // Create a simple 21x21 QR matrix for testing
    const size = 21;
    const matrix = new BitMatrix(size, size);
    
    // Set up finder patterns (simplified)
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
        const isCenter = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        if (isBorder || isCenter) {
          // Top-left finder
          matrix.set(j, i, true);
          // Top-right finder
          matrix.set(size - 1 - j, i, true);
          // Bottom-left finder
          matrix.set(j, size - 1 - i, true);
        }
      }
    }
    
    return matrix;
  }
}

// Mock RGBLuminanceSource
export class RGBLuminanceSource {
  constructor(luminances: Uint8ClampedArray, width: number, height: number) {
    // Mock implementation
  }
}

// Mock GlobalHistogramBinarizer
export class GlobalHistogramBinarizer {
  constructor(source: RGBLuminanceSource) {
    // Mock implementation
  }
}

// Mock HybridBinarizer
export class HybridBinarizer {
  constructor(source: RGBLuminanceSource) {
    // Mock implementation
  }
}

// Mock BinaryBitmap
export class BinaryBitmap {
  constructor(binarizer: GlobalHistogramBinarizer | HybridBinarizer) {
    // Mock implementation
  }
}

// Mock Result class
export class Result {
  constructor(
    public text: string,
    public rawBytes: Uint8Array | null,
    public resultPoints: unknown[],
    public format: unknown
  ) {}

  getText(): string {
    return this.text;
  }

  getResultMetadata(): Map<unknown, unknown> | null {
    return null;
  }
}

// Mock QRCodeReader class
export class QRCodeReader {
  decode(image: BinaryBitmap, hints?: Map<unknown, unknown>): Result {
    throw new NotFoundException('No QR code found');
  }
}

// Export all as default module mock
export default {
  EncodeHintType,
  DecodeHintType,
  BarcodeFormat,
  BitMatrix,
  QRCodeWriter,
  QRCodeReader,
  RGBLuminanceSource,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  BinaryBitmap,
  Result,
  NotFoundException,
  ChecksumException,
  FormatException,
  ResultMetadataType,
};
