<script lang="ts">
  import { t } from '$lib/i18n';

  const features = [
    { title: $t('about.features.f1.title'), body: $t('about.features.f1.body') },
    { title: $t('about.features.f2.title'), body: $t('about.features.f2.body') },
    { title: $t('about.features.f3.title'), body: $t('about.features.f3.body') },
  ];

  const stats = [
    { label: $t('about.stats.crossPlatform'), value: '360°' },
    { label: $t('about.stats.fps'), value: '60fps' },
    { label: $t('about.stats.max'), value: '4K' },
    { label: $t('about.stats.offline'), value: '100%' },
  ];
</script>

<section class="flex flex-col gap-12 py-10">
  <div class="grid gap-10 lg:grid-cols-[3fr,2fr] lg:items-center">
    <div class="space-y-6">
      <p class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-widest text-cyan-300/80">
        {$t('about.hero.tagline')}
      </p>
      <h1 class="text-4xl font-bold leading-tight text-slate-50 md:text-5xl">
        {$t('about.hero.title')}
      </h1>
      <p class="text-lg text-slate-300">
        {$t('about.hero.body')}
      </p>
      <div class="flex flex-wrap gap-4">
        <a href="/" class="rounded-full bg-cyan-500 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400">
          {$t('about.hero.ctaStart')}
        </a>
        <a href="/scan" class="rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200">
          {$t('about.hero.ctaScan')}
        </a>
      </div>
    </div>
    <div class="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900/0 p-6 shadow-2xl shadow-cyan-500/20">
      <p class="text-sm uppercase tracking-[0.35em] text-cyan-200">{$t('about.pwa.ready')}</p>
      <p class="mt-4 text-4xl font-semibold text-slate-50">{$t('about.pwa.response')}</p>
      <p class="mt-2 text-sm text-slate-400">{$t('about.pwa.hint')}</p>
      <div class="mt-10 grid grid-cols-2 gap-4 text-center text-sm text-slate-300">
        {#each stats as stat}
          <div class="rounded-2xl border border-white/10 p-4">
            <p class="text-2xl font-semibold text-slate-50">
              {stat.value}
            </p>
            <p class="mt-1">{stat.label}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <section class="grid gap-6 md:grid-cols-3">
    {#each features as feature}
      <article class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 class="text-xl font-semibold text-white">{feature.title}</h3>
        <p class="mt-2 text-sm text-slate-300">{feature.body}</p>
      </article>
    {/each}
  </section>

  <section class="grid gap-6 lg:grid-cols-3">
    <article class="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
      <h3 class="text-xl font-semibold text-white">{$t('about.sections.install.title')}</h3>
      <p class="mt-2 text-sm text-slate-300">{$t('about.sections.install.body')}</p>
    </article>
    <article class="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
      <h3 class="text-xl font-semibold text-white">{$t('about.sections.https.title')}</h3>
      <p class="mt-2 text-sm text-slate-300">{$t('about.sections.https.body')}</p>
    </article>
    <article class="rounded-3xl border border-white/10 bg-slate-900/40 p-6">
      <h3 class="text-xl font-semibold text-white">{$t('about.sections.extend.title')}</h3>
      <p class="mt-2 text-sm text-slate-300">{$t('about.sections.extend.body')}</p>
    </article>
  </section>
</section>
