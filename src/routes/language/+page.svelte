<script lang="ts">
  import { t, locales, localeMeta, buildLocalePath } from '$lib/i18n';

  const languageLinks = locales.map((locale) => ({
    code: locale,
    label: localeMeta[locale].label,
    href: buildLocalePath(locale, '/generate'),
  }));
</script>

<section class="mx-auto flex w-full max-w-3xl flex-col gap-6 py-10">
  <header class="space-y-3">
    <p class="text-xs uppercase tracking-[0.4em] text-cyan-300">{$t('language.eyebrow')}</p>
    <h1 class="text-3xl font-semibold text-white">{$t('language.title')}</h1>
    <p class="text-sm text-slate-300">{$t('language.description')}</p>
  </header>

  <div class="grid gap-4 md:grid-cols-3">
    {#each languageLinks as link}
      <a
        class="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-left text-white transition hover:border-cyan-300 hover:bg-white/10"
        href={link.href}
      >
        <div class="text-lg font-semibold">{link.label}</div>
        <div class="mt-1 text-xs uppercase tracking-[0.3em] text-slate-400">{link.code}</div>
      </a>
    {/each}
  </div>
</section>
