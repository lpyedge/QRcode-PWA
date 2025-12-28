# QRcode-PWA

- 中文（本檔） | English: [README.en.md](./README.en.md) | 日本語: [README.ja.md](./README.ja.md)

SvelteKit + Svelte 5 + Tailwind CSS + PWA.

> 📦 **Deployment guide**: [Cloudflare Pages deployment instructions](./cloudflare_deployed.en.md)

## Features

- **Cross-device experience**: Consistent UX on desktop/tablet/mobile, with light/dark theme support.
- **ZXing engine**: A custom ZXing-based decoder enables scanning via camera and images, while `qrcode-generator` produces the standard QR matrix.
- **PWA ready**: Full offline support, including smart install prompts, background update notifications, and adaptive caching strategies.
- **Tailwind UI**: Centralized themes and components, making it easy to continue deep customization in a qr.io-like style.
- **Multiple payload templates**: Built-in QR formats for text, URL, Wi‑Fi, email, phone, SMS, and vCard, switchable in one click.
- **Advanced styling**: Gradient fills, module shape transforms (dots/rounded/fluid), finder customization, and center logo cutout.

## Architecture at a glance

| Module | Description |
| --- | --- |
| `src/lib/pages/GeneratorPage.svelte` | QR generation, payload templates (Text/URL/Wi‑Fi/Email/Tel/SMS/vCard), styling, and export (PNG/SVG download/copy) |
| `src/lib/pages/ScannerPage.svelte` | Uses a custom QRDecoder for camera decoding and file recognition; supports device switching and zoom control |
| `src/lib/utils/qrcore.ts` | Core QR encode/decode logic; uses the ZXing library for recognition |
| `src/lib/utils/qrencode.ts` | QR matrix generation and basic SVG output |
| `src/lib/utils/qrStylize.ts` | SVG post-processing for styling (gradients, shape transforms, finders, logo integration) |
| `src/lib/utils/qrdecode.ts` | Multi-strategy QR decoder (Canvas/Image/Video/File input, adaptive ROI tracking) |
| `src/lib/utils/cameraQrScanner.ts` | Camera lifecycle management (device switching, zoom, permission handling) |
| `src/lib/utils/payloads.ts` | QR payload builders (validation and escaping for all supported standard formats) |
| `src/lib/components/PwaHelper.svelte` | PWA install banner (capability detection, guidance, auto-hide logic) + Service Worker update notifications (polling and one-click refresh) |

## Quick start

```bash
npm install
npm run dev
```

More scripts:

```bash
npm run check   # svelte-check + TypeScript checks
npm test        # run Vitest unit tests
npm run build   # production build (generates service worker automatically)
npm run preview # preview build output
```

A VS Code task `npm: check` is provided and can be triggered via `Terminal > Run Task`.

## PWA & offline

### Install prompt

- On first visit, if the browser supports PWA installation, an install banner appears at the bottom.
- Users can choose “Install now” or “Later” (it will reappear after 7 days).
- After installation, the app runs in a standalone window without the browser UI.

### Update notification

- The Service Worker checks for a new version every 60 seconds.
- When an update is found, a notification bar appears at the top.
- Users can choose “Refresh now” to get the latest version or “Later” to keep using the current one.

### Offline caching strategy

- **Precache**: All static assets (JS/CSS/HTML/icons) are cached automatically during build.
- **Runtime cache**:
  - Google Fonts: long-term cache (1 year).
  - Dynamic resources: cached on demand.
- **Fallback**: When offline, cached content is returned automatically.

## Camera scanning notes

- During development the default is HTTP (`npm run dev`). If HTTPS is needed, the built-in `vite-plugin-mkcert` can generate local certificates.
- Browsers require a secure context (HTTPS or localhost) to access the camera; `http://localhost` is allowed, but LAN access requires HTTPS.
- Supports front/back camera switching, device selection, and digital zoom control (when supported by the device).
- Uses an adaptive scanning strategy: search mode (low-frequency full-frame), tracking mode (high-frequency ROI), and rescue scans (periodic full-frame).

## Testing

This project includes full unit test coverage:

```bash
npm test                 # run all tests
npm run test:ui          # Vitest UI
npm run test:coverage    # generate coverage report
```

Test files are under `test/utils/`:

- `payloads.test.ts` - Payload generation and validation (335+ test cases)
- `qrStylize.test.ts` - SVG styling features
- `qrencode.test.ts` - QR encoding and matrix generation
- `qrdecode.test.ts` - All QR decoder methods

## Roadmap

- [x] QR generator (multi-templates + styling)
- [x] QR scanner (camera + image upload)
- [x] PWA offline features (install prompt + update notification)
- [x] Advanced styling (gradient/shapes/logo)
- [x] Full test coverage
- [ ] Cloud sync for history
- [ ] Brand theme/font configuration
- [ ] Multi-language support (i18n base is ready)
