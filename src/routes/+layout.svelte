<script lang="ts">
  import '../app.postcss';
  import { t } from '$lib/i18n';
  import PwaHelper from '$lib/components/PwaHelper.svelte';

  const currentYear = new Date().getFullYear();
  const navLinks = [
    { href: '/', labelKey: 'nav.generator' },
    { href: '/scan', labelKey: 'nav.scan' },
    { href: '/about', labelKey: 'nav.about' }
  ];
  let mobileNavOpen = false;

  function toggleMobileNav() {
    mobileNavOpen = !mobileNavOpen;
  }

  function closeMobileNav() {
    mobileNavOpen = false;
  }
</script>

<svelte:head>
  <title>{$t('app.title')}</title>
  <meta name="description" content="{$t('app.description')}" />
  <meta name="keywords" content="{$t('app.keywords')}" />
</svelte:head>

<div class="min-h-screen bg-slate-900 text-slate-100">
  <header class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
    <a class="flex items-center gap-3 text-white" href="/" on:click={closeMobileNav}>
      <img src="/favicon.svg" alt="{$t('layout.appName')}" class="h-9 w-9" />
      <span class="text-2xl font-semibold tracking-wide">{$t('layout.appName')}</span>
    </a>
    <nav class="hidden gap-6 text-sm font-medium sm:flex">
      {#each navLinks as link}
        <a class="hover:text-cyan-300" href={link.href}>{$t(link.labelKey)}</a>
      {/each}
    </nav>
    <button
      type="button"
      class="rounded-xl border border-white/20 p-2 text-white transition hover:border-cyan-300 hover:text-cyan-200 sm:hidden"
      on:click={toggleMobileNav}
    aria-label={$t('common.openNav')}
    >
      <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </header>

  {#if mobileNavOpen}
    <nav class="mx-6 flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-sm font-medium text-white sm:hidden">
      {#each navLinks as link}
        <a class="rounded-xl px-3 py-2 hover:bg-white/10" href={link.href} on:click={closeMobileNav}>{$t(link.labelKey)}</a>
      {/each}
    </nav>
  {/if}

  <main class="mx-auto w-full max-w-6xl px-6 py-6">
    <slot />
  </main>

  <footer class="border-t border-white/10 px-6 py-6 text-center text-sm text-slate-400">
    © {currentYear} QRcode-PWA · {$t('footer.tagline')}
  </footer>
</div>

  <PwaHelper />
