<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  import Dropdown from '$lib/components/Dropdown.svelte';

  type QrExportFormat = 'png' | 'jpg' | 'svg';

  export let busy: boolean = false;
  export let format: QrExportFormat = 'png';
  export let menuOpen: boolean = false; // Kept for compatibility if needed, but Dropdown handles its own state

  const dispatch = createEventDispatcher<{
    download: void;
    formatChange: QrExportFormat;
    toggle: void;
  }>();

  const exportFormats = [
    { value: 'png' as QrExportFormat, label: 'PNG' },
    { value: 'jpg' as QrExportFormat, label: 'JPG' },
    { value: 'svg' as QrExportFormat, label: 'SVG' },
  ];
</script>

<div class="relative inline-flex w-full" data-download-split>
  <div class="inline-flex h-[46px] w-full rounded-2xl shadow-sm">
    <button
      type="button"
      class="w-[60%] rounded-l-2xl bg-cyan-500 px-4 text-sm font-semibold text-slate-900 disabled:pointer-events-none disabled:opacity-60"
      on:click={() => dispatch('download')}
      disabled={busy}
    >
      {busy ? $t('common.generating') : $t('common.download')}
    </button>
    
    <Dropdown
      options={exportFormats}
      bind:value={format}
      width="40%"
      placement="top-end"
      disabled={busy}
      containerClass="h-full"
      triggerClass="flex h-full w-full items-center justify-between rounded-r-2xl border-l border-slate-900/30 bg-cyan-500 px-3 text-sm font-semibold text-slate-900 disabled:pointer-events-none disabled:opacity-60"
      menuClass="w-[250%] right-0"
      on:change={(e) => dispatch('formatChange', e.detail)}
      bind:open={menuOpen}
    >
      <span slot="trigger" let:displayLabel let:open class="flex w-full items-center justify-between">
        <span class="font-mono">{displayLabel}</span>
        <svg viewBox="0 0 20 20" class={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path
            d="M5.5 7.5 10 12l4.5-4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </Dropdown>
  </div>
</div>
