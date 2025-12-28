<script lang="ts">
  import { t } from '$lib/i18n';
  import ColorField from '$lib/components/ColorField.svelte';
  import LogoPicker from '$lib/components/LogoPicker.svelte';
  import GradientDirectionPicker from '$lib/components/GradientDirectionPicker.svelte';
  import Dropdown from '$lib/components/Dropdown.svelte';
  import { CONFIG } from '$utils/config';
  import type {
    GeneratorSettings,
    GeneratorShapeStyle,
    GeneratorEyeStyle,
    GeneratorGradientDirection,
  } from '$utils/payloads';
  import { createEventDispatcher } from 'svelte';

  export let settings: GeneratorSettings;
  export let enforceRules: (s: GeneratorSettings) => GeneratorSettings;

  const dispatch = createEventDispatcher<{
    pickColor: { label: string; value: string; apply: (hex: string) => void };
  }>();

  function openColorPicker(label: string, value: string, apply: (hex: string) => void) {
    dispatch('pickColor', { label, value, apply });
  }

  function setSettings(patch: Partial<GeneratorSettings>) {
    settings = enforceRules({ ...settings, ...patch });
  }

  function setLogo(logo: GeneratorSettings['logo']) {
    settings = enforceRules({ ...settings, logo });
  }

  $: shapeOptions = [
    { id: 'square' as GeneratorShapeStyle, label: $t('generator.shapes.square.label'), desc: $t('generator.shapes.square.desc') },
    { id: 'circle' as GeneratorShapeStyle, label: $t('generator.shapes.circle.label'), desc: $t('generator.shapes.circle.desc') },
    { id: 'rounded' as GeneratorShapeStyle, label: $t('generator.shapes.rounded.label'), desc: $t('generator.shapes.rounded.desc') },
    { id: 'fluid' as GeneratorShapeStyle, label: $t('generator.shapes.fluid.label'), desc: $t('generator.shapes.fluid.desc') },
  ];

  $: eyeOptions = [
    { id: 'square' as GeneratorEyeStyle, label: $t('generator.eyeShapes.square') },
    { id: 'circle' as GeneratorEyeStyle, label: $t('generator.eyeShapes.circle') },
  ];

  const defaultLogos = [
    { id: 'qr', name: 'QR', src: '/logos/qr.svg' },
    { id: 'spark', name: 'Spark', src: '/logos/spark.svg' },
    { id: 'shield', name: 'Shield', src: '/logos/shield.svg' },
    { id: 'dot', name: 'Dot', src: '/logos/dot.svg' },
  ];

  const stylePresets: Array<{
    id: string;
    apply: (s: GeneratorSettings) => GeneratorSettings;
  }> = [
    {
      id: 'classic',
      apply: (s) => ({
        ...s,
        shapeStyle: 'square',
        shapeGradient: { ...s.shapeGradient, enabled: false },
        shapeColor: '#0b1220',
        backgroundTransparent: false,
        backgroundColor: '#ffffff',
        borderStyle: 'square',
        borderColor: '#0b1220',
        centerStyle: 'square',
        centerColor: '#0b1220',
      }),
    },
    {
      id: 'dots',
      apply: (s) => ({
        ...s,
        shapeStyle: 'circle',
        shapeGradient: { ...s.shapeGradient, enabled: false },
        shapeColor: '#06b6d4',
        backgroundTransparent: false,
        backgroundColor: '#f8fafc',
        borderStyle: 'circle',
        borderColor: '#0b1220',
        centerStyle: 'circle',
        centerColor: '#06b6d4',
      }),
    },
    {
      id: 'rounded',
      apply: (s) => ({
        ...s,
        shapeStyle: 'rounded',
        shapeGradient: { ...s.shapeGradient, enabled: false },
        shapeColor: '#7c3aed',
        backgroundTransparent: false,
        backgroundColor: '#ede9fe',
        borderStyle: 'square',
        borderColor: '#0b1220',
        centerStyle: 'square',
        centerColor: '#7c3aed',
      }),
    },
    {
      id: 'fluid',
      apply: (s) => ({
        ...s,
        shapeStyle: 'fluid',
        shapeGradient: { enabled: true, from: '#06b6d4', to: '#7c3aed', direction: 'to-br' },
        shapeColor: '#0b1220',
        backgroundTransparent: false,
        backgroundColor: '#020617',
        borderStyle: 'circle',
        borderColor: '#f8fafc',
        centerStyle: 'circle',
        centerColor: '#06b6d4',
      }),
    },
    {
      id: 'neon',
      apply: (s) => ({
        ...s,
        shapeStyle: 'rounded',
        shapeGradient: { enabled: true, from: '#22c55e', to: '#06b6d4', direction: 'to-r' },
        shapeColor: '#22c55e',
        backgroundTransparent: false,
        backgroundColor: '#0b1220',
        borderStyle: 'square',
        borderColor: '#f8fafc',
        centerStyle: 'square',
        centerColor: '#22c55e',
      }),
    },
    {
      id: 'invert',
      apply: (s) => ({
        ...s,
        shapeStyle: 'square',
        shapeGradient: { ...s.shapeGradient, enabled: false },
        shapeColor: '#f8fafc',
        backgroundTransparent: false,
        backgroundColor: '#0b1220',
        borderStyle: 'square',
        borderColor: '#f8fafc',
        centerStyle: 'square',
        centerColor: '#f8fafc',
      }),
    },
  ];

  const getPresetName = (id: string) => $t(`generator.presets.${id}.name`);
  const getPresetHint = (id: string) => $t(`generator.presets.${id}.hint`);

  let selectedPresetId = 'classic';
  let presetMenuOpen = false;

  $: visibleCount = stylePresets.length <= 6 ? stylePresets.length : 5;
  $: visiblePresets = stylePresets.slice(0, visibleCount);
  $: overflowPresets = stylePresets.slice(visibleCount);

  function selectPreset(id: string) {
    selectedPresetId = id;
    const preset = stylePresets.find((p) => p.id === id);
    if (preset) {
      settings = enforceRules(preset.apply(settings));
    }
  }
</script>

<section class="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/10">
  <div class="space-y-3">
    <p class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.design.stylePresets')}</p>
    <div class="flex gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <!-- Left: Selected Preset -->
      <div class="flex w-1/3 flex-col justify-center border-r border-white/10 pr-4">
        <div class="text-sm font-semibold text-white">{getPresetName(selectedPresetId)}</div>
        <div class="mt-1 text-xs leading-relaxed text-slate-400">{getPresetHint(selectedPresetId)}</div>
      </div>

      <!-- Right: Preset Buttons -->
      <div class="flex-1">
        <div class="grid grid-cols-3 gap-2">
          {#each visiblePresets as p}
            <button
              type="button"
              class={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                selectedPresetId === p.id
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/10 bg-slate-900/60 text-slate-200 hover:border-white/20 hover:text-white'
              }`}
              on:click={() => selectPreset(p.id)}
            >
              {getPresetName(p.id)}
            </button>
          {/each}
          {#if overflowPresets.length > 0}
            <div class="relative">
              <Dropdown
                options={overflowPresets.map(p => ({ value: p.id, label: getPresetName(p.id) }))}
                width="auto"
                placement="bottom-end"
                triggerClass="flex w-full items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 px-2 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:text-white"
                on:change={(e) => selectPreset(e.detail)}
              >
                <span slot="trigger">{$t('common.more')}</span>
              </Dropdown>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Left Column: Finder & Module -->
    <div class="space-y-6">
      <div class="space-y-2 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.finder')}</div>
        <div class="grid grid-cols-2 gap-2">
          <div class="relative">
            <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.finderBorder')}</span>
            <Dropdown
              options={eyeOptions.map(o => ({ value: o.id, label: o.label }))}
              bind:value={settings.borderStyle}
              triggerClass="flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs text-white transition hover:border-white/20 focus:outline-none"
              aria-label={$t('generator.design.finderBorder')}
            />
          </div>
          <div class="relative">
            <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.finderCenter')}</span>
            <Dropdown
              options={eyeOptions.map(o => ({ value: o.id, label: o.label }))}
              bind:value={settings.centerStyle}
              triggerClass="flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1.5 text-xs text-white transition hover:border-white/20 focus:outline-none"
              aria-label={$t('generator.design.finderCenter')}
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <ColorField
            label={$t('generator.design.finderBorder')}
            value={settings.borderColor}
            on:pick={() => openColorPicker($t('generator.design.finderBorder'), settings.borderColor, (hex) => setSettings({ borderColor: hex }))}
          />
          <ColorField
            label={$t('generator.design.finderCenter')}
            value={settings.centerColor}
            on:pick={() => openColorPicker($t('generator.design.finderCenter'), settings.centerColor, (hex) => setSettings({ centerColor: hex }))}
          />
        </div>
      </div>

      <div class="space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div class="relative">
          <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.moduleShape')}</span>
          <Dropdown
            options={shapeOptions.map(o => ({ value: o.id, label: `${o.label} · ${o.desc}` }))}
            bind:value={settings.shapeStyle}
            triggerClass="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white transition hover:border-white/20 focus:outline-none"
            aria-label={$t('generator.design.moduleShape')}
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <ColorField
            label={settings.shapeGradient.enabled ? $t('generator.design.gradientStart') : $t('generator.design.moduleColor')}
            value={settings.shapeGradient.enabled ? settings.shapeGradient.from : (settings.shapeColor ?? '#000000')}
            on:pick={() => {
              const label = settings.shapeGradient.enabled ? $t('generator.design.gradientStart') : $t('generator.design.moduleColor');
              const current = settings.shapeGradient.enabled ? settings.shapeGradient.from : (settings.shapeColor ?? '#000000');
              openColorPicker(label, current, (hex) => {
                if (settings.shapeGradient.enabled) {
                  setSettings({
                    shapeColor: hex,
                    shapeGradient: { ...settings.shapeGradient, from: hex },
                  });
                } else {
                  setSettings({
                    shapeColor: hex,
                    shapeGradient: { ...settings.shapeGradient, enabled: false, from: hex },
                  });
                }
              });
            }}
          />

          <div class="flex items-center justify-end">
            <label class="inline-flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 text-sm text-slate-200 transition hover:border-white/20">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500/20"
                checked={settings.shapeGradient.enabled}
                on:change={(e) => {
                  const enabled = (e.currentTarget as HTMLInputElement).checked;
                  if (enabled) {
                    const from = settings.shapeGradient.from || settings.shapeColor || '#000000';
                    // Default to purple if enabling gradient, unless a distinct 'to' color is already set
                    const currentTo = settings.shapeGradient.to;
                    const to = (currentTo && currentTo !== from && currentTo !== '#000000') ? currentTo : '#7c3aed';
                    
                    setSettings({
                      shapeColor: from,
                      shapeGradient: {
                        ...settings.shapeGradient,
                        enabled: true,
                        from,
                        to,
                      },
                    });
                  } else {
                    const color = settings.shapeGradient.from || settings.shapeColor || '#000000';
                    setSettings({
                      shapeColor: color,
                      shapeGradient: { ...settings.shapeGradient, enabled: false, from: color },
                    });
                  }
                }}
              />
              {$t('generator.design.gradient')}
            </label>
          </div>

          {#if settings.shapeGradient.enabled}
            <ColorField
              label={$t('generator.design.gradientEnd')}
              value={settings.shapeGradient.to}
              on:pick={() =>
                openColorPicker($t('generator.design.gradientEnd'), settings.shapeGradient.to, (hex) =>
                  setSettings({ shapeGradient: { ...settings.shapeGradient, to: hex } })
                )}
            />

            <div class="relative">
              <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.gradientDirection')}</span>
              <div class="flex h-[46px] items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 transition hover:border-white/20">
                <GradientDirectionPicker
                  value={settings.shapeGradient.direction}
                  on:change={(e) => setSettings({ shapeGradient: { ...settings.shapeGradient, direction: e.detail } })}
                />
                <span class="font-mono text-xs text-slate-400">
                  {$t(`generator.design.directions.${settings.shapeGradient.direction}`)}
                </span>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right Column: Background & Output -->
    <div class="space-y-6">
      <div class="space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div class="grid grid-cols-2 gap-3">
          <ColorField
            label={$t('generator.design.background')}
            value={settings.backgroundColor ?? '#ffffff'}
            disabled={settings.backgroundTransparent}
            on:pick={() =>
              openColorPicker($t('generator.design.background'), settings.backgroundColor ?? '#ffffff', (hex) =>
                setSettings({ backgroundColor: hex, backgroundTransparent: false })
              )}
          />
          <div class="flex items-center justify-end">
            <label class="inline-flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 text-sm text-slate-200 transition hover:border-white/20">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500/20"
                bind:checked={settings.backgroundTransparent}
              />
              {$t('common.transparent')}
            </label>
          </div>
        </div>
      </div>

      <div class="space-y-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.output')}</div>
        <div class="space-y-3">
          <div class="relative">
            <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.displaySize')}</span>
            <div class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
              <input aria-label={$t('generator.design.displaySize')} type="range" min={CONFIG.generator.minSize} max={CONFIG.generator.maxSize} step="10" bind:value={settings.size} class="w-full" />
              <div class="mt-1 text-center font-mono text-xs text-slate-400">{settings.size}px</div>
            </div>
          </div>
          <div class="relative">
            <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.design.margin')}</span>
            <div class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2">
              <input aria-label={$t('generator.design.margin')} type="range" min={CONFIG.generator.minMargin} max={CONFIG.generator.maxMargin} step="1" bind:value={settings.margin} class="w-full" />
              <div class="mt-1 text-center font-mono text-xs text-slate-400">{settings.margin} {$t('generator.design.marginUnit')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <LogoPicker
    value={settings.logo}
    defaults={defaultLogos}
    on:change={(e) => setLogo(e.detail)}
    on:pickColor={(e) => openColorPicker(e.detail.label, e.detail.value, e.detail.apply)}
  />
</section>
