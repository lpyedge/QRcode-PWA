# QRcode-PWA

- 中文（本檔） | English: [README.en.md](./README.en.md) | 日本語: [README.ja.md](./README.ja.md)

SvelteKit + Svelte 5 + Tailwind CSS + PWA.

> 📦 **デプロイガイド**： [Cloudflare Pages デプロイ手順](./cloudflare_deployed.ja.md)

## 特徴

- **クロスデバイス体験**：デスクトップ／タブレット／スマホで一貫した操作性を提供し、ライト／ダークテーマにも対応。
- **ZXing エンジン**：カスタム ZXing デコーダによりカメラ／画像からのスキャンを実現し、`qrcode-generator` が標準的な QR 行列を生成。
- **PWA 対応**：スマートなインストール促進、バックグラウンド更新通知、適応的なキャッシュ戦略を含む完全なオフライン機能。
- **Tailwind UI**：テーマとコンポーネントを集約し、qr.io 風のスタイルをベースに深いカスタマイズが可能。
- **多様なコンテンツテンプレート**：テキスト／URL／Wi‑Fi／メール／電話／SMS／vCard などの QR 仕様を内蔵し、ワンクリックで切り替え。
- **高度なスタイリング**：グラデーション塗り、モジュール形状の変換（ドット／角丸／流体）、検出パターンのカスタマイズ、中央ロゴのくり抜きに対応。

## アーキテクチャ概要

| モジュール | 説明 |
| --- | --- |
| `src/lib/pages/GeneratorPage.svelte` | QR 生成、コンテンツテンプレート（Text/URL/Wi‑Fi/Email/Tel/SMS/vCard）、スタイル設定、書き出し（PNG/SVG ダウンロード／コピー） |
| `src/lib/pages/ScannerPage.svelte` | カスタム QRDecoder によるカメラデコード／ファイル認識、デバイス切替とズーム制御をサポート |
| `src/lib/utils/qrcore.ts` | QR エンコード／デコードの中核ロジック。認識は ZXing ライブラリを利用 |
| `src/lib/utils/qrencode.ts` | QR 行列生成と基本的な SVG 出力 |
| `src/lib/utils/qrStylize.ts` | SVG の後処理スタイリング（グラデーション、形状変換、検出パターン、ロゴ統合） |
| `src/lib/utils/qrdecode.ts` | 複数戦略の QR デコーダ（Canvas/Image/Video/File 入力、適応的 ROI トラッキング） |
| `src/lib/utils/cameraQrScanner.ts` | カメラのライフサイクル管理（デバイス切替、ズーム、権限処理） |
| `src/lib/utils/payloads.ts` | QR ペイロード構築（各標準フォーマットの入力検証とエスケープ） |
| `src/lib/components/PwaHelper.svelte` | PWA インストールバナー（可否判定、ユーザー誘導、自動非表示）＋ Service Worker 更新通知（ポーリング／ワンクリック更新） |

## クイックスタート

```bash
npm install
npm run dev
```

その他のスクリプト：

```bash
npm run check   # svelte-check + TypeScript チェック
npm test        # Vitest ユニットテスト
npm run build   # 本番ビルド（Service Worker を自動生成）
npm run preview # ビルド成果物のプレビュー
```

VS Code には `npm: check` タスクが用意されており、`Terminal > Run Task` から実行できます。

## PWA とオフライン

### インストール促進

- 初回アクセス時、ブラウザが PWA インストールに対応している場合、下部にインストールバナーが表示されます。
- ユーザーは「今すぐインストール」または「後で」（7 日後に再表示）を選択できます。
- インストール後はブラウザの UI なしで、独立ウィンドウとして起動します。

### 更新通知

- Service Worker は 60 秒ごとに新バージョンをチェックします。
- 更新が見つかると、上部に通知バーを表示します。
- ユーザーは「今すぐ更新（リロード）」または「後で」を選択できます。

### オフラインキャッシュ戦略

- **プリキャッシュ**：ビルド時に静的アセット（JS/CSS/HTML/アイコン）を自動キャッシュ。
- **ランタイムキャッシュ**：
  - Google Fonts：長期キャッシュ（1 年）。
  - 動的リソース：必要に応じてキャッシュ。
- **フォールバック**：オフライン時はキャッシュ済みコンテンツを自動的に返します。

## カメラスキャンの注意

- 開発時は HTTP（`npm run dev`）がデフォルトです。HTTPS が必要な場合は、内蔵の `vite-plugin-mkcert` でローカル証明書を生成できます。
- ブラウザはカメラ利用に安全なコンテキスト（HTTPS または localhost）を要求します。`http://localhost` は許可されますが、LAN からのアクセスは HTTPS が必要です。
- フロント／リアカメラ切替、デバイス選択、デジタルズーム制御（対応端末）をサポートします。
- 適応的なスキャン戦略：検索モード（低頻度フルフレーム）／追跡モード（高頻度 ROI）／レスキュースキャン（定期フルフレーム）。

## テスト

本プロジェクトにはユニットテストが充実しています：

```bash
npm test                 # すべてのテストを実行
npm run test:ui          # Vitest UI
npm run test:coverage    # カバレッジレポート生成
```

テストファイルは `test/utils/` 配下：

- `payloads.test.ts` - ペイロード生成と検証（335+ テストケース）
- `qrStylize.test.ts` - SVG スタイリング
- `qrencode.test.ts` - QR エンコードと行列生成
- `qrdecode.test.ts` - QR デコーダの全メソッド

## ロードマップ

- [x] QR 生成（複数テンプレート + スタイル）
- [x] QR スキャン（カメラ + 画像アップロード）
- [x] PWA オフライン機能（インストール促進 + 更新通知）
- [x] 高度なスタイリング（グラデーション／形状／ロゴ）
- [x] テストカバレッジ
- [ ] 履歴のクラウド同期
- [ ] ブランドテーマ／フォント設定
- [ ] 多言語対応（i18n の基盤は完成済み）
