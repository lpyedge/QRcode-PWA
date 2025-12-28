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
  await rmrf(serverDest);

  await copyDir(clientSrc, clientDest);
  console.log('Copied client output to', clientDest);

  if (fs.existsSync(serverSrc)) {
    await copyDir(serverSrc, serverDest);
    console.log('Copied server output to', serverDest);
  } else {
    console.log('Server build output not found; skipping functions copy');
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
