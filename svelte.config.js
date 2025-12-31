import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: false,
      strict: true
    }),
    alias: {
      $components: './src/lib/components',
      $utils: './src/lib/utils'
    },
    prerender: {
      entries: [
        '*',
        '/en/scan', '/en/about', '/en/generate',
        '/ja/scan', '/ja/about', '/ja/generate',
        '/zh/scan', '/zh/about', '/zh/generate'
      ]
    }
  },
  preprocess: [vitePreprocess({ postcss: true })]
};

export default config;
