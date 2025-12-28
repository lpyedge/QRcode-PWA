このプロジェクトは `@sveltejs/adapter-static` を使用して純粋な静的ファイルを生成します。生成されたサイトはそのまま Cloudflare Pages にデプロイできます。

## 方法1 — GitHub 自動デプロイ（推奨）

> 継続的なメンテナンスに最適：push ごとに自動でビルドとデプロイが行われます（CI/CD）。

- Cloudflare ダッシュボードで **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** を選び、GitHub リポジトリを接続します。
- プロジェクト設定で **Build command** = `npm run build`、**Build output directory** = `build`、**Production branch** = `main`（プロジェクトに合わせて調整してください）。
- **Save and Deploy** をクリックすると、以降そのブランチへの push により自動的にビルドとデプロイが実行されます。

> リポジトリが見えない場合は、GitHub の認可や組織権限の問題であることが多いです。回避策としては個人アカウントへフォークする、または Cloudflare に付与する GitHub 権限を調整して再接続する等があります。

---

## 方法2 — 手動アップロード（Direct Upload／クイックテスト）

> 素早く検証したい場合や、ビルドプロセスを自分で管理したい場合に有効：ローカルや CI でビルドした静的出力を Pages にアップロードします。

1. ローカルで出力をビルドします（例：`npm install`、`npm run build`）そして出力ディレクトリが `build/` であることを確認します。
2. Cloudflare ダッシュボードで **Workers & Pages** → **Create application** → **Pages** → **Use direct upload** を選び、プロジェクトを作成して出力ディレクトリをドラッグ＆ドロップでアップロードします。
3. デプロイが完了すると、デフォルトで `*.pages.dev` の URL が割り当てられます。

> 注意：公式ドキュメントによれば Direct Upload で作成したプロジェクトは後から Git 連携に切り替えられない場合があります。自動デプロイに移行したい場合は、新しく Pages プロジェクトを作成し Git 連携にする必要があることが多いです。

---

## 共通：カスタムドメイン（どちらの方法でも適用）

カスタムドメインの設定は共通です。対象の Pages プロジェクトで **Custom domains** に入り、**Set up a domain / Set up a custom domain** を選んでバインドしたいドメインを入力して有効化します。

apex ドメイン（例：`example.com`）をバインドする場合は、まずドメインを Cloudflare のゾーンに追加し、ネームサーバーを Cloudflare に向ける必要があります。これにより Cloudflare が必要な DNS レコード（例：`<YOUR_SITE>.pages.dev` を指す CNAME 等）を設定または案内します。

- 操作パス：**Workers & Pages** → 対象の Pages プロジェクト → **Custom domains** → **Set up a domain**。
- サブドメイン（例：`www.example.com` / `app.example.com`）を設定する場合は、通常 CNAME を `<YOUR_SITE>.pages.dev` に向けて追加します。

---

## どちらを選ぶべきか？

- 「プッシュで即デプロイ、バージョン管理された履歴を残したい」なら GitHub 自動デプロイを選んでください。
- 「まずは `build/` をアップして検証したい」あるいは「ビルドを自分で管理したい」なら Direct Upload を選んでください。

