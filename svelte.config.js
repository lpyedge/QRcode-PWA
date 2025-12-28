import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    alias: {
      $components: './src/lib/components',
      $utils: './src/lib/utils'
    }
  },
  preprocess: [vitePreprocess({ postcss: true })]
};

export default config;
