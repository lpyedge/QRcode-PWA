<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '$lib/i18n';

  export let open = false;
  export let label = $t('components.colorPicker.label');
  export let value = '#000000';

  const dispatch = createEventDispatcher<{ confirm: string; cancel: void }>();

  let draftHex = '';
  let error = '';
  let svEl: HTMLDivElement | null = null;
  let hueEl: HTMLDivElement | null = null;
  let sessionKey = '';

  type HSV = { h: number; s: number; v: number };
  let hsv: HSV = { h: 210, s: 0.6, v: 0.7 };
  let svPointer = { x: 0, y: 0 };
  let huePointerY = 0;

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function normalizeForColorInput(v: string): string {
    const s = v.trim();
    if (/^#[0-9a-f]{6}$/i.test(s)) return s;
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    if (/^#[0-9a-f]{8}$/i.test(s)) return s.slice(0, 7);
    return '#000000';
  }

  function isHex6Digits(v: string) {
    return /^[0-9a-f]{6}$/i.test(v.trim());
  }

  function sanitizeHexDigits(v: string) {
    return v.replace(/[^0-9a-f]/gi, '').slice(0, 6).toLowerCase();
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

  function rgbToHex(rgb: { r: number; g: number; b: number }) {
    const c = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`;
  }

  function luminance(rgb: { r: number; g: number; b: number }) {
    const r = clamp(rgb.r, 0, 255) / 255;
    const g = clamp(rgb.g, 0, 255) / 255;
    const b = clamp(rgb.b, 0, 255) / 255;
    // Relative luminance (sRGB) approximation is sufficient for UI borders.
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function swatchRings(rgb: { r: number; g: number; b: number }) {
    const lum = luminance(rgb);
    // Use outline + outer ring for maximum visibility against dark UI backgrounds.
    const outline = lum > 0.55 ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.95)';
    const ring = lum > 0.55 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.42)';
    return `outline: 2px solid ${outline}; outline-offset: 0px; box-shadow: 0 0 0 4px ${ring};`;
  }

  function hsvToRgb(next: HSV): { r: number; g: number; b: number } {
    const h = ((next.h % 360) + 360) % 360;
    const s = clamp(next.s, 0, 1);
    const v = clamp(next.v, 0, 1);
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rp = 0, gp = 0, bp = 0;
    if (h < 60) [rp, gp, bp] = [c, x, 0];
    else if (h < 120) [rp, gp, bp] = [x, c, 0];
    else if (h < 180) [rp, gp, bp] = [0, c, x];
    else if (h < 240) [rp, gp, bp] = [0, x, c];
    else if (h < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];
    return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
  }

  function rgbToHsv(rgb: { r: number; g: number; b: number }): HSV {
    const r = clamp(rgb.r / 255, 0, 1);
    const g = clamp(rgb.g / 255, 0, 1);
    const b = clamp(rgb.b / 255, 0, 1);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta === 0) h = 0;
    else if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    return { h, s, v };
  }

  function syncPointersFromHsv(next: HSV) {
    svPointer = {
      x: clamp(next.s, 0, 1) * 100,
      y: (1 - clamp(next.v, 0, 1)) * 100,
    };
    huePointerY = clamp(next.h, 0, 360) / 360 * 100;
  }

  function syncFromHexIfComplete() {
    if (!isHex6Digits(draftHex)) return;
    const rgb = hexToRgb(`#${draftHex}`);
    if (!rgb) return;
    hsv = rgbToHsv(rgb);
    syncPointersFromHsv(hsv);
  }

  function applyHsv(next: HSV) {
    hsv = { h: clamp(next.h, 0, 360), s: clamp(next.s, 0, 1), v: clamp(next.v, 0, 1) };
    syncPointersFromHsv(hsv);
    draftHex = rgbToHex(hsvToRgb(hsv)).slice(1);
    error = '';
  }

  function initFromValue() {
    const normalized = normalizeForColorInput(value);
    draftHex = normalized.slice(1).toLowerCase();
    const rgb = hexToRgb(normalized);
    if (rgb) {
      hsv = rgbToHsv(rgb);
      syncPointersFromHsv(hsv);
    }
    error = '';
  }

  $: if (open) {
    const key = `${label}|${value}`;
    if (key !== sessionKey) {
      sessionKey = key;
      initFromValue();
    }
  } else {
    sessionKey = '';
  }

  function validate(v: string) {
    const s = v.trim();
    if (isHex6Digits(s)) return '';
    return $t('components.colorPicker.hexError');
  }

  function confirm() {
    const msg = validate(draftHex);
    if (msg) {
      error = msg;
      return;
    }
    dispatch('confirm', `#${draftHex}`);
  }

  function cancel() {
    dispatch('cancel');
  }

  async function copyDraft() {
    try {
      const hex = isHex6Digits(draftHex) ? draftHex : rgbToHex(hsvToRgb(hsv)).slice(1);
      await navigator.clipboard.writeText(`#${hex}`);
    } catch {
      // ignore
    }
  }

  function onOverlayPointer(e: PointerEvent) {
    const el = e.target as Element | null;
    if (!el) return;
    if (el.closest('[data-color-dialog]')) return;
    cancel();
  }

  function setHueFromPointerEvent(e: PointerEvent) {
    if (!hueEl) return;
    const rect = hueEl.getBoundingClientRect();
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    applyHsv({ ...hsv, h: y * 360 });
  }

  function setSvFromPointerEvent(e: PointerEvent) {
    if (!svEl) return;
    const rect = svEl.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    applyHsv({ ...hsv, s: x, v: 1 - y });
  }

  function onSvPointerDown(e: PointerEvent) {
    if (!svEl) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSvFromPointerEvent(e);
  }

  function onSvPointerMove(e: PointerEvent) {
    if (!svEl) return;
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
    setSvFromPointerEvent(e);
  }

  function onHuePointerDown(e: PointerEvent) {
    if (!hueEl) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setHueFromPointerEvent(e);
  }

  function onHuePointerMove(e: PointerEvent) {
    if (!hueEl) return;
    if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return;
    setHueFromPointerEvent(e);
  }

  function onHexInput(e: Event) {
    const el = e.currentTarget as HTMLInputElement;
    draftHex = sanitizeHexDigits(el.value);
    error = '';
    syncFromHexIfComplete();
  }

  function onHexPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    const next = sanitizeHexDigits(text);
    if (!next) return;
    e.preventDefault();
    draftHex = next;
    error = '';
    syncFromHexIfComplete();
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[70] bg-black/60 p-4 md:p-6" on:pointerdown={onOverlayPointer}>
    <div class="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur" data-color-dialog>
      <div class="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-[0.4em] text-cyan-200">{label}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:text-white"
          on:click={cancel}
          aria-label={$t('components.colorPicker.close')}
        >
          <svg viewBox="0 0 20 20" class="h-4 w-4" aria-hidden="true">
            <path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="space-y-4 pt-4">
        <div class="flex items-stretch gap-3">
          <div
            class="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-inner"
            bind:this={svEl}
            on:pointerdown={onSvPointerDown}
            on:pointermove={onSvPointerMove}
            style={`touch-action:none; background:
              linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0)),
              linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0)),
              ${rgbToHex(hsvToRgb({ h: hsv.h, s: 1, v: 1 }))};`}
          >
            <div
              class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.55)]"
              style={`left:${svPointer.x}%; top:${svPointer.y}%; background:${rgbToHex(hsvToRgb(hsv))};`}
            ></div>
          </div>

          <div
            class="relative w-6 shrink-0 cursor-pointer rounded-full border border-white/10 shadow-inner"
            bind:this={hueEl}
            on:pointerdown={onHuePointerDown}
            on:pointermove={onHuePointerMove}
            style="touch-action:none; background: linear-gradient(to bottom, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);"
          >
            <div
              class="absolute left-1/2 h-4 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
              style={`top:${huePointerY}%;`}
            ></div>
          </div>
        </div>

        {#if error}
          <p class="text-sm text-rose-300">{error}</p>
        {/if}

        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2">
            <span
              class="h-8 w-8 shrink-0 rounded-xl shadow-inner"
              style={`background:${rgbToHex(hsvToRgb(hsv))}; ${swatchRings(hsvToRgb(hsv))}`}
            ></span>
            <span class="select-none font-mono text-sm text-slate-400">#</span>
            <input
              class="min-w-0 flex-1 bg-transparent font-mono text-sm text-white placeholder:text-slate-500 focus:outline-none"
              inputmode="text"
              autocomplete="off"
              spellcheck="false"
              value={draftHex}
              on:input={onHexInput}
              on:paste={onHexPaste}
              on:keydown={(e) => {
                if (e.key === 'Enter') confirm();
                if (e.key === 'Escape') cancel();
              }}
            />
            <button
              type="button"
              class="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 hover:border-white/20 hover:text-white"
              aria-label={$t('components.colorPicker.copy')}
              on:click={copyDraft}
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H10V7h9v14Z"
                />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:border-white/20"
              on:click={cancel}
            >
              {$t('components.colorPicker.cancel')}
            </button>
            <button type="button" class="rounded-2xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-900" on:click={confirm}>
              {$t('components.colorPicker.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
