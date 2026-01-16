<script lang="ts">
  import '../app.postcss';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import {
    t,
    locale,
    locales,
    localeMeta,
    defaultLocale,
    normalizeLocale,
    stripLocaleFromPath,
    buildLocalePath,
    translate,
    type Locale,
  } from '$lib/i18n';
  import PwaHelper from '$lib/components/PwaHelper.svelte';
  import Dropdown from '$lib/components/Dropdown.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

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
  };

  let mobileNavOpen = false;
  let currentLocale = normalizeLocale();
  let routePath = '/';
  let canonicalPath = '/generate';
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
  let suggestedLocale: Locale | null = null;
  let promptDismissed = false;
  let promptReady = false;
  let promptMessage = '';
  let promptAction = '';
  let promptCloseLabel = '';

  const LANGUAGE_PROMPT_KEY = 'qr-language-prompt-dismissed';

  const languageOptions = locales.map((l) => ({
    value: l,
    label: localeMeta[l].label,
  }));

  function detectPreferredLocale(): Locale | null {
    if (!browser) return null;
    const languageList = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const lang of languageList) {
      const value = String(lang || '').toLowerCase();
      if (value.startsWith('zh')) return 'zh';
      if (value.startsWith('ja')) return 'ja';
      if (value.startsWith('en')) return 'en';
    }
    return null;
  }

  function updateSuggestedLocale() {
    if (!browser || promptDismissed) {
      suggestedLocale = null;
      return;
    }
    const preferred = detectPreferredLocale();
    suggestedLocale = preferred && preferred !== currentLocale ? preferred : null;
  }

  function dismissLanguagePrompt() {
    suggestedLocale = null;
    promptDismissed = true;
    try {
      localStorage.setItem(LANGUAGE_PROMPT_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }

  function formatPromptText(template: string, langLabel: string) {
    return template.split('{lang}').join(langLabel);
  }

  onMount(() => {
    try {
      promptDismissed = localStorage.getItem(LANGUAGE_PROMPT_KEY) === '1';
    } catch {
      promptDismissed = false;
    }
    promptReady = true;
    updateSuggestedLocale();
  });

  function switchLanguage() {
    if (suggestedLocale) {
      dismissLanguagePrompt();
      goto(buildLocalePath(suggestedLocale, canonicalPath));
    }
  }

  function handleLanguageChange(event: CustomEvent<Locale>) {
    const newLocale = event.detail;
    const newPath = buildLocalePath(newLocale, canonicalPath);
    dismissLanguagePrompt();
    goto(newPath);
  }

  function toggleMobileNav() {
    mobileNavOpen = !mobileNavOpen;
  }

  function closeMobileNav() {
    mobileNavOpen = false;
  }

  $: currentLocale = normalizeLocale($page.params.lang);
  $: locale.set(currentLocale);
  $: if (browser) document.documentElement.lang = localeMeta[currentLocale].htmlLang;
  $: if (browser && promptReady) updateSuggestedLocale();

  $: routePath = stripLocaleFromPath($page.url.pathname);
  $: siteOrigin =
    import.meta.env.VITE_SITE_URL && import.meta.env.VITE_SITE_URL.trim()
      ? import.meta.env.VITE_SITE_URL.replace(/\/$/, '')
      : $page.url.origin;
  $: canonicalPath = routePath === '/' ? '/generate' : routePath;
  $: seoKey = seoRouteMap[canonicalPath] ?? 'seo.generator';
  $: pageTitle = $t(`${seoKey}.title`, $t('app.title'));
  $: pageDescription = $t(`${seoKey}.description`, $t('app.description'));
  $: pageKeywords = $t(`${seoKey}.keywords`, $t('app.keywords'));
  $: canonicalHref = `${siteOrigin}${buildLocalePath(currentLocale, canonicalPath)}`;
  $: alternateLinks = locales.map((localeValue) => ({
    hreflang: localeMeta[localeValue].hreflang,
    href: `${siteOrigin}${buildLocalePath(localeValue, canonicalPath)}`,
  }));
  // x-default should point to the default locale (en), not a non-existent /language path
  $: xDefaultHref = `${siteOrigin}${buildLocalePath(defaultLocale, canonicalPath)}`;
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
  $: if (suggestedLocale) {
    const label = localeMeta[suggestedLocale].label;
    promptMessage = formatPromptText(
      translate(suggestedLocale, 'layout.languagePrompt.message', $t('layout.languagePrompt.message')),
      label
    );
    promptAction = formatPromptText(
      translate(suggestedLocale, 'layout.languagePrompt.action', $t('layout.languagePrompt.action')),
      label
    );
    promptCloseLabel = translate(suggestedLocale, 'layout.languagePrompt.close', $t('layout.languagePrompt.close'));
  } else {
    promptMessage = '';
    promptAction = '';
    promptCloseLabel = '';
  }
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
  {#if suggestedLocale}
    <div class="relative z-50 flex items-center justify-center gap-4 border-b border-white/10 bg-slate-800 px-4 py-2 text-sm text-white">
      <span>
        {promptMessage}
      </span>
      <div class="flex items-center gap-4">
        <button class="font-bold text-cyan-300 hover:text-cyan-200" on:click={switchLanguage}>
          {promptAction}
        </button>
        <button class="text-slate-400 hover:text-white" on:click={dismissLanguagePrompt} aria-label={promptCloseLabel || $t('layout.languagePrompt.close')}>
          X
        </button>
      </div>
    </div>
  {/if}
  <header class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
    <a class="flex items-center gap-3 text-white" href={homeHref} on:click={closeMobileNav}>
      <img src="/favicon.svg" alt="{$t('layout.appName')}" class="h-9 w-9" />
      <span class="text-2xl font-semibold tracking-wide">{$t('layout.appName')}</span>
    </a>
    <nav class="hidden gap-6 text-sm font-medium sm:flex sm:items-center">
      {#each navLinks as link}
        <a class="hover:text-cyan-300" href={link.href}>{$t(link.labelKey)}</a>
      {/each}
      <div class="w-32">
        <Dropdown
          options={languageOptions}
          value={currentLocale}
          on:change={handleLanguageChange}
          triggerClass="flex w-full items-center justify-between rounded-xl border border-white/20 bg-transparent px-3 py-2 text-left text-sm text-white transition hover:border-cyan-300 focus:outline-none"
          menuClass="bg-slate-900 border border-white/10 text-white"
          optionClass="hover:bg-white/10"
        />
      </div>
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
      <div class="px-3 py-2">
        <Dropdown
          options={languageOptions}
          value={currentLocale}
          on:change={handleLanguageChange}
          triggerClass="flex w-full items-center justify-between rounded-xl border border-white/20 bg-transparent px-3 py-2 text-left text-sm text-white transition hover:border-cyan-300 focus:outline-none"
          menuClass="bg-slate-900 border border-white/10 text-white"
          optionClass="hover:bg-white/10"
        />
      </div>
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
