declare module '$lib/components/*' {
  import type { SvelteComponentTyped } from 'svelte';
  const component: new (...args: any[]) => SvelteComponentTyped<any, any, any>;
  export default component;
}

