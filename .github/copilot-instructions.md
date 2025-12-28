
# Copilot instructions (QRcode-PWA)

## 專案概觀
- SvelteKit + Svelte 5 + Tailwind 的 PWA（Service Worker 由 `vite-plugin-pwa` 產生；UI 主要在 `src/lib/pages/*`）。
- QR 產生/風格化/匯出：`payloads.ts` → `qrencode.ts` → `qrStylize.ts` → `renderSvgToBlob.ts`。
- QR 掃描：`ScannerPage.svelte` → `cameraQrScanner.ts`（攝影機生命週期）→ `qrdecode.ts`（多策略解碼）→ `qrcore.ts`（ZXing decode + luminance buffer pool）。

## 目錄與路由慣例
- 路由薄殼在 `src/routes/*/+page.svelte`，通常只 import 對應的 `src/lib/pages/*.svelte`。
- Import alias：`$components` → `src/lib/components`、`$utils` → `src/lib/utils`（見 `svelte.config.js`）；測試另有 `$lib` alias（見 `vitest.config.ts`）。

## 常用指令（以 `package.json` 為準）
- `npm run dev`：本機開發（HTTP）。
- `npm run dev:https`：用 mkcert 開 HTTPS + `--host`，給「手機/區網」存取攝影機權限（見 `vite.config.ts`）。
- `npm run check`：`svelte-check`（VS Code 也有 task：`npm: check`）。
- `npm test`：Vitest（只跑 `test/**/*.test.ts`）。
- `npm run build` / `npm run preview`：打包與預覽。

## QR 相關修改點
- 新增/調整內容模板：改 `src/lib/utils/payloads.ts`（`buildPayload()` + `GeneratorSettings`）。
- 產生 SVG：`src/lib/utils/qrencode.ts`（輸出帶 `data-qr-*` 屬性，供 stylizer 依賴）。
- 套用樣式與 Logo：`src/lib/utils/qrStylize.ts`（會嚴格過濾顏色字串與 logo href；偏好 `data:`/`blob:` 以避免 canvas 匯出被 CORS 汙染）。
- 光柵匯出：`src/lib/utils/renderSvgToBlob.ts`（需要 browser；會限制最大畫布避免爆記憶體）。

## 掃描（攝影機/上傳）修改點
- 攝影機掃描控制：`src/lib/utils/cameraQrScanner.ts`（負責 getUserMedia、deviceId 切換、scan loop、狀態訂閱）。
- 解碼策略：`src/lib/utils/qrdecode.ts`（優先 BarcodeDetector；否則走 ZXing；含 ROI track/search/rescue 策略）。
- ZXing 核心與效能：`src/lib/utils/qrcore.ts`（影片路徑用 video luminance pool，停止掃描時可釋放）。

## PWA 與更新/安裝提示
- PWA 註冊/UI 都在 `src/lib/components/PwaHelper.svelte`；註冊行為由 `vite-plugin-pwa` 的 `registerType: 'prompt'` 驅動（見 `vite.config.ts`）。

## 測試與 Mock
- Vitest 設定在 `vitest.config.ts`，測試環境是 `node`。
- `test/mocks/zxing-mock.ts` 會在測試啟動時載入（`setupFiles`），提供 ZXing 的最小 mock；避免在單元測試中依賴實際 ZXing/WASM/DOM。
- `test/mocks/app-environment.js` 取代 `$app/environment` 以控制 `browser` 等旗標。

## i18n
- 翻譯透過 store `t`（`src/lib/i18n/index.ts`）使用：在 Svelte 裡以 `$t('path.to.key')` 取字串；新增文案主要改 `src/lib/i18n/zh.ts`。
