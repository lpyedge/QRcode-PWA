<script lang="ts">
  import '../app.postcss';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import {
    t,
    locale,
    locales,
    localeMeta,
    normalizeLocale,
    stripLocaleFromPath,
    buildLocalePath,
  } from '$lib/i18n';
  import PwaHelper from '$lib/components/PwaHelper.svelte';

  const currentYear = new Date().getFullYear();
  const navItems = [
    { path: '/generate', labelKey: 'nav.generator' },
    { path: '/scan', labelKey: 'nav.scan' },
    { path: '/about', labelKey: 'nav.about' },
  ];
  const seoRouteMap: Record<string, string> = {
    '/generate': 'seo.generator',
    '/scan': 'seo.scan',
    '/about': 'seo.about',
    '/language': 'seo.language',
  };

  let mobileNavOpen = false;
  let currentLocale = normalizeLocale();
  let routePath = '/';
  let canonicalPath = '/generate';
  let isLanguagePage = false;
  let siteOrigin = '';
  let seoKey = 'seo.generator';
  let pageTitle = '';
  let pageDescription = '';
  let pageKeywords = '';
  let canonicalHref = '';
  let alternateLinks: Array<{ hreflang: string; href: string }> = [];
  let xDefaultHref = '';
  let ogImageUrl = '';
  let jsonLd = '';
  let homeHref = '';
  let navLinks: Array<{ href: string; labelKey: string }> = [];

  function toggleMobileNav() {
    mobileNavOpen = !mobileNavOpen;
  }

  function closeMobileNav() {
    mobileNavOpen = false;
  }

  $: currentLocale = normalizeLocale($page.params.lang);
  $: locale.set(currentLocale);
  $: if (browser) document.documentElement.lang = localeMeta[currentLocale].htmlLang;

  $: routePath = stripLocaleFromPath($page.url.pathname);
  $: siteOrigin =
    import.meta.env.VITE_SITE_URL && import.meta.env.VITE_SITE_URL.trim()
      ? import.meta.env.VITE_SITE_URL.replace(/\/$/, '')
      : $page.url.origin;
  $: canonicalPath = routePath === '/' ? '/generate' : routePath;
  $: isLanguagePage = canonicalPath === '/language';
  $: seoKey = seoRouteMap[canonicalPath] ?? 'seo.generator';
  $: pageTitle = $t(`${seoKey}.title`, $t('app.title'));
  $: pageDescription = $t(`${seoKey}.description`, $t('app.description'));
  $: pageKeywords = $t(`${seoKey}.keywords`, $t('app.keywords'));
  $: canonicalHref = isLanguagePage
    ? `${siteOrigin}/language`
    : `${siteOrigin}${buildLocalePath(currentLocale, canonicalPath)}`;
  $: alternateLinks = isLanguagePage
    ? []
    : locales.map((localeValue) => ({
        hreflang: localeMeta[localeValue].hreflang,
        href: `${siteOrigin}${buildLocalePath(localeValue, canonicalPath)}`,
      }));
  $: xDefaultHref = `${siteOrigin}/language`;
  $: ogImageUrl = `${siteOrigin}/icons/icon-512.png`;
  $: jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: pageTitle,
    url: canonicalHref,
    description: pageDescription,
    inLanguage: localeMeta[currentLocale].hreflang,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
  });

  $: homeHref = buildLocalePath(currentLocale, '/generate');
  $: navLinks = navItems.map((item) => ({
    href: buildLocalePath(currentLocale, item.path),
    labelKey: item.labelKey,
  }));
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content={pageKeywords} />
  <link rel="canonical" href={canonicalHref} />
  {#each alternateLinks as link}
    <link rel="alternate" hreflang={link.hreflang} href={link.href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={xDefaultHref} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:url" content={canonicalHref} />
  <meta property="og:site_name" content={$t('layout.appName')} />
  <meta property="og:image" content={ogImageUrl} />
  <meta property="og:image:alt" content={pageTitle} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={ogImageUrl} />
  <script type="application/ld+json">{jsonLd}</script>
</svelte:head>

<div class="min-h-screen bg-slate-900 text-slate-100">
  <header class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
    <a class="flex items-center gap-3 text-white" href={homeHref} on:click={closeMobileNav}>
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
