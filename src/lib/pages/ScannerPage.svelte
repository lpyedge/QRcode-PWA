<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy, onMount } from 'svelte';
  import { QrCameraScanner, type VideoReadyState } from '$utils/cameraQrScanner';
  import { QRDecoder } from '$utils/qrdecode';
  import { t } from '$lib/i18n';
  import Dropdown from '$lib/components/Dropdown.svelte';

  type ScanRecord = {
    id: string;
    text: string;
    source: 'camera' | 'upload';
    timestamp: number;
  };

  type TorchMediaTrackConstraints = MediaTrackConstraints & {
    advanced?: Array<MediaTrackConstraintSet & { torch?: boolean }>;
  };

  let videoElement: HTMLVideoElement | null = null;
  let uploadInput: HTMLInputElement | null = null;
  let scanner: QrCameraScanner | null = null;
  let availableDevices: MediaDeviceInfo[] = [];
  let selectedDeviceId = '';
  let scanning = false;
  let permissionError = '';
  let lastResult = '';
  let scanHistory: ScanRecord[] = [];
  let hydrated = false;
  let torchEnabled = false;
  let activeDeviceId = '';
  let switchingCamera = false;
  let videoReadyState: VideoReadyState | null = null;
  let scanningState: { scanning: boolean; inFlight: boolean } = { scanning: false, inFlight: false };
  let unsubscribeStatus: (() => void) | null = null;

  $: deviceOptions = availableDevices.map(d => ({
    value: d.deviceId,
    label: d.label || $t('scanner.cameraDefault')
  }));

  const MAX_HISTORY = 5;

  onMount(async () => {
    hydrated = true;
    await prepareDevices();
  });

  onDestroy(() => {
    stopScanner();
  });

  async function prepareDevices() {
    if (!browser || !navigator.mediaDevices) {
      permissionError = $t('scanner.errors.notSupported');
      return;
    }

    try {
      // Ask permission once to make device labels available, then immediately release the stream.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableDevices = devices.filter((device) => device.kind === 'videoinput');
        
        // 优先选择后置摄像头
        const backCamera = availableDevices.find(d => /back|environment/i.test(d.label));
        selectedDeviceId = backCamera?.deviceId ?? availableDevices[0]?.deviceId ?? '';
      } finally {
        try {
          for (const track of stream.getTracks()) track.stop();
        } catch { /* intentionally empty */ }
      }
    } catch (error) {
      permissionError = $t('scanner.errors.permissionDenied');
      console.error(error);
    }
  }

  async function startScanner() {
    if (!browser) return;
    if (!videoElement) return;

    if (!selectedDeviceId && availableDevices.length === 0) {
      await prepareDevices();
    }

    try {
      if (scanner) {
        try { scanner.dispose(); } catch { /* intentionally empty */ }
        scanner = null;
      }
      scanner = new QrCameraScanner((text: string) => handleResult(text, 'camera'));
      await scanner.startCamera({ video: videoElement, deviceId: selectedDeviceId || undefined, playsInline: true });
      scanner.startScanning({ fps: 12, stopOnFirstResult: true, onDecodeError: () => {} });
      activeDeviceId = scanner.getActiveDeviceId() ?? (selectedDeviceId || '');

      unsubscribeStatus?.();
      unsubscribeStatus = scanner.subscribeStatus((st) => {
        videoReadyState = st.videoReady;
        scanningState = { scanning: st.scanning, inFlight: st.inFlight };
        scanning = st.scanning;
      });
    } catch (error) {
      scanning = false;
      scanningState = { scanning: false, inFlight: false };
      videoReadyState = null;
      const reason = error instanceof Error ? error.message : '';
      permissionError = reason ? `${$t('scanner.errors.startFailed')} (${reason})` : $t('scanner.errors.startFailed');
      console.error(error);
    }
  }

  function stopScanner() {
    try {
      if (scanner) {
        try { scanner.dispose(); } catch { /* intentionally empty */ }
        scanner = null;
      }
    } catch { /* intentionally empty */ }

    unsubscribeStatus?.();
    unsubscribeStatus = null;

    scanning = false;
    activeDeviceId = '';
    disableTorch();
    videoReadyState = null;
    scanningState = { scanning: false, inFlight: false };
  }

  function handleResult(text: string, source: 'camera' | 'upload') {
    lastResult = text;
    const supportsRandomUuid = typeof crypto.randomUUID === 'function';
    const id = supportsRandomUuid ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    scanHistory = [{ id, text, source, timestamp: Date.now() }, ...scanHistory].slice(0, MAX_HISTORY);
    if (navigator.vibrate) {
      navigator.vibrate(120);
    }
  }

  async function copyText(value: string) {
    if (!navigator.clipboard) {
      alert($t('scanner.errors.copyNotSupported'));
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    let decoder: QRDecoder | null = null;
    try {
      const debug = import.meta.env.DEV;
      decoder = new QRDecoder();
      const res = await decoder.decodeFromFile(file);
      if (res?.ok) {
        handleResult(res.text, 'upload');
      } else {
        permissionError = debug ? `${$t('scanner.errors.uploadFailed')}（${res?.reason ?? 'unknown'}）` : $t('scanner.errors.uploadFailed');
      }
    } catch (error) {
      permissionError = $t('scanner.errors.uploadFailed');
      console.error(error);
    } finally {
      try { decoder?.dispose(); } catch { /* intentionally empty */ }
      input.value = '';
    }
  }

  async function toggleTorch() {
    if (!videoElement || !videoElement.srcObject) return;
    const track = (videoElement.srcObject as MediaStream).getVideoTracks()[0];
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
    if (!capabilities.torch) return;

    torchEnabled = !torchEnabled;
    const constraints: TorchMediaTrackConstraints = { advanced: [{ torch: torchEnabled }] };
    await track.applyConstraints(constraints);
  }

  function disableTorch() {
    if (!torchEnabled || !videoElement?.srcObject) return;
    const track = (videoElement.srcObject as MediaStream).getVideoTracks()[0];
    const constraints: TorchMediaTrackConstraints = { advanced: [{ torch: false }] };
    track.applyConstraints(constraints).finally(() => {
      torchEnabled = false;
    });
  }

  $: if (hydrated && scanning && !switchingCamera && activeDeviceId && selectedDeviceId !== activeDeviceId) {
    switchingCamera = true;
    Promise.resolve()
      .then(() => {
        stopScanner();
        return startScanner();
      })
      .finally(() => {
        switchingCamera = false;
      });
  }
</script>

<section class="space-y-8 py-10">
  <header class="space-y-3 text-center">
    <p class="text-xs uppercase tracking-[0.4em] text-cyan-300">QR Scan</p>
    <h1 class="text-3xl font-bold text-white md:text-4xl">{$t('scanner.title')}</h1>
    <p class="text-base text-slate-300">{$t('scanner.subtitle')}</p>
  </header>

  <div class="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
    <section class="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      {#if permissionError}
        <div class="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-100">
          {permissionError}
        </div>
      {/if}

      <div class="mt-4 space-y-3">
        <div class="relative">
          <span aria-hidden="true" class="absolute -top-2 left-2 z-10 bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400">{$t('scanner.cameraLabel')}</span>
          <Dropdown
            options={deviceOptions}
            bind:value={selectedDeviceId}
            disabled={availableDevices.length === 0}
            placeholder={availableDevices.length === 0 ? $t('scanner.noCameraDetected') : ''}
            triggerClass="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-left text-white transition hover:border-white/20 focus:outline-none disabled:opacity-50"
          />
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class={`rounded-2xl px-5 py-3 font-semibold ${scanning ? 'bg-emerald-500 text-slate-900' : 'bg-white/10 text-white'}`}
            on:click={scanning ? stopScanner : startScanner}
          >
            {scanning ? $t('scanner.stopScanning') : $t('scanner.startScanning')}
          </button>
          {#if videoReadyState && !videoReadyState.ready}
            <span class="self-center text-sm text-slate-400 ml-2 animate-pulse">{$t('scanner.waitingCamera')}{videoReadyState.reason}</span>
          {:else if scanningState.scanning}
            <span class="self-center text-sm text-emerald-300 ml-2">{$t('scanner.scanning')}</span>
          {/if}
          <button
            type="button"
            class="rounded-2xl border border-white/10 px-5 py-3 text-sm text-slate-200"
            on:click={() => uploadInput?.click()}
          >
            {$t('scanner.scanFromImage')}
          </button>
          <input type="file" accept="image/*" class="hidden" bind:this={uploadInput} on:change={handleFile} />
          <button type="button" class="rounded-2xl border border-white/20 px-5 py-3 text-sm text-slate-200" on:click={toggleTorch}>
            {torchEnabled ? $t('scanner.toggleTorch.on') : $t('scanner.toggleTorch.off')}
          </button>
        </div>
      </div>
    </section>

    <section class="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div class="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
        <video bind:this={videoElement} class="aspect-video w-full bg-slate-950 object-cover" autoplay playsinline muted></video>
      </div>

      <div class="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
        <p class="text-xs uppercase tracking-[0.4em] text-cyan-200">{$t('scanner.result.title')}</p>
        {#if lastResult}
          <div class="mt-2 text-left">
            <p class="font-mono text-sm text-white">{$t('scanner.result.label')}{lastResult}</p>
          </div>
          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <button type="button" class="rounded-full border border-white/20 px-4 py-1" on:click={() => copyText(lastResult)}>
              {$t('scanner.copyText')}
            </button>
          </div>
        {:else}
          <p class="mt-2 text-slate-400">{$t('scanner.result.empty')}</p>
        {/if}
      </div>

      <div class="mt-4">
        <h3 class="text-sm font-semibold text-white">{$t('scanner.history.title')}</h3>
        <ul class="mt-3 space-y-3 text-xs text-slate-300">
          {#if scanHistory.length === 0}
            <li class="rounded-2xl border border-white/10 px-3 py-2 text-slate-500">{$t('scanner.history.empty')}</li>
          {:else}
            {#each scanHistory as record}
              <li class="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] uppercase tracking-[0.3em] text-cyan-200">{record.source}</span>
                  <time class="text-slate-500">{new Date(record.timestamp).toLocaleTimeString()}</time>
                </div>
                <p class="mt-2 break-words font-mono text-[13px] text-white">{$t('scanner.history.content')}{record.text}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button type="button" class="rounded-full border border-white/15 px-3 py-1" on:click={() => copyText(record.text)}>
                    {$t('common.copy')}
                  </button>
                </div>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </section>
  </div>
</section>

