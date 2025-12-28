<script lang="ts">
  import { t } from '$lib/i18n';
  import { buildPayload, type GeneratorMode, type GeneratorSettings } from '$utils/payloads';
  import Dropdown from '$lib/components/Dropdown.svelte';

  export let settings: GeneratorSettings;
  export let onCopy: () => void;

  let modePickerOpen = false;
  let showTemplatePreview = false;

  $: encryptionOptions = [
    { value: 'WPA', label: $t('generator.encryption.wpa') },
    { value: 'WEP', label: $t('generator.encryption.wep') },
    { value: 'nopass', label: $t('generator.encryption.nopass') }
  ];

  $: modeOptions = [
    { id: 'text' as GeneratorMode, label: $t('generator.modes.text'), hint: $t('generator.modeHints.text') },
    { id: 'url' as GeneratorMode, label: $t('generator.modes.url'), hint: $t('generator.modeHints.url') },
    { id: 'wifi' as GeneratorMode, label: $t('generator.modes.wifi'), hint: $t('generator.modeHints.wifi') },
    { id: 'email' as GeneratorMode, label: $t('generator.modes.email'), hint: $t('generator.modeHints.email') },
    { id: 'tel' as GeneratorMode, label: $t('generator.modes.tel'), hint: $t('generator.modeHints.tel') },
    { id: 'sms' as GeneratorMode, label: $t('generator.modes.sms'), hint: $t('generator.modeHints.sms') },
    { id: 'vcard' as GeneratorMode, label: $t('generator.modes.vcard'), hint: $t('generator.modeHints.vcard') },
  ];

  const quickModes: GeneratorMode[] = ['text', 'url', 'wifi'];
  const modeLabel = (m: GeneratorMode) => modeOptions.find((x) => x.id === m)?.label ?? m;
  const modeHint = (m: GeneratorMode) => modeOptions.find((x) => x.id === m)?.hint ?? '';

  function currentPayload(): string {
    try {
      return buildPayload(settings);
    } catch {
      return '';
    }
  }

  function setMode(mode: GeneratorMode) {
    settings = { ...settings, mode };
  }

  $: if (settings.mode === 'text') {
    showTemplatePreview = false;
  }
</script>

<section class="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/10">
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('generator.tabs.content')}</p>
      <p class="mt-1 text-sm text-slate-200">
        <span class="font-semibold text-white">{modeLabel(settings.mode)}</span>
        <span class="ml-2 text-xs text-slate-400">{modeHint(settings.mode)}</span>
      </p>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:border-white/20"
      on:click={() => (modePickerOpen = true)}
    >
      {$t('common.switchType')}
    </button>
  </div>

  <div class="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
    {#each quickModes as m}
      <button
        type="button"
        class={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition ${
          settings.mode === m ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-900/40 text-slate-200 hover:border-white/20'
        }`}
        on:click={() => setMode(m)}
      >
        {modeLabel(m)}
      </button>
    {/each}

    {#if !quickModes.includes(settings.mode)}
      <button
        type="button"
        class="shrink-0 rounded-full border border-cyan-400 bg-cyan-500/10 px-3 py-1.5 text-xs text-white"
        on:click={() => (modePickerOpen = true)}
      >
        {modeLabel(settings.mode)}
      </button>
    {/if}

    <button
      type="button"
      class="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:border-white/20"
      on:click={() => (modePickerOpen = true)}
    >
      {$t('common.more')}
    </button>
  </div>

  {#if settings.mode === 'text'}
    <label class="space-y-2">
      <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.textContent')}</span>
      <textarea
        class="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
        placeholder={$t('generator.fields.textPlaceholder')}
        bind:value={settings.content}
      ></textarea>
    </label>
  {:else if settings.mode === 'url'}
    <label class="space-y-2">
      <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.linkAddress')}</span>
      <input
        class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
        placeholder={$t('generator.fields.linkPlaceholder')}
        bind:value={settings.linkUrl}
      />
    </label>
  {:else if settings.mode === 'wifi'}
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.wifiName')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.ssid} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.wifiPassword')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.password} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.wifiEncryption')}</span>
        <Dropdown
          options={encryptionOptions}
          bind:value={settings.encryption}
          triggerClass="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white transition hover:border-white/20 focus:outline-none"
        />
      </label>
      <label class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
        <input type="checkbox" class="h-4 w-4 rounded border-white/20 bg-transparent" bind:checked={settings.hidden} />
        {$t('generator.fields.wifiHidden')}
      </label>
    </div>
  {:else if settings.mode === 'email'}
    <div class="grid gap-4">
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.emailAddress')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.emailAddress} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.emailSubject')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.emailSubject} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.emailBody')}</span>
        <textarea class="min-h-[96px] w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.emailBody}></textarea>
      </label>
    </div>
  {:else if settings.mode === 'tel'}
    <label class="space-y-2">
      <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.phoneNumber')}</span>
      <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 font-mono text-sm text-white" bind:value={settings.telNumber} />
    </label>
  {:else if settings.mode === 'sms'}
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.smsNumber')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 font-mono text-sm text-white" bind:value={settings.smsNumber} />
      </label>
      <label class="space-y-2 sm:col-span-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.smsMessage')}</span>
        <textarea class="min-h-[96px] w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.smsMessage}></textarea>
      </label>
    </div>
  {:else if settings.mode === 'vcard'}
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.vcardName')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.vcardFullName} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.vcardCompany')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.vcardCompany} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.vcardTitle')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.vcardTitle} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.vcardPhone')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 font-mono text-sm text-white" bind:value={settings.vcardPhone} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.vcardEmail')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.vcardEmail} />
      </label>
      <label class="space-y-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.vcardWebsite')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.vcardWebsite} />
      </label>
      <label class="space-y-2 sm:col-span-2">
        <span class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.fields.vcardAddress')}</span>
        <input class="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white" bind:value={settings.vcardAddress} />
      </label>
    </div>
  {/if}

  {#if settings.mode !== 'text'}
    <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <div class="flex items-center justify-between">
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">{$t('generator.templatePreview.title')}</p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="text-xs text-slate-300 hover:text-white"
            on:click={() => (showTemplatePreview = !showTemplatePreview)}
          >
            {showTemplatePreview ? $t('generator.templatePreview.hide') : $t('generator.templatePreview.show')}
          </button>
          <button type="button" class="text-xs text-cyan-300 hover:text-cyan-200" on:click={onCopy}>{$t('common.copy')}</button>
        </div>
      </div>
      {#if showTemplatePreview}
        <pre class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-900/60 p-3 font-mono text-xs text-slate-200">{currentPayload()}</pre>
      {:else}
        <p class="mt-2 text-sm text-slate-400">{$t('generator.templatePreview.hint')}</p>
      {/if}
    </div>
  {/if}
</section>

{#if modePickerOpen}
  <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
    <div class="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl">
      <div class="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-[0.4em] text-cyan-200">{$t('common.switchType')}</p>
          <p class="mt-1 text-sm text-slate-300">{$t('generator.modeDescriptions.text')}</p>
        </div>
        <button
          type="button"
          class="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:border-white/20"
          on:click={() => (modePickerOpen = false)}
        >
          {$t('common.close')}
        </button>
      </div>

      <div class="p-4">
        <div class="grid gap-2 sm:grid-cols-2">
          {#each modeOptions as opt}
            <button
              type="button"
              class={`rounded-2xl border px-4 py-3 text-left transition ${
                settings.mode === opt.id
                  ? 'border-cyan-400 bg-cyan-500/10 text-white'
                  : 'border-white/10 bg-slate-900/40 text-slate-200 hover:border-white/20'
              }`}
              on:click={() => {
                setMode(opt.id);
                modePickerOpen = false;
              }}
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-semibold">{opt.label}</div>
                {#if quickModes.includes(opt.id)}
                  <span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-slate-300">{$t('common.popular')}</span>
                {/if}
              </div>
              <div class="mt-1 text-xs text-slate-400">{opt.hint}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
