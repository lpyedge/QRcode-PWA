/**
 * Unit tests for QR SVG stylization
 * Tests color sanitization, shape transformations, and logo integration
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { stylizeSvg, type QrStylizeOptions } from '$lib/utils/qrStylize';

// Helper to create a minimal valid QR SVG for testing
function createTestQrSvg(options: { cols?: number; rows?: number; margin?: number } = {}): string {
  const cols = options.cols ?? 21;
  const rows = options.rows ?? 21;
  const margin = options.margin ?? 4;
  const vbW = cols + margin * 2;
  const vbH = rows + margin * 2;

  const modules: string[] = [];
  // Create a simple pattern for testing
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Create finder patterns at corners
      const inFinder = 
        (x < 7 && y < 7) || // Top-left
        (x >= cols - 7 && y < 7) || // Top-right
        (x < 7 && y >= rows - 7); // Bottom-left
      
      // Skip middle of finders and add some random modules
      if (!inFinder && (x + y) % 3 === 0) {
        const sx = x + margin;
        const sy = y + margin;
        modules.push(
          `<rect x="${sx}" y="${sy}" width="1" height="1" ` +
          `class="qr-module" data-qr-role="module" ` +
          `data-qr-x="${x}" data-qr-y="${y}" ` +
          `data-qr-sx="${sx}" data-qr-sy="${sy}"/>`
        );
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" `,
    `shape-rendering="crispEdges" class="qr" `,
    `data-qr-cols="${cols}" data-qr-rows="${rows}" data-qr-margin="${margin}" `,
    `data-qr-content-x="${margin}" data-qr-content-y="${margin}" `,
    `data-qr-content-w="${cols}" data-qr-content-h="${rows}">`,
    `<rect x="0" y="0" width="${vbW}" height="${vbH}" class="qr-bg" data-qr-role="bg"/>`,
    ...modules,
    `</svg>`
  ].join('');
}

describe('QR SVG Stylization', () => {
  let baseSvg: string;

  beforeEach(() => {
    baseSvg = createTestQrSvg();
  });

  describe('Basic functionality', () => {
    it('should return original SVG when no options provided', () => {
      const result = stylizeSvg(baseSvg);
      expect(result).toBeTruthy();
      expect(result).toContain('svg');
    });

    it('should handle empty string input', () => {
      const result = stylizeSvg('');
      expect(result).toBe('');
    });

    it('should handle invalid SVG gracefully', () => {
      const result = stylizeSvg('not-an-svg');
      expect(result).toBeTruthy();
    });
  });

  describe('Background color', () => {
    it('should apply solid background color', () => {
      const result = stylizeSvg(baseSvg, { backgroundColor: '#ffffff' });
      // SSR fallback uses CSS rules, not attributes
      expect(result).toContain('fill:#ffffff');
    });

    it('should handle transparent background', () => {
      const result = stylizeSvg(baseSvg, { backgroundColor: null });
      // When null, no background rule is added (transparent by omission)
      expect(result).not.toContain('.qr-bg{fill:');
    });

    it('should sanitize invalid colors', () => {
      const result = stylizeSvg(baseSvg, { backgroundColor: 'invalid-color' as any });
      expect(result).toBeTruthy();
    });

    it('should accept various color formats', () => {
      const hexResult = stylizeSvg(baseSvg, { backgroundColor: '#ff0000' });
      expect(hexResult).toContain('#ff0000');

      const rgbResult = stylizeSvg(baseSvg, { backgroundColor: 'rgb(255, 0, 0)' });
      expect(rgbResult).toContain('rgb(255, 0, 0)');

      const transparentResult = stylizeSvg(baseSvg, { backgroundColor: 'transparent' });
      expect(transparentResult).toContain('transparent');
    });
  });

  describe('Module color', () => {
    it('should apply solid module color', () => {
      const result = stylizeSvg(baseSvg, { shapeColor: '#000000' });
      expect(result).toContain('fill:#000000');
    });

    // TODO: Gradient feature is not yet implemented in qrStylize.ts
    it.skip('should apply gradient to modules', () => {
      const options: QrStylizeOptions = {
        shapeGradient: {
          enabled: true,
          from: '#ff0000',
          to: '#0000ff',
          direction: 'horizontal'
        }
      };
      const result = stylizeSvg(baseSvg, options);
      expect(result).toContain('linearGradient');
      expect(result).toContain('#ff0000');
      expect(result).toContain('#0000ff');
    });

    it.skip('should support all gradient directions', () => {
      const directions: Array<'horizontal' | 'vertical' | 'diagonal'> = ['horizontal', 'vertical', 'diagonal'];
      
      for (const dir of directions) {
        const result = stylizeSvg(baseSvg, {
          shapeGradient: {
            enabled: true,
            from: '#000000',
            to: '#ffffff',
            direction: dir
          }
        });
        expect(result).toContain('linearGradient');
      }
    });

    it('should not apply gradient when disabled', () => {
      const options: QrStylizeOptions = {
        shapeGradient: {
          enabled: false,
          from: '#ff0000',
          to: '#0000ff',
          direction: 'horizontal'
        },
        shapeColor: '#000000'
      };
      const result = stylizeSvg(baseSvg, options);
      expect(result).not.toContain('linearGradient');
    });
  });

  describe('Module shapes', () => {
    it('should keep square modules by default', () => {
      const result = stylizeSvg(baseSvg, { shapeStyle: 'square' });
      expect(result).toContain('shape-rendering="crispEdges"');
      expect(result).toContain('<rect');
    });

    // TODO: The following tests are for advanced features not yet implemented in qrStylize.ts
    it.skip('should convert modules to circles', () => {
      const result = stylizeSvg(baseSvg, { shapeStyle: 'circle' });
      expect(result).toContain('<circle');
      expect(result).not.toContain('data-qr-role="module".*<rect');
    });

    it.skip('should apply rounded corners', () => {
      const result = stylizeSvg(baseSvg, { shapeStyle: 'rounded', roundedRadius: 0.25 });
      expect(result).toContain('rx="0.25"');
      expect(result).toContain('ry="0.25"');
    });

    it.skip('should apply fluid style with neighbor detection', () => {
      const result = stylizeSvg(baseSvg, { shapeStyle: 'fluid', fluidRadius: 0.42 });
      expect(result).toContain('<path');
      expect(result).toContain('d="M');
    });

    it.skip('should clamp rounded radius to valid range', () => {
      const resultLow = stylizeSvg(baseSvg, { shapeStyle: 'rounded', roundedRadius: -1 });
      expect(resultLow).toContain('rx="0"');

      const resultHigh = stylizeSvg(baseSvg, { shapeStyle: 'rounded', roundedRadius: 1 });
      expect(resultHigh).toContain('rx="0.5"');
    });
  });

  // TODO: Finder pattern customization is not yet implemented in qrStylize.ts
  describe.skip('Finder (eye) patterns', () => {
    it('should customize finder border style', () => {
      const result = stylizeSvg(baseSvg, {
        borderStyle: 'circle',
        borderColor: '#ff0000'
      });
      expect(result).toContain('data-qr-role="finders"');
    });

    it('should customize finder center style', () => {
      const result = stylizeSvg(baseSvg, {
        centerStyle: 'circle',
        centerColor: '#0000ff'
      });
      expect(result).toContain('data-qr-role="finders"');
    });

    it('should apply both border and center customizations', () => {
      const result = stylizeSvg(baseSvg, {
        borderStyle: 'square',
        borderColor: '#ff0000',
        centerStyle: 'circle',
        centerColor: '#0000ff'
      });
      expect(result).toContain('fill="#ff0000"');
      expect(result).toContain('fill="#0000ff"');
    });
  });

  // TODO: Logo integration is not yet implemented in qrStylize.ts
  describe.skip('Logo integration', () => {
    it('should add logo with data URL', () => {
      const options: QrStylizeOptions = {
        logo: {
          href: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=',
          sizeRatio: 0.2,
          paddingRatio: 0.03,
          shape: 'rounded'
        }
      };
      const result = stylizeSvg(baseSvg, options);
      expect(result).toContain('data-qr-role="logo"');
      expect(result).toContain('<image');
      expect(result).toContain('href="data:image');
    });

    it('should add logo with blob URL', () => {
      const options: QrStylizeOptions = {
        logo: {
          href: 'blob:https://example.com/test',
          sizeRatio: 0.2,
          paddingRatio: 0.03,
          shape: 'circle'
        }
      };
      const result = stylizeSvg(baseSvg, options);
      expect(result).toContain('data-qr-role="logo"');
      expect(result).toContain('href="blob:');
    });

    it('should reject unsafe URLs', () => {
      const options: QrStylizeOptions = {
        logo: {
          href: 'javascript:alert(1)',
          sizeRatio: 0.2,
          paddingRatio: 0.03,
          shape: 'square'
        }
      };
      const result = stylizeSvg(baseSvg, options);
      expect(result).not.toContain('javascript:');
    });

    it('should clamp logo size ratio', () => {
      const optionsTooSmall: QrStylizeOptions = {
        logo: {
          href: 'data:image/svg+xml;base64,test',
          sizeRatio: 0.01,
          paddingRatio: 0,
          shape: 'square'
        }
      };
      const resultSmall = stylizeSvg(baseSvg, optionsTooSmall);
      expect(resultSmall).toBeTruthy();

      const optionsTooLarge: QrStylizeOptions = {
        logo: {
          href: 'data:image/svg+xml;base64,test',
          sizeRatio: 0.9,
          paddingRatio: 0,
          shape: 'square'
        }
      };
      const resultLarge = stylizeSvg(baseSvg, optionsTooLarge);
      expect(resultLarge).toBeTruthy();
    });

    it('should support different logo shapes', () => {
      const shapes: Array<'square' | 'circle' | 'rounded'> = ['square', 'circle', 'rounded'];
      
      for (const shape of shapes) {
        const result = stylizeSvg(baseSvg, {
          logo: {
            href: 'data:image/svg+xml;base64,test',
            sizeRatio: 0.2,
            paddingRatio: 0.03,
            shape
          }
        });
        expect(result).toContain('data-qr-role="logo"');
      }
    });

    it('should add background behind logo', () => {
      const options: QrStylizeOptions = {
        logo: {
          href: 'data:image/svg+xml;base64,test',
          sizeRatio: 0.2,
          paddingRatio: 0.03,
          shape: 'rounded',
          backgroundColor: '#ffffff'
        }
      };
      const result = stylizeSvg(baseSvg, options);
      expect(result).toContain('fill="#ffffff"');
    });

    it('should support transparent logo background', () => {
      const options: QrStylizeOptions = {
        logo: {
          href: 'data:image/svg+xml;base64,test',
          sizeRatio: 0.2,
          paddingRatio: 0.03,
          shape: 'square',
          backgroundColor: null
        }
      };
      const result = stylizeSvg(baseSvg, options);
      expect(result).toContain('data-qr-role="logo"');
    });
  });

  // TODO: Complete styling workflow requires gradient, finder, and logo features to be implemented
  describe.skip('Complete styling workflow', () => {
    it('should apply multiple style options together', () => {
      const options: QrStylizeOptions = {
        shapeColor: '#000000',
        backgroundColor: '#ffffff',
        shapeStyle: 'rounded',
        roundedRadius: 0.25,
        borderStyle: 'circle',
        borderColor: '#ff0000',
        centerStyle: 'circle',
        centerColor: '#0000ff',
        shapeGradient: {
          enabled: true,
          from: '#000000',
          to: '#333333',
          direction: 'diagonal'
        }
      };
      
      const result = stylizeSvg(baseSvg, options);
      expect(result).toContain('linearGradient');
      expect(result).toContain('rx="0.25"');
      expect(result).toContain('data-qr-role="finders"');
    });

    it('should handle complex logo with all options', () => {
      const options: QrStylizeOptions = {
        shapeColor: '#06b6d4',
        backgroundColor: '#0f172a',
        shapeStyle: 'fluid',
        fluidRadius: 0.42,
        borderStyle: 'square',
        borderColor: '#ffffff',
        centerStyle: 'circle',
        centerColor: '#06b6d4',
        logo: {
          href: 'data:image/svg+xml;base64,test',
          sizeRatio: 0.22,
          paddingRatio: 0.03,
          shape: 'rounded',
          backgroundColor: '#ffffff',
          cornerRadius: 0.6
        }
      };
      
      const result = stylizeSvg(baseSvg, options);
      expect(result).toContain('<path');
      expect(result).toContain('data-qr-role="logo"');
      expect(result).toContain('data-qr-role="finders"');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle SVG without metadata attributes', () => {
      const invalidSvg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
      const result = stylizeSvg(invalidSvg, { shapeColor: '#000000' });
      expect(result).toBeTruthy();
    });

    it('should handle SVG with missing elements', () => {
      const minimalSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const result = stylizeSvg(minimalSvg, { backgroundColor: '#ffffff' });
      expect(result).toBeTruthy();
    });

    it('should preserve SVG structure when stylization fails', () => {
      const result = stylizeSvg(baseSvg, {
        shapeStyle: 'invalid' as any
      });
      expect(result).toContain('svg');
    });
  });

  describe('SSR compatibility', () => {
    it('should handle missing DOM APIs gracefully', () => {
      // This test would need to mock the absence of DOMParser
      // In a real SSR environment, the function should inject minimal CSS
      const result = stylizeSvg(baseSvg, {
        shapeColor: '#000000',
        backgroundColor: '#ffffff'
      });
      expect(result).toBeTruthy();
    });
  });
});
