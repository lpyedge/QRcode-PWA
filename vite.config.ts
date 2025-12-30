import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [
    sveltekit(),
    mkcert(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'QRcode-PWA',
        short_name: 'QRcode-PWA',
        description: 'Cross-platform QR code generator and scanner',
        start_url: '/en/generate',
        scope: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0ea5e9',
        lang: 'en',
        icons: [
          // SVG favicon (keeps vector fallback)
          {
            src: '/favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any'
          },
          // Recommended raster icons for installability (Edge/Chrome expect PNGs)
          {
            src: '/icons/icon-192.png',
            type: 'image/png',
            sizes: '192x192'
          },
          {
            src: '/icons/icon-512.png',
            type: 'image/png',
            sizes: '512x512'
          },
          // maskable icon (optional but recommended for proper home-screen display)
          {
            src: '/icons/icon-512-maskable.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        navigateFallback: '/',
        // Cache runtime resources
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Add SKIP_WAITING message handler
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true
      }
    }),
    {
      name: 'zxing-src-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          try {
            const url = typeof req === 'object' && req !== null && 'url' in req && typeof (req as { url?: unknown }).url === 'string'
              ? (req as { url?: string }).url ?? ''
              : '';
            if (url.startsWith('/node_modules/@zxing/src/')) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/javascript');
              res.end('// zxing source not available in dev server: fallback stub');
              return;
            }
          } catch (e) {
            // ignore
          }
          next();
        });
      }
    }
  ],
  optimizeDeps: {
    include: ['@zxing/library'],
    esbuildOptions: {
      sourcemap: false
    }
  },
  ssr: {
    noExternal: ['@zxing/library']
  },
  server: {
    host: '0.0.0.0',
    fs: {
      allow: ['..']
    }
  },
  build: {
    sourcemap: false
  }
});
