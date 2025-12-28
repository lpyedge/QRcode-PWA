#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const clientSrc = path.join(root, '.svelte-kit', 'output', 'client');
const serverSrc = path.join(root, '.svelte-kit', 'output', 'server');
const clientDest = path.join(root, '.svelte-kit', 'cloudflare');
const serverDest = path.join(root, 'functions');

async function rmrf(p) {
  try {
    await fs.promises.rm(p, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
}

async function copyDir(src, dest) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  await fs.promises.mkdir(dest, { recursive: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const link = await fs.promises.readlink(srcPath);
      try { await fs.promises.symlink(link, destPath); } catch (e) { /* ignore */ }
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  console.log('Preparing Cloudflare Pages output...');

  if (!fs.existsSync(clientSrc)) {
    console.error('Client build output not found:', clientSrc);
    process.exit(0);
  }

  await rmrf(clientDest);
  // We don't need serverDest (functions folder) for Advanced Mode with _worker.js
  // await rmrf(serverDest); 

  // 1. Copy client -> .svelte-kit/cloudflare
  await copyDir(clientSrc, clientDest);
  console.log('Copied client output to', clientDest);

  // 2. Copy server output into a subfolder to avoid clobbering client assets
  const serverOutDir = path.join(clientDest, '_server');
  await rmrf(serverOutDir);

  if (fs.existsSync(serverSrc)) {
    await copyDir(serverSrc, serverOutDir);
    console.log('Copied server output to', serverOutDir);

    // 3. Create Pages Advanced Mode entry: _worker.js
    const workerJs = path.join(clientDest, '_worker.js');
    const workerContent = `
import { Server } from './_server/index.js';
import { manifest } from './_server/manifest.js';

const server = new Server(manifest);

export default {
  async fetch(request, env, ctx) {
    return server.respond(request, {
      platform: { env, context: ctx, caches: globalThis.caches }
    });
  }
};
`;
    await fs.promises.writeFile(workerJs, workerContent);
    console.log('Wrote _worker.js for Pages Advanced Mode');
  } else {
    console.log('Server build output not found; skipping _worker.js generation');
  }

  console.log('Done. Publish directory: .svelte-kit/cloudflare');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
