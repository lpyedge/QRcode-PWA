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

  // 2. Copy server -> .svelte-kit/cloudflare (merge)
  if (fs.existsSync(serverSrc)) {
    await copyDir(serverSrc, clientDest);
    console.log('Merged server output into', clientDest);

    // 3. Rename index.js -> _worker.js
    const indexJs = path.join(clientDest, 'index.js');
    const workerJs = path.join(clientDest, '_worker.js');
    if (fs.existsSync(indexJs)) {
      await fs.promises.rename(indexJs, workerJs);
      console.log('Renamed index.js to _worker.js');
    } else {
      console.warn('Warning: index.js not found in server output, cannot create _worker.js');
    }
  } else {
    console.log('Server build output not found; skipping server merge');
  }

  console.log('Done. Publish directory: .svelte-kit/cloudflare');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
