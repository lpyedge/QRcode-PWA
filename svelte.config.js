import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  kit: {
    adapter: adapter(),
    alias: {
      $components: './src/lib/components',
      $utils: './src/lib/utils'
    }
  },
  preprocess: [vitePreprocess({ postcss: true })]
};

export default config;
