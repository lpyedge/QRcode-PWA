<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  import type { GeneratorSettings } from '$utils/payloads';
  import Dropdown from '$lib/components/Dropdown.svelte';
  import { CONFIG } from '$utils/config';

  export let value: GeneratorSettings['errorCorrectionLevel'];
  export let logoEnabled: boolean = false;
  export let menuOpen: boolean = false;

  const dispatch = createEventDispatcher<{
    change: GeneratorSettings['errorCorrectionLevel'];
    toggle: void;
  }>();

  const levels = ['L', 'M', 'Q', 'H'];
  const minLevelForLogo = CONFIG.generator.minErrorCorrectionLevelForLogo;

  $: options = [
    { value: 'L', label: 'L 7%' },
    { value: 'M', label: 'M 15%' },
    { value: 'Q', label: 'Q 25%' },
    { value: 'H', label: 'H 30%' }
  ].filter(o => !logoEnabled || levels.indexOf(o.value) >= levels.indexOf(minLevelForLogo)) as Array<{ value: GeneratorSettings['errorCorrectionLevel'], label: string }>;
</script>

<div class="relative w-full">
  <div class="inline-flex h-[46px] w-full rounded-2xl border border-white/10 bg-white/5 shadow-sm">
    <div class="flex h-full w-[60%] items-center justify-center bg-white/5 px-4 text-sm font-semibold text-slate-400">
      {$t('generator.errorCorrection.label')}
    </div>
    
    <Dropdown
      {options}
      bind:value
      width="40%"
      placement="top-end"
      containerClass="h-full"
      triggerClass="flex h-full w-full items-center justify-between border-l border-white/10 bg-slate-900/30 px-3 font-mono text-sm text-white transition hover:bg-slate-900/50 focus:bg-slate-900/50 focus:outline-none"
      menuClass="w-[250%] right-0"
      title={logoEnabled ? $t('generator.errorCorrection.logoHint') : ''}
      on:change={(e) => dispatch('change', e.detail)}
      bind:open={menuOpen}
    >
      <span slot="trigger" let:value let:open class="flex w-full items-center justify-between">
        <span>{value}</span>
        <svg viewBox="0 0 20 20" class={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </Dropdown>
  </div>
</div>
