This project uses `@sveltejs/adapter-static` to produce a purely static site that can be deployed directly to Cloudflare Pages.

## Method 1 — GitHub automatic deployment (recommended)

> Best for ongoing maintenance: each push automatically builds and deploys (CI/CD).

- In the Cloudflare Dashboard go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**, and select your GitHub repository.
- In the project settings set **Build command** = `npm run build`, **Build output directory** = `build`, and **Production branch** = `main` (adjust according to your project).
- Click **Save and Deploy**; subsequent pushes to the configured branch will trigger builds and updates to your site.

> If you don't see your repository, it is usually a GitHub authorization or organization permission issue. Workarounds include forking to your personal account or reconfiguring GitHub's authorization scopes for Cloudflare and reconnecting.

---

## Method 2 — Direct Upload (manual / quick test)

> Useful for quick verification or when you prefer to control the build process yourself: build locally or in CI, then upload the output to Pages.

1. Build the static output locally (for example `npm install`, then `npm run build`) and confirm the output directory is `build/`.
2. In the Cloudflare Dashboard go to **Workers & Pages** → **Create application** → **Pages** → **Use direct upload**, create the project, and drag-and-drop your output directory.
3. After deployment completes, the project will be available at a `*.pages.dev` URL by default.

> Note: Cloudflare's docs state that a Direct Upload project cannot be switched to Git integration later; to switch to automatic deployment you will usually need to create a new Pages project and connect it to Git.

---

## Common: Custom domains (applies to both methods)

The entry point for custom domains is the same: open the Pages project, go to **Custom domains**, click **Set up a domain / Set up a custom domain**, enter the domain you want to bind, and enable it.

For binding an apex domain (for example `example.com`) you must add the domain to a Cloudflare zone and point the nameservers to Cloudflare first — Cloudflare will then provision the necessary DNS records (or instruct you which records to add), such as a CNAME to `<YOUR_SITE>.pages.dev`.

- Path: **Workers & Pages** → select your Pages project → **Custom domains** → **Set up a domain**.
- For subdomains (for example `www.example.com` or `app.example.com`) you typically add a CNAME that points to your `<YOUR_SITE>.pages.dev` target.

---

## Which method to choose?

- If you want “push-to-deploy” with traceable versions, choose GitHub automatic deployment.
- If you just want to upload the `build/` output for quick verification or prefer to manage the build yourself, choose Direct Upload.

