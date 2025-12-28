# QRcode-PWA

SvelteKit + Svelte 5 + Tailwind CSS + PWA.

## Features

-  **跨终端体验**：桌面、平板、手机均保持一致交互并适配深浅色。
-  **ZXing引擎**：自定义 ZXing 解码器提供摄像头/图片扫码能力，`qrcode-generator` 负责生成标准二维码矩阵。
-  **PWA Ready**：完整的离线功能支持，包括智能安装提示、后台更新通知、自适应缓存策略。
-  **Tailwind UI**：集中化的主题与组件，便于继续沿用 qr.io 风格进行深度定制。
-  **多内容模板**：内置文本、链接、Wi-Fi、邮件、电话、短信与 vCard 等二维码规范，一键切换。
-  **高级样式化**：支持渐变填充、模块形状变换（圆点/圆角/流体）、定位点自定义、中心 Logo 挖空。

## 架构速览

| 模块 | 说明 |
| --- | --- |
| `src/lib/pages/GeneratorPage.svelte` | 负责二维码生成、内容模板（文本/链接/Wi-Fi/Email/Tel/SMS/vCard）、样式与导出（PNG/SVG 下载/复制） |
| `src/lib/pages/ScannerPage.svelte` | 调用自定义 QRDecoder 进行摄像头解码、文件识别、支持设备切换与变焦控制 |
| `src/lib/utils/qrcore.ts` | 核心 QR 编码/解码逻辑，使用 ZXing 库进行二维码识别 |
| `src/lib/utils/qrencode.ts` | QR 矩阵生成与基础 SVG 输出 |
| `src/lib/utils/qrStylize.ts` | SVG 后处理样式化（渐变、形状变换、定位点、Logo 集成） |
| `src/lib/utils/qrdecode.ts` | 多策略 QR 解码器（Canvas/Image/Video/File 输入支持，自适应 ROI 跟踪） |
| `src/lib/utils/cameraQrScanner.ts` | 摄像头生命周期管理（设备切换、变焦、权限处理） |
| `src/lib/utils/payloads.ts` | QR 码载荷构建器（所有标准格式的输入验证与转义） |
| `src/lib/components/PwaHelper.svelte` | PWA 安装横幅（检测安装能力、用户引导、自动隐藏逻辑） Service Worker 更新通知（后台轮询、一键刷新）|

## 快速开始

```bash
npm install
npm run dev
```

更多脚本：

```bash
npm run check   # svelte-check + ts 校验
npm test        # 运行 Vitest 单元测试
npm run build   # 生产构建（自动生成 service worker）
npm run preview # 预览构建产物
```

VS Code 已提供 `npm: check` 任务，可通过 `Terminal > Run Task` 直接触发。

## PWA & 离线功能

### 安装提示
- 首次访问时，如果浏览器支持安装 PWA，会在底部显示安装横幅
- 用户可选择"立即安装"或"稍后再说"（7 天后重新显示）
- 安装后应用以独立窗口运行，无浏览器导航栏

### 更新通知
- Service Worker 每 60 秒检查一次新版本
- 发现更新后在顶部显示通知条
- 用户可选择"立即刷新"获取最新版本或"稍后"继续使用当前版本

### 离线缓存策略
- **预缓存**：构建时自动缓存所有静态资源（JS/CSS/HTML/图标）
- **运行时缓存**：
  - Google Fonts：长期缓存（1 年）
  - 动态资源：按需缓存
- **兜底策略**：离线时自动返回缓存内容

## 摄像头扫码提示

- 开发阶段默认使用 HTTP（`npm run dev`）。若需 HTTPS 可使用内置的 `vite-plugin-mkcert` 自动生成本地证书。
- 浏览器要求安全上下文（HTTPS 或 localhost）才能调起摄像头；本地 `http://localhost` 允许，局域网访问需 HTTPS。
- 支持前后摄像头切换、设备选择、数字变焦控制（设备支持时）。
- 采用自适应扫描策略：搜索模式（低频全幅） 跟踪模式（高频 ROI） 救援扫描（周期性全幅）。

## 测试

项目包含完整的单元测试覆盖：

```bash
npm test                    # 运行所有测试
npm run test:ui            # Vitest UI 界面
npm run test:coverage      # 生成覆盖率报告
```

测试文件位于 `test/utils/` 目录：
- `payloads.test.ts` - 载荷生成与验证（335+ 测试用例）
- `qrStylize.test.ts` - SVG 样式化功能
- `qrencode.test.ts` - QR 编码与矩阵生成
- `qrdecode.test.ts` - QR 解码器所有方法

## 路线图

- [x] 二维码生成器（多模板 + 样式）
- [x] 二维码扫码器（摄像头 + 图像上传）
- [x] PWA 离线功能（安装提示 + 更新通知）
- [x] 高级样式化（渐变/形状/Logo）
- [x] 完整测试覆盖
- [ ] 历史记录云同步
- [ ] 品牌主题/字体配置
- [ ] 多语言支持（i18n 基础已完成）

