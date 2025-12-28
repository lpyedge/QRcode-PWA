<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';
  import Dropdown from '$lib/components/Dropdown.svelte';
  import { CONFIG } from '$utils/config';

  type LogoShape = 'square' | 'circle' | 'rounded';
  type LogoBackgroundMode = 'auto' | 'none' | 'custom';

  type LogoState = {
    enabled: boolean;
    href: string;
    sizeRatio: number;
    paddingRatio: number;
    shape: LogoShape;
    backgroundMode: LogoBackgroundMode;
    backgroundColor: string;
  };

  type DefaultLogo = { id: string; name: string; src: string };

  export let value: LogoState;
  export let defaults: DefaultLogo[] = [];

  const dispatch = createEventDispatcher<{ change: LogoState; pickColor: { label: string; value: string; apply: (hex: string) => void } }>();

  $: shapeOptions = [
    { value: 'rounded' as LogoShape, label: $t('generator.design.logoShapes.rounded') },
    { value: 'circle' as LogoShape, label: $t('generator.design.logoShapes.circle') },
    { value: 'square' as LogoShape, label: $t('generator.design.logoShapes.square') }
  ];

  $: backgroundModeOptions = [
    { value: 'auto' as LogoBackgroundMode, label: $t('generator.design.logoBackgroundModes.auto') },
    { value: 'custom' as LogoBackgroundMode, label: $t('generator.design.logoBackgroundModes.custom') },
    { value: 'none' as LogoBackgroundMode, label: $t('generator.design.logoBackgroundModes.none') }
  ];

  function patch(next: Partial<LogoState>) {
    dispatch('change', { ...value, ...next });
  }

  function openBackgroundColorPicker() {
    dispatch('pickColor', {
      label: $t('generator.design.logoBackgroundColor'),
      value: value.backgroundColor,
      apply: (hex: string) => patch({ backgroundColor: hex })
    });
  }

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(new Error('Failed to read file'));
      fr.readAsDataURL(file);
    });
  }

  async function urlToDataUrl(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], 'logo', { type: blob.type || 'image/png' });
    return await fileToDataUrl(file);
  }

  async function onUpload(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      patch({ enabled: true, href: dataUrl });
    } catch {
      // ignore
    }
  }

  const cache = new Map<string, string>();
  async function selectDefault(item: DefaultLogo) {
    try {
      const cached = cache.get(item.id);
      if (cached) {
        patch({ enabled: true, href: cached });
        return;
      }
      const dataUrl = await urlToDataUrl(item.src);
      cache.set(item.id, dataUrl);
      patch({ enabled: true, href: dataUrl });
    } catch (e) {
      console.error('Failed to load logo preset:', e);
    }
  }

  function removeLogo() {
    patch({ href: '' });
  }
</script>

<section class="space-y-3.5 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.logo')}</p>
      <p class="mt-1 text-xs text-slate-400">{$t('generator.design.logoHint')}</p>
    </div>
    <label class="inline-flex shrink-0 items-center gap-2 text-sm text-slate-200">
      <input
        type="checkbox"
        class="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500/20"
        checked={value.enabled}
        on:change={(e) => {
          const enabled = (e.currentTarget as HTMLInputElement).checked;
          if (enabled && !value.href && defaults.length > 0) {
             selectDefault(defaults[0]);
          } else {
             patch({ enabled });
          }
        }}
      />
      {$t('common.enable')}
    </label>
  </div>

  {#if value.enabled}
    <div class="space-y-3">
      <!-- 默认 Logo 网格（第一行） -->
      {#if defaults.length}
        <div class="flex flex-wrap gap-2">
          {#each defaults as item}
            <button
              type="button"
              class={`h-11 w-11 shrink-0 rounded-lg border p-1.5 transition ${
                cache.get(item.id) && value.href === cache.get(item.id) 
                  ? 'border-cyan-400 bg-cyan-500/10' 
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            on:click={() => void selectDefault(item)}
            aria-label={item.name}
          >
            <img src={item.src} alt={item.name} class="h-full w-full rounded object-contain bg-white/90 p-0.5" />
          </button>
        {/each}
      </div>
    {/if}

    <!-- 当前 Logo + 控制滑块（第二行） -->
    <div class="grid grid-cols-[auto_1fr] gap-3">
      <!-- 当前 Logo 预览（左侧，带上传/删除） -->
      <div class="relative">
        {#if value.href}
          <!-- 有 Logo 时：显示预览 + 删除按钮，不响应点击 -->
          <div class="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border-2 border-cyan-400/30 bg-white/95 shadow-inner">
            <img src={value.href} alt={$t('commonExtras.currentLogoAlt')} class="h-full w-full object-contain p-2" />
            <button
              type="button"
              class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/90 text-slate-300 transition hover:bg-red-500/90 hover:text-white"
              on:click={removeLogo}
              aria-label={$t('commonExtras.deleteLogo')}
            >
              <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          </div>
        {:else}
          <!-- 没有 Logo 时：显示上传区域，可点击上传 -->
          <label class="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/20 bg-slate-950/60 transition hover:border-cyan-400/50">
            <div class="flex flex-col items-center gap-1 text-slate-400 transition group-hover:text-cyan-400">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span class="text-[9px]">{$t('generator.design.logoUploadHint')}</span>
            </div>
            <input type="file" accept="image/*" class="hidden" on:change={onUpload} />
          </label>
        {/if}
      </div>

      <!-- 大小 + 留白滑块（右侧） -->
      <div class="space-y-2.5">
        <label class="block space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase tracking-[0.3em] text-slate-400">{$t('generator.design.logoSize')}</span>
            <span class="font-mono text-xs text-slate-400">{Math.round(value.sizeRatio * 100)}%</span>
          </div>
          <input
            type="range"
            min={CONFIG.logo.minSizeRatio}
            max={CONFIG.logo.maxSizeRatio}
            step="0.01"
            value={value.sizeRatio}
            class="w-full"
            on:input={(e) => patch({ sizeRatio: clamp(Number((e.currentTarget as HTMLInputElement).value), CONFIG.logo.minSizeRatio, CONFIG.logo.maxSizeRatio) })}
          />
        </label>
        <label class="block space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase tracking-[0.3em] text-slate-400">{$t('generator.design.logoPadding')}</span>
            <span class="font-mono text-xs text-slate-400">{Math.round(value.paddingRatio * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max={CONFIG.logo.maxPaddingRatio}
            step="0.005"
            value={value.paddingRatio}
            class="w-full"
            on:input={(e) => patch({ paddingRatio: clamp(Number((e.currentTarget as HTMLInputElement).value), 0, CONFIG.logo.maxPaddingRatio) })}
          />
        </label>
      </div>
    </div>

    <!-- 形状 + 底板（横向紧凑布局） -->
    <div class="grid grid-cols-2 gap-2.5">
      <div class="relative">
        <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.logoShape')}</span>
        <Dropdown
          options={shapeOptions}
          value={value.shape}
          triggerClass="flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs text-white transition hover:border-white/20 focus:outline-none"
          on:change={(e) => patch({ shape: e.detail })}
        />
      </div>

      <div class="relative">
        <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.logoBackground')}</span>
        <Dropdown
          options={backgroundModeOptions}
          value={value.backgroundMode}
          triggerClass="flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs text-white transition hover:border-white/20 focus:outline-none"
          on:change={(e) => patch({ backgroundMode: e.detail })}
        />
      </div>
    </div>

    <!-- 自定义底板颜色（仅当选择自定义时显示，紧凑设计） -->
    {#if value.backgroundMode === 'custom'}
      <div class="relative">
        <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.logoBackgroundColor')}</span>
        <button
          aria-label={$t('generator.design.logoBackgroundColor')}
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2.5 text-left transition hover:border-white/20"
          on:click={openBackgroundColorPicker}
        >
          <div class="flex items-center gap-2">
            <span class="h-6 w-6 rounded-lg shadow-inner" style="background:{value.backgroundColor};"></span>
            <span class="font-mono text-xs text-white">{value.backgroundColor}</span>
          </div>
        </button>
      </div>
    {/if}
    </div>
  {/if}
</section>
