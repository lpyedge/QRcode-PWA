<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let value: string = '#000000';
  export let description: string | undefined = undefined;
  export let disabled: boolean = false;
  export let ariaLabel: string | undefined = undefined;

  const dispatch = createEventDispatcher<{ pick: void }>();

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const s = hex.trim();
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      const r = parseInt(s[1] + s[1], 16);
      const g = parseInt(s[2] + s[2], 16);
      const b = parseInt(s[3] + s[3], 16);
      return { r, g, b };
    }
    if (/^#[0-9a-f]{6}$/i.test(s)) {
      const r = parseInt(s.slice(1, 3), 16);
      const g = parseInt(s.slice(3, 5), 16);
      const b = parseInt(s.slice(5, 7), 16);
      return { r, g, b };
    }
    if (/^#[0-9a-f]{8}$/i.test(s)) {
      const r = parseInt(s.slice(1, 3), 16);
      const g = parseInt(s.slice(3, 5), 16);
      const b = parseInt(s.slice(5, 7), 16);
      return { r, g, b };
    }
    return null;
  }

  function luminance(rgb: { r: number; g: number; b: number }) {
    const r = clamp(rgb.r, 0, 255) / 255;
    const g = clamp(rgb.g, 0, 255) / 255;
    const b = clamp(rgb.b, 0, 255) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function swatchRings(rgb: { r: number; g: number; b: number }) {
    const lum = luminance(rgb);
    const outline = lum > 0.55 ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.95)';
    const ring = lum > 0.55 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.42)';
    return `outline: 2px solid ${outline}; outline-offset: 0px; box-shadow: 0 0 0 4px ${ring};`;
  }

  function normalizeForPreview(v: string): string {
    const s = v.trim();
    if (!s) return '#000000';
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    if (/^#[0-9a-f]{6}$/i.test(s)) return s;
    if (/^#[0-9a-f]{8}$/i.test(s)) return s.slice(0, 7);
    return s; // allow CSS colors / var(--x)
  }

  function swatchStyle(value: string) {
    const preview = normalizeForPreview(value);
    const rgb = hexToRgb(preview);
    return rgb ? `background:${preview}; ${swatchRings(rgb)}` : `background:${preview};`;
  }

  function onClick() {
    if (disabled) return;
    dispatch('pick');
  }
</script>

<div class="relative">
  <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</span>
  <button
    type="button"
    class="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2.5 text-left transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
    on:click={onClick}
    disabled={disabled}
    aria-label={ariaLabel ?? label}
  >
    <div class="flex items-center gap-2">
      <span class="h-6 w-6 rounded-lg shadow-inner" style={swatchStyle(value)}></span>
      <span class="font-mono text-xs text-white">{value}</span>
    </div>
  </button>
  {#if description}
    <p class="mt-1 text-xs text-slate-400">{description}</p>
  {/if}
</div>
