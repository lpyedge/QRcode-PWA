<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  export let options: Array<{ id: string; label: string; icon: string }> = [];
  export let selected: string | number | null = null;
  export let columns: number = 3;
  export let iconMode: 'fill' | 'stroke' = 'fill';

  const dispatch = createEventDispatcher<{ select: string }>();
  let showMobile = false;

  function choose(id: string) {
    dispatch('select', id);
  }
  function openMobile() {
    showMobile = true;
  }
  function closeMobile() {
    showMobile = false;
  }
</script>

<div class="w-full min-h-[72px]" {...$$restProps}>
  <!-- Mobile compact header -->
  <div class="md:hidden mb-2 flex items-center justify-between">
    <div class="flex items-center gap-3">
      {#if options.find(o => o.id === selected)}
        <svg viewBox="0 0 16 16" class="h-5 w-5"><path d={options.find(o => o.id === selected)?.icon} fill="currentColor" /></svg>
        <span class="text-sm text-slate-200">{options.find(o => o.id === selected)?.label}</span>
      {:else}
        <span class="text-sm text-slate-200">{$t('components.stylePicker.noneSelected')}</span>
      {/if}
    </div>
    <button type="button" on:click={openMobile} class="text-xs text-slate-300">{$t('components.stylePicker.mobileToggle')}</button>
  <!-- Desktop/tablet: grid with min-width per column -->
    </div>

  <!-- Desktop/tablet: grid with min-width per column -->
  <div class="hidden md:grid gap-3 w-full" style={`grid-template-columns: repeat(${columns}, minmax(84px, 1fr))`}>
    {#each options as opt}
      <button
        type="button"
        class={`w-full flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 text-xs transition text-center min-h-[72px] ${selected === opt.id ? 'border-cyan-400 ring-2 ring-cyan-400/20 text-white' : 'border-white/10 text-slate-300 hover:border-white/30'}`}
        on:click={() => choose(opt.id)}
        aria-label={$t('components.stylePicker.ariaLabel')}
      >
        <svg viewBox="0 0 16 16" class="h-7 w-7 text-current">
          {#if iconMode === 'stroke'}
            <path d={opt.icon} fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          {:else}
            <path d={opt.icon} fill="currentColor" />
          {/if}
        </svg>
        <div class="text-xs mt-1 text-slate-200 truncate">{opt.label}</div>
      </button>
    {/each}
  </div>
  

  {#if showMobile}
    <div class="fixed inset-0 z-50 flex items-end md:hidden">
      <div class="w-full rounded-t-3xl bg-slate-900/95 p-4 shadow-xl">
        <div class="grid grid-cols-4 gap-2">
          {#each options as opt}
            <button
              type="button"
              class="flex flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-xs text-slate-300"
              on:click={() => { choose(opt.id); closeMobile(); }}
            >
              <svg viewBox="0 0 16 16" class="h-6 w-6"><path d={opt.icon} fill="currentColor" /></svg>
              <div class="text-xs mt-1">{opt.label}</div>
            </button>
          {/each}
        </div>
        <div class="mt-4 text-right">
          <button class="text-xs text-cyan-300" on:click={closeMobile}>{$t('components.stylePicker.close')}</button>
        </div>
      </div>
    </div>
  {/if}
</div>
