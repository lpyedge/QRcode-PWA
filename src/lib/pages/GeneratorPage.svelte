<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy, onMount } from 'svelte';
  import { generateSvg } from '$utils/qrencode';
  import { stylizeSvg } from '$utils/qrStylize';
  import { renderSvgToBlob } from '$utils/renderSvgToBlob';
  import {
    DEFAULT_SETTINGS,
    buildPayload,
    type GeneratorMode,
    type GeneratorSettings,
  } from '$utils/payloads';
  import { CONFIG } from '$utils/config';
  import ColorPickerDialog from '$lib/components/ColorPickerDialog.svelte';
  import ModeSelector from '$lib/components/ModeSelector.svelte';
  import StyleOptions from '$lib/components/StyleOptions.svelte';
  import ErrorCorrectionSelector from '$lib/components/ErrorCorrectionSelector.svelte';
  import DownloadButton from '$lib/components/DownloadButton.svelte';
  import { t } from '$lib/i18n';

  type PanelTab = 'content' | 'design';
  type QrExportFormat = 'png' | 'jpg' | 'svg';

  const clone = <T,>(value: T): T => structuredClone(value);

  $: exportFormats = [
    { id: 'png' as QrExportFormat, label: $t('generator.formats.png') },
    { id: 'jpg' as QrExportFormat, label: $t('generator.formats.jpg') },
    { id: 'svg' as QrExportFormat, label: $t('generator.formats.svg') },
  ];

  let settings: GeneratorSettings = clone(DEFAULT_SETTINGS);
  let activeTab: PanelTab = 'content';

  let hydrated = false;
  let signature = '';
  let activeSignature = '';
  let sequence = 0;
  let busy = false;
  let previewError = '';
  let qrSvg = '';
  let qrDataUrl = '';
  let downloadFormat: QrExportFormat = CONFIG.raster.defaultExportFormat;
  let downloadBusy = false;
  let downloadMenuOpen = false;
  let downloadMenuOpenFullscreen = false;
  let errorCorrectionMenuOpen = false;
  let errorCorrectionMenuOpenFullscreen = false;

  let copyMessage = '';
  let mobileFullscreenOpen = false;
  let colorPickerOpen = false;
  let colorPickerLabel = '';
  let colorPickerValue = '#000000';
  let colorPickerApply: ((hex: string) => void) | null = null;

  function openColorPicker(label: string, value: string, apply: (hex: string) => void) {
    colorPickerLabel = label;
    colorPickerValue = value;
    colorPickerApply = apply;
    colorPickerOpen = true;
  }

  function closeColorPicker() {
    colorPickerOpen = false;
    colorPickerApply = null;
  }

  const levels = ['L', 'M', 'Q', 'H'];
  const minLevelForLogo = CONFIG.generator.minErrorCorrectionLevelForLogo;

  function enforceRules(next: GeneratorSettings): GeneratorSettings {
    if (next.logo?.enabled && levels.indexOf(next.errorCorrectionLevel) < levels.indexOf(minLevelForLogo)) {
      next = { ...next, errorCorrectionLevel: minLevelForLogo as GeneratorSettings['errorCorrectionLevel'] };
    }
    if (!next.shapeStyle) next = { ...next, shapeStyle: 'square' };
    return next;
  }

  function setSettings(patch: Partial<GeneratorSettings>) {
    settings = enforceRules({ ...settings, ...patch });
  }

  function resetSettings() {
    settings = clone(DEFAULT_SETTINGS);
    activeTab = 'content';
  }

  function currentPayload(): string {
    return buildPayload(settings);
  }

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(currentPayload());
      copyMessage = $t('generator.messages.copied');
      setTimeout(() => (copyMessage = ''), 2000);
    } catch {
      // ignore
    }
  }

  let showCopyOverlay = false;
  let showFullscreenCopyOverlay = false;

  async function copyQrImage(isFullscreen = false) {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      let blob = await response.blob();
      
      // 确保转换为 PNG 格式
      if (blob.type !== 'image/png') {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use a temporary object URL for safety and revoke it after use.
        const tempUrl = URL.createObjectURL(blob);
        try {
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = tempUrl;
          });
        } finally {
          URL.revokeObjectURL(tempUrl);
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!pngBlob) throw new Error('Failed to convert to PNG');
        blob = pngBlob;
      }
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      // 显示遮罩
      if (isFullscreen) {
        showFullscreenCopyOverlay = true;
        setTimeout(() => (showFullscreenCopyOverlay = false), 1000);
      } else {
        showCopyOverlay = true;
        setTimeout(() => (showCopyOverlay = false), 1000);
      }
    } catch (e) {
      console.error('Copy failed:', e);
      previewError = $t('generator.messages.copyFailed');
      setTimeout(() => { previewError = ''; }, 3000);
    }
  }

  function buildStylizedSvg(baseSvg: string) {
    const backgroundColor = settings.backgroundTransparent ? null : settings.backgroundColor;
    const logo =
      settings.logo?.enabled && settings.logo.href
        ? {
            href: settings.logo.href,
            sizeRatio: settings.logo.sizeRatio,
            paddingRatio: settings.logo.paddingRatio,
            shape: settings.logo.shape,
            backgroundColor:
              settings.logo.backgroundMode === 'none'
                ? null
                : settings.logo.backgroundMode === 'custom'
                  ? settings.logo.backgroundColor
                  : undefined,
          }
        : undefined;

    return stylizeSvg(baseSvg, {
      shapeColor: settings.shapeColor,
      backgroundColor,
      shapeStyle: settings.shapeStyle,
      shapeGradient: settings.shapeGradient?.enabled ? settings.shapeGradient : undefined,
      borderStyle: settings.borderStyle,
      borderColor: settings.borderColor,
      centerStyle: settings.centerStyle,
      centerColor: settings.centerColor,
      logo,
    });
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (qrDataUrl && qrDataUrl.startsWith('blob:')) URL.revokeObjectURL(qrDataUrl);
  });

  function debounceRender(sig: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void scheduleRender(sig), 250);
  }

  async function scheduleRender(sig: string) {
    if (!browser) return;
    const current = ++sequence;
    busy = true;
    previewError = '';

    try {
      const baseSvg = await generateSvg(
        { content: currentPayload(), errorCorrection: settings.errorCorrectionLevel },
        {
          margin: Math.max(0, Math.floor(settings.margin ?? 4)),
          includeBackground: true,
          idPrefix: `qr-${Date.now()}`,
        }
      );
      const styled = buildStylizedSvg(baseSvg);
      const blob = new Blob([styled], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      if (current === sequence) {
        qrSvg = styled;
        if (qrDataUrl && qrDataUrl.startsWith('blob:')) URL.revokeObjectURL(qrDataUrl);
        qrDataUrl = url;
      } else {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      if (current === sequence) {
        previewError = e instanceof Error ? e.message : $t('generator.messages.generateFailed');
        qrDataUrl = '';
        qrSvg = '';
      }
    } finally {
      if (current === sequence) busy = false;
    }
  }

  async function downloadCode() {
    if (!browser || !qrSvg || downloadBusy) return;
    try {
      downloadBusy = true;

      let blob: Blob;
      if (downloadFormat === 'svg') {
        blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
      } else {
        blob = await renderSvgToBlob(qrSvg, downloadFormat as 'png' | 'jpg', {
          maxEdge: 2048,
          backgroundColor:
            downloadFormat === 'jpg'
              ? settings.backgroundTransparent
                ? '#ffffff'
                : settings.backgroundColor
              : undefined,
        });
      }

      const url = URL.createObjectURL(blob);
      const ext = downloadFormat === 'jpg' ? 'jpg' : downloadFormat;
      const a = document.createElement('a');
      a.href = url;
      a.download = `QRcode-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      previewError = $t('generator.messages.downloadFailed');
      setTimeout(() => { previewError = ''; }, 3000);
    } finally {
      downloadBusy = false;
    }
  }

  function formatLabel(format: QrExportFormat) {
    return exportFormats.find((x) => x.id === format)?.label ?? format.toUpperCase();
  }

  function chooseDownloadFormat(format: QrExportFormat) {
    downloadFormat = format;
    downloadMenuOpen = false;
  }

  function setErrorCorrection(level: GeneratorSettings['errorCorrectionLevel']) {
    setSettings({ errorCorrectionLevel: level });
  }

  function openMobileFullscreenPreview() {
    downloadMenuOpen = false;
    mobileFullscreenOpen = true;
  }

  function closeMobileFullscreenPreview() {
    downloadMenuOpen = false;
    mobileFullscreenOpen = false;
  }

  function onColorPickerConfirm(e: CustomEvent<string>) {
    const apply = colorPickerApply;
    closeColorPicker();
    if (apply) apply(e.detail);
  }

  onMount(() => {
    hydrated = true;
    activeSignature = '';

    const onDocPointer = (e: Event) => {
      if (!downloadMenuOpen) return;
      const el = e.target as Element | null;
      if (!el) return;
      // Close if clicking outside any button/menu inside the split control.
      if (el.closest('[data-download-split]')) return;
      downloadMenuOpen = false;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      downloadMenuOpen = false;
    };

    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKey, true);
    };
  });

  $: signature = JSON.stringify(settings);
  $: if (hydrated && signature !== activeSignature) {
    activeSignature = signature;
    debounceRender(signature);
  }
</script>

<section id="generator" class="space-y-6 pb-10">
  <header class="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/10 lg:flex-row lg:items-center lg:justify-between">
    <div class="space-y-2">
      <p class="text-xs uppercase tracking-[0.4em] text-cyan-300">{$t('pages.generator.title')}</p>
      <h1 class="text-2xl font-semibold tracking-tight text-white">{$t('generator.title')}</h1>
      <p class="hidden text-sm text-slate-300 lg:block">{$t('generator.subtitle')}</p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:border-cyan-300" on:click={copyPayload}>
        {$t('common.copyContent')}
      </button>
      <button type="button" class="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm text-slate-200 hover:border-white/30" on:click={resetSettings}>
        {$t('common.reset')}
      </button>
      {#if copyMessage}
        <span class="text-xs text-cyan-300">{copyMessage}</span>
      {/if}
    </div>
  </header>

  <div class="grid gap-6 md:grid-cols-[1fr,0.72fr] lg:grid-cols-[1.15fr,0.85fr]">
    <div class="min-w-0 space-y-6">
      <div class="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/40 p-1 text-sm font-semibold">
        <button type="button" class={`rounded-2xl px-3 py-2 transition ${activeTab === 'content' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`} on:click={() => (activeTab = 'content')}>
          {$t('generator.tabs.content')}
        </button>
        <button type="button" class={`rounded-2xl px-3 py-2 transition ${activeTab === 'design' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`} on:click={() => (activeTab = 'design')}>
          {$t('generator.tabs.design')}
        </button>
      </div>

      {#if activeTab === 'content'}
        <ModeSelector bind:settings onCopy={copyPayload} />
      {:else}
        <StyleOptions
          bind:settings
          {enforceRules}
          on:pickColor={(e) => openColorPicker(e.detail.label, e.detail.value, e.detail.apply)}
        />
      {/if}

    </div>

    <aside class="hidden min-w-0 md:block">
      <section class="sticky top-20 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800/70 to-slate-900/40 p-5 text-center lg:top-24 lg:p-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-semibold text-slate-200">{$t('generator.previewLabel')}</p>
        </div>

        <div class="mt-4 flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 lg:mt-5 lg:min-h-[360px] lg:p-6">
          {#if previewError}
            <p class="text-sm text-rose-300">{previewError}</p>
          {:else if busy && !qrDataUrl}
            <p class="animate-pulse text-sm text-slate-400">{$t('common.generating')}</p>
          {:else if qrDataUrl}
            <img
              src={qrDataUrl}
              alt={$t('generator.previewLabel')}
              class="mx-auto max-w-full shadow-2xl"
              style={`width:min(${settings.size}px, 60vh, 100%); max-height:60vh;`}
            />
          {:else}
            <p class="text-sm text-slate-500">{$t('generator.previewEmpty')}</p>
          {/if}
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <ErrorCorrectionSelector
            value={settings.errorCorrectionLevel}
            logoEnabled={!!settings.logo?.enabled}
            menuOpen={errorCorrectionMenuOpen}
            on:change={(e) => setErrorCorrection(e.detail)}
            on:toggle={() => (errorCorrectionMenuOpen = !errorCorrectionMenuOpen)}
          />
          <DownloadButton
            busy={busy || downloadBusy}
            format={downloadFormat}
            menuOpen={downloadMenuOpen}
            on:download={downloadCode}
            on:formatChange={(e) => chooseDownloadFormat(e.detail)}
            on:toggle={() => (downloadMenuOpen = !downloadMenuOpen)}
          />
        </div>
      </section>
    </aside>
  </div>

  {#if qrDataUrl}
    <div
      class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur md:hidden"
      style="padding-bottom: env(safe-area-inset-bottom);"
    >
      <div class="px-4 py-4">
        {#if previewError}
          <p class="text-sm text-rose-300">{previewError}</p>
        {:else}
          <div class="flex items-center justify-between gap-4">
            <div class="relative shrink-0">
              <button
                type="button"
                class="relative rounded-2xl bg-white/95 p-2 shadow-xl"
                on:click={() => copyQrImage(false)}
                disabled={busy}
                aria-label={$t('common.copy')}
              >
                <img src={qrDataUrl} alt={$t('generator.previewLabel')} class="h-28 w-28 rounded-xl" />
                {#if showCopyOverlay}
                  <div class="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm" style="animation: fadeOut 1s ease-out forwards;">
                    <div class="text-center">
                      <svg class="mx-auto h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <p class="mt-2 text-sm font-medium text-white">{$t('generator.messages.qrCopied')}</p>
                    </div>
                  </div>
                {/if}
              </button>
              <button
                type="button"
                class="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 shadow-lg hover:bg-cyan-400 md:hidden"
                on:click={openMobileFullscreenPreview}
                aria-label={$t('generator.fullscreenPreview')}
              >
                <svg class="h-4 w-4 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>

            <div class="flex w-60 flex-col gap-3">
              <ErrorCorrectionSelector
                value={settings.errorCorrectionLevel}
                logoEnabled={!!settings.logo?.enabled}
                menuOpen={errorCorrectionMenuOpen}
                on:change={(e) => setErrorCorrection(e.detail)}
                on:toggle={() => (errorCorrectionMenuOpen = !errorCorrectionMenuOpen)}
              />
              <DownloadButton
                busy={busy || downloadBusy}
                format={downloadFormat}
                menuOpen={downloadMenuOpen}
                on:download={downloadCode}
                on:formatChange={(e) => chooseDownloadFormat(e.detail)}
                on:toggle={() => (downloadMenuOpen = !downloadMenuOpen)}
              />
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</section>

{#if mobileFullscreenOpen && qrDataUrl}
  <div class="fixed inset-0 z-[60] bg-slate-950 md:hidden" role="dialog" aria-modal="true">
    <div class="flex h-full flex-col">
      <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div class="min-w-0">
          <div class="text-xs uppercase tracking-[0.4em] text-cyan-200">{$t('generator.previewLabel')}</div>
          <div class="mt-1 text-xs text-slate-400">{$t('generator.fullscreenPreview')}</div>
        </div>
        <button
          aria-label={$t('common.close')}
          type="button"
          class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 hover:border-white/20"
          on:click={closeMobileFullscreenPreview}
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col p-4 [@media(orientation:landscape)]:flex-row [@media(orientation:landscape)]:items-center [@media(orientation:landscape)]:gap-6">
        <div class="flex min-h-0 flex-1 items-center justify-center">
          <button
            type="button"
            class="relative"
            on:click={() => copyQrImage(true)}
          >
            <img
              src={qrDataUrl}
              alt={$t('generator.previewLabel')}
              class="max-h-full max-w-full rounded-3xl bg-white p-5 shadow-2xl"
              style="width:min(92vw, 92vh); height:auto;"
            />
            {#if showFullscreenCopyOverlay}
              <div class="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-900/80 backdrop-blur-sm" style="animation: fadeOut 1s ease-out forwards;">
                <div class="text-center">
                  <svg class="mx-auto h-12 w-12 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p class="mt-3 text-lg font-medium text-white">{$t('generator.messages.qrCopied')}</p>
                </div>
              </div>
            {/if}
          </button>
        </div>

        <div class="mt-5 flex shrink-0 flex-row items-center gap-3 [@media(orientation:landscape)]:mt-0 [@media(orientation:landscape)]:w-60 [@media(orientation:landscape)]:flex-col [@media(orientation:landscape)]:items-stretch">
          <div class="relative flex-1">
            <ErrorCorrectionSelector
              value={settings.errorCorrectionLevel}
              logoEnabled={!!settings.logo?.enabled}
              menuOpen={errorCorrectionMenuOpenFullscreen}
              on:change={(e) => setErrorCorrection(e.detail)}
              on:toggle={() => (errorCorrectionMenuOpenFullscreen = !errorCorrectionMenuOpenFullscreen)}
            />
          </div>
          <div class="relative flex-1">
            <DownloadButton
              busy={busy || downloadBusy}
              format={downloadFormat}
              menuOpen={downloadMenuOpenFullscreen}
              on:download={downloadCode}
              on:formatChange={(e) => chooseDownloadFormat(e.detail)}
              on:toggle={() => (downloadMenuOpenFullscreen = !downloadMenuOpenFullscreen)}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<ColorPickerDialog open={colorPickerOpen} label={colorPickerLabel} value={colorPickerValue} on:confirm={onColorPickerConfirm} on:cancel={closeColorPicker} />

<style>
  @keyframes fadeOut {
    0% {
      opacity: 1;
    }
    60% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
