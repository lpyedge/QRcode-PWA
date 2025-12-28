/**
 * Unit tests for QR code encoding
 * Tests SVG generation, matrix validation, and rendering options
 */
import { describe, it, expect } from 'vitest';
import { generateSvg, generateSvgFromMatrix, type QrSvgRenderOptions } from '$lib/utils/qrencode';

describe('QR Encoding', () => {
  describe('generateSvg', () => {
    it('should generate SVG from simple text', async () => {
      const svg = await generateSvg(
        { content: 'Hello World', errorCorrection: 'M' },
        { margin: 4 }
      );
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should generate SVG with custom margin', async () => {
      const svg = await generateSvg(
        { content: 'Test', errorCorrection: 'L' },
        { margin: 2 }
      );
      expect(svg).toContain('data-qr-margin="2"');
    });

    it('should generate SVG with different error correction levels', async () => {
      const levels: Array<'L' | 'M' | 'Q' | 'H'> = ['L', 'M', 'Q', 'H'];
      
      for (const level of levels) {
        const svg = await generateSvg(
          { content: 'Test', errorCorrection: level },
          { margin: 4 }
        );
        expect(svg).toContain('<svg');
      }
    });

    it('should handle empty content by throwing error', async () => {
      await expect(
        generateSvg({ content: '', errorCorrection: 'M' }, { margin: 4 })
      ).rejects.toThrow();
    });

    it('should handle very long content', async () => {
      const longContent = 'A'.repeat(1000);
      const svg = await generateSvg(
        { content: longContent, errorCorrection: 'L' },
        { margin: 4 }
      );
      expect(svg).toContain('<svg');
    });

    it('should handle special characters', async () => {
      const specialChars = '你好世界 Hello 🌍 @#$%^&*()';
      const svg = await generateSvg(
        { content: specialChars, errorCorrection: 'M' },
        { margin: 4 }
      );
      expect(svg).toContain('<svg');
    });

    it('should include background rect when requested', async () => {
      const svg = await generateSvg(
        { content: 'Test', errorCorrection: 'M' },
        { margin: 4, includeBackground: true }
      );
      expect(svg).toContain('data-qr-role="bg"');
    });

    it('should exclude background rect when not requested', async () => {
      const svg = await generateSvg(
        { content: 'Test', errorCorrection: 'M' },
        { margin: 4, includeBackground: false }
      );
      expect(svg).not.toContain('data-qr-role="bg"');
    });

    it('should apply custom CSS classes', async () => {
      const svg = await generateSvg(
        { content: 'Test', errorCorrection: 'M' },
        { 
          svgClass: 'custom-qr',
          bgClass: 'custom-bg',
          moduleClass: 'custom-module'
        }
      );
      expect(svg).toContain('class="custom-qr"');
      expect(svg).toContain('class="custom-bg"');
      expect(svg).toContain('class="custom-module"');
    });

    it('should add ID prefix to elements when provided', async () => {
      const svg = await generateSvg(
        { content: 'Test', errorCorrection: 'M' },
        { idPrefix: 'qr-test' }
      );
      expect(svg).toContain('id="qr-test-m-');
    });

    it('should not add IDs when prefix not provided', async () => {
      const svg = await generateSvg(
        { content: 'Test', errorCorrection: 'M' },
        { margin: 4 }
      );
      expect(svg).not.toContain(' id="');
    });
  });

  describe('generateSvgFromMatrix', () => {
    it('should generate SVG from valid matrix', () => {
      // Create a simple 5x5 matrix
      const matrix = [
        [true, false, true, false, true],
        [false, true, false, true, false],
        [true, false, true, false, true],
        [false, true, false, true, false],
        [true, false, true, false, true]
      ];

      const svg = generateSvgFromMatrix(matrix, { margin: 2 });
      expect(svg).toContain('<svg');
      expect(svg).toContain('data-qr-cols="5"');
      expect(svg).toContain('data-qr-rows="5"');
      expect(svg).toContain('viewBox="0 0 9 9"'); // 5 + 2*2 margin
    });

    it('should only render true modules', () => {
      const matrix = [
        [true, false],
        [false, true]
      ];

      const svg = generateSvgFromMatrix(matrix, { margin: 0 });
      // Count number of module rects (should be 2)
      const moduleCount = (svg.match(/data-qr-role="module"/g) || []).length;
      expect(moduleCount).toBe(2);
    });

    it('should reject empty matrix', () => {
      expect(() => generateSvgFromMatrix([], { margin: 4 })).toThrow();
    });

    it('should reject matrix with empty rows', () => {
      const matrix = [[]];
      expect(() => generateSvgFromMatrix(matrix, { margin: 4 })).toThrow();
    });

    it('should reject jagged matrix', () => {
      const matrix = [
        [true, false, true],
        [true, false] // Missing one column
      ];
      expect(() => generateSvgFromMatrix(matrix, { margin: 4 })).toThrow();
    });

    it('should handle single cell matrix', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix, { margin: 0 });
      expect(svg).toContain('data-qr-cols="1"');
      expect(svg).toContain('data-qr-rows="1"');
    });

    it('should handle large matrix', () => {
      // Create a 50x50 matrix
      const size = 50;
      const matrix = Array(size).fill(null).map(() => 
        Array(size).fill(null).map(() => Math.random() > 0.5)
      );
      const svg = generateSvgFromMatrix(matrix, { margin: 4 });
      expect(svg).toContain(`data-qr-cols="${size}"`);
      expect(svg).toContain(`data-qr-rows="${size}"`);
    });

    it('should escape attribute values', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix, {
        svgClass: 'test"class',
        bgClass: 'bg<class',
        moduleClass: 'mod&class'
      });
      // Should escape special chars
      expect(svg).not.toContain('class="test"class"');
      expect(svg).toContain('&quot;');
      expect(svg).toContain('&lt;');
      expect(svg).toContain('&amp;');
    });

    it('should set correct viewBox dimensions with margin', () => {
      const matrix = [
        [true, false],
        [false, true]
      ];

      const svg = generateSvgFromMatrix(matrix, { margin: 3 });
      // 2 cols + 3*2 margin = 8
      expect(svg).toContain('viewBox="0 0 8 8"');
    });

    it('should add metadata attributes', () => {
      const matrix = [
        [true, false, true],
        [false, true, false],
        [true, false, true]
      ];

      const svg = generateSvgFromMatrix(matrix, { margin: 2 });
      expect(svg).toContain('data-qr-content-x="2"');
      expect(svg).toContain('data-qr-content-y="2"');
      expect(svg).toContain('data-qr-content-w="3"');
      expect(svg).toContain('data-qr-content-h="3"');
    });

    it('should position modules correctly with margin', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix, { margin: 5 });
      // Module should be at (5, 5) due to margin
      expect(svg).toContain('data-qr-sx="5"');
      expect(svg).toContain('data-qr-sy="5"');
    });

    it('should preserve module coordinates', () => {
      const matrix = [
        [true, false],
        [false, true]
      ];

      const svg = generateSvgFromMatrix(matrix, { margin: 0 });
      expect(svg).toContain('data-qr-x="0" data-qr-y="0"');
      expect(svg).toContain('data-qr-x="1" data-qr-y="1"');
    });

    it('should default to margin 4 when not specified', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix);
      expect(svg).toContain('data-qr-margin="4"');
    });

    it('should clamp negative margin to 0', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix, { margin: -5 });
      expect(svg).toContain('data-qr-margin="0"');
    });

    it('should default includeBackground to true', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix);
      expect(svg).toContain('data-qr-role="bg"');
    });

    it('should use default class names', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix);
      expect(svg).toContain('class="qr"');
      expect(svg).toContain('class="qr-bg"');
      expect(svg).toContain('class="qr-module"');
    });

    it('should set shape-rendering for crisp edges', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix);
      expect(svg).toContain('shape-rendering="crispEdges"');
    });

    it('should create modules with 1x1 size', () => {
      const matrix = [[true]];
      const svg = generateSvgFromMatrix(matrix);
      expect(svg).toContain('width="1" height="1"');
    });
  });

  describe('Render options', () => {
    const simpleMatrix = [[true, false], [false, true]];

    it('should accept all valid options', () => {
      const options: QrSvgRenderOptions = {
        margin: 2,
        includeBackground: true,
        svgClass: 'custom-svg',
        bgClass: 'custom-bg',
        moduleClass: 'custom-module',
        idPrefix: 'test'
      };

      const svg = generateSvgFromMatrix(simpleMatrix, options);
      expect(svg).toContain('class="custom-svg"');
      expect(svg).toContain('class="custom-bg"');
      expect(svg).toContain('class="custom-module"');
      expect(svg).toContain('id="test-m-');
    });

    it('should work with minimal options', () => {
      const svg = generateSvgFromMatrix(simpleMatrix, {});
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    });

    it('should accept partial options', () => {
      const svg = generateSvgFromMatrix(simpleMatrix, { 
        margin: 1,
        svgClass: 'my-qr'
      });
      expect(svg).toContain('data-qr-margin="1"');
      expect(svg).toContain('class="my-qr"');
    });
  });

  describe('Integration tests', () => {
    it('should generate and render URL QR code', async () => {
      const url = 'https://example.com/test?param=value';
      const svg = await generateSvg(
        { content: url, errorCorrection: 'M' },
        { margin: 4 }
      );
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('data-qr-role="module"');
      
      // Should have multiple modules for a URL
      const moduleCount = (svg.match(/data-qr-role="module"/g) || []).length;
      expect(moduleCount).toBeGreaterThan(10);
    });

    it('should generate and render Wi-Fi QR code', async () => {
      const wifiString = 'WIFI:T:WPA;S:TestNetwork;P:password123;H:false;;';
      const svg = await generateSvg(
        { content: wifiString, errorCorrection: 'H' },
        { margin: 4 }
      );
      
      expect(svg).toContain('<svg');
      const moduleCount = (svg.match(/data-qr-role="module"/g) || []).length;
      expect(moduleCount).toBeGreaterThan(20);
    });

    it('should generate different sizes for different error correction', async () => {
      const content = 'Test123';
      
      const svgL = await generateSvg({ content, errorCorrection: 'L' }, { margin: 0 });
      const svgH = await generateSvg({ content, errorCorrection: 'H' }, { margin: 0 });
      
      // Higher error correction should produce more modules
      const countL = (svgL.match(/data-qr-role="module"/g) || []).length;
      const countH = (svgH.match(/data-qr-role="module"/g) || []).length;
      
      expect(countH).toBeGreaterThanOrEqual(countL);
    });

    it('should produce valid XML structure', async () => {
      const svg = await generateSvg(
        { content: 'Valid XML Test', errorCorrection: 'M' },
        { margin: 4 }
      );
      
      // Basic XML structure checks
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect((svg.match(/<svg/g) || []).length).toBe(1);
      expect((svg.match(/<\/svg>/g) || []).length).toBe(1);
    });

    it('should be parseable by DOMParser', async () => {
      const svg = await generateSvg(
        { content: 'Parser Test', errorCorrection: 'M' },
        { margin: 4 }
      );
      
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgEl = doc.documentElement;
        
        expect(svgEl.tagName.toLowerCase()).toBe('svg');
        expect(svgEl.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
      }
    });
  });
});
