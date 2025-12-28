本專案使用 `@sveltejs/adapter-static` 產出純靜態檔案，可以直接部署到 Cloudflare Pages。

## 方式一：GitHub 自動部署（推薦）

適用於長期維護：每次 push 會自動建置並部署（CI/CD）。

- Cloudflare Dashboard → **Workers \& Pages** → **Create application** → **Pages** → **Connect to Git**，選擇你的 GitHub 倉庫。
- 在專案設定 Build：Build command = `npm run build`、Build output directory = `build`、Production branch = `main`（其餘依專案實際情況）。
- 點 **Save and Deploy** 後，後續 push 到設定的分支會持續觸發部署並更新站點。

> 若看不到倉庫，多半是 GitHub 授權或組織權限問題；處理方式包含 fork 到個人帳號、或調整 GitHub 對 Cloudflare 的授權範圍後再重新連線。

***

## 方式二：手動上傳（Direct Upload／快速測試）

適用於快速驗證或你想自己掌控建置流程：先在本地/CI 建好靜態檔，再把產物上傳到 Pages。

1. 本地建置產物（例如 `npm install`、`npm run build`），確認輸出目錄為 `build/`。
2. Cloudflare Dashboard → **Workers \& Pages** → **Create application** → **Pages** → **Use direct upload**，建立專案並拖放上傳輸出目錄（Drag and drop）。
3. 部署完成後，專案會提供 `*.pages.dev` 網址作為預設存取入口。

> 注意：官方文件提到 Direct Upload 專案「無法切換成 Git integration」，若未來要改成自動部署，通常需要建立新的 Pages 專案改用 Git 方式。

***

## 通用：自訂網域（兩種方式都適用）

自訂網域的入口一致：到該 Pages 專案內的 **Custom domains**，點 **Set up a domain / Set up a custom domain**，輸入要綁定的網域並啟用即可。
官方也說明若要綁定 apex domain（例如 `example.com`），需要先把網域加入 Cloudflare zone 並完成 nameserver 指向，系統才會進一步建立所需的 DNS 記錄（如 CNAME 指向 `<YOUR_SITE>.pages.dev`）。

- 操作路徑：**Workers \& Pages** → 選你的 Pages 專案 → **Custom domains** → **Set up a domain**。
- 綁定子網域（如 `www.example.com` / `app.example.com`）時，通常以 CNAME 指向你的 `<YOUR_SITE>.pages.dev` 目標來完成解析。

***

## 何時選哪種？

- 想要「推送即部署、可追溯版本」：選 GitHub 自動部署。
- 只想「先把 build/ 丟上去驗證」或「建置不想交給 Cloudflare」：選 Direct Upload。