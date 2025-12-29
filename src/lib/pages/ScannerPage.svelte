<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy, tick } from 'svelte';
  import { fade } from 'svelte/transition';
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
  let activeDeviceId = '';
  
  let isScanning = false;
  let permissionGranted = false;
  let permissionError = '';
  
  let lastResult = '';
  let scanHistory: ScanRecord[] = [];
  
  let uploadedImageUrl: string | null = null;
  
  let torchSupported = false;
  let torchEnabled = false;
  
  let showCopyFeedback = false;
  let copyTimeout: ReturnType<typeof setTimeout> | null = null;

  let videoReadyState: VideoReadyState | null = null;
  let scanningState: { scanning: boolean; inFlight: boolean } = { scanning: false, inFlight: false };
  let unsubscribeStatus: (() => void) | null = null;

  $: deviceOptions = availableDevices.map(d => ({
    value: d.deviceId,
    label: d.label || $t('scanner.cameraDefault')
  }));

  const MAX_HISTORY = 5;

  onDestroy(() => {
    stopScanner();
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    if (copyTimeout) clearTimeout(copyTimeout);
  });

  async function requestPermissions() {
    if (!browser || !navigator.mediaDevices) {
      permissionError = $t('scanner.errors.notSupported');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableDevices = devices.filter((device) => device.kind === 'videoinput');
        
        // 优先选择后置摄像头
        const backCamera = availableDevices.find(d => /back|environment/i.test(d.label));
        selectedDeviceId = backCamera?.deviceId ?? availableDevices[0]?.deviceId ?? '';
        permissionGranted = true;
        permissionError = '';
        return true;
      } finally {
        try {
          for (const track of stream.getTracks()) track.stop();
        } catch { /* intentionally empty */ }
      }
    } catch (error) {
      permissionError = $t('scanner.errors.permissionDenied');
      console.error(error);
      return false;
    }
  }

  async function startScanner() {
    if (!browser) return;
    
    // Clear uploaded image when starting camera
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
      uploadedImageUrl = null;
    }

    if (!permissionGranted) {
      const success = await requestPermissions();
      if (!success) return;
    }

    isScanning = true;
    await tick(); // Ensure video element is rendered

    if (!videoElement) return;

    try {
      if (scanner) {
        try { scanner.dispose(); } catch { /* intentionally empty */ }
        scanner = null;
      }
      scanner = new QrCameraScanner((text: string) => handleResult(text, 'camera'));
      await scanner.startCamera({ video: videoElement, deviceId: selectedDeviceId || undefined, playsInline: true });
      scanner.startScanning({ fps: 12, stopOnFirstResult: true, onDecodeError: () => {} });
      activeDeviceId = scanner.getActiveDeviceId() ?? (selectedDeviceId || '');

      // Check torch support
      checkTorchCapability();

      unsubscribeStatus?.();
      unsubscribeStatus = scanner.subscribeStatus((st) => {
        videoReadyState = st.videoReady;
        scanningState = { scanning: st.scanning, inFlight: st.inFlight };
      });
    } catch (error) {
      stopScanner();
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

    isScanning = false;
    activeDeviceId = '';
    torchEnabled = false;
    torchSupported = false;
    videoReadyState = null;
    scanningState = { scanning: false, inFlight: false };
  }

  function checkTorchCapability() {
    torchSupported = false;
    if (!videoElement || !videoElement.srcObject) return;
    try {
      const track = (videoElement.srcObject as MediaStream).getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      torchSupported = !!capabilities.torch;
    } catch {
      torchSupported = false;
    }
  }

  function handleResult(text: string, source: 'camera' | 'upload') {
    lastResult = text;
    const supportsRandomUuid = typeof crypto.randomUUID === 'function';
    const id = supportsRandomUuid ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    scanHistory = [{ id, text, source, timestamp: Date.now() }, ...scanHistory].slice(0, MAX_HISTORY);
    if (navigator.vibrate) {
      navigator.vibrate(120);
    }
    // If from camera, we might want to stop scanning or just pause? 
    // Current logic in startScanning has stopOnFirstResult: true, so it stops decoding but camera keeps running.
    // Let's keep camera running for now, user can stop manually or scan again.
  }

  async function copyResult() {
    if (!lastResult || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(lastResult);
      showCopyFeedback = true;
      if (copyTimeout) clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        showCopyFeedback = false;
      }, 1000);
    } catch (error) {
      console.error(error);
      alert($t('scanner.errors.copyNotSupported'));
    }
  }

  async function handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Stop camera if running
    if (isScanning) stopScanner();

    // Create preview
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    uploadedImageUrl = URL.createObjectURL(file);

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
    if (!videoElement || !videoElement.srcObject || !torchSupported) return;
    const track = (videoElement.srcObject as MediaStream).getVideoTracks()[0];
    
    try {
      torchEnabled = !torchEnabled;
      const constraints: TorchMediaTrackConstraints = { advanced: [{ torch: torchEnabled }] };
      await track.applyConstraints(constraints);
    } catch (e) {
      console.error('Torch toggle failed', e);
      torchEnabled = !torchEnabled; // revert
    }
  }

  $: if (isScanning && !switchingCamera && activeDeviceId && selectedDeviceId !== activeDeviceId) {
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
  
  let switchingCamera = false;
</script>

<section class="space-y-8 py-10">
  <header class="space-y-3 text-center">
    <p class="text-xs uppercase tracking-[0.4em] text-cyan-300">QR Scan</p>
    <h1 class="text-3xl font-bold text-white md:text-4xl">{$t('scanner.title')}</h1>
    <p class="text-base text-slate-300">{$t('scanner.subtitle')}</p>
  </header>

  <div class="grid gap-8 lg:grid-cols-[1fr,1fr]">
    <!-- Left Column: Preview & Main Actions -->
    <div class="space-y-6">
      <!-- Preview Box -->
      <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 aspect-square sm:aspect-video lg:aspect-square xl:aspect-video shadow-2xl">
        {#if isScanning}
          <video 
            bind:this={videoElement} 
            class="h-full w-full object-cover" 
            autoplay 
            playsinline 
            muted
          ></video>
          <!-- Overlay: Scan Line or Frame could go here -->
          <div class="absolute inset-0 pointer-events-none border-[20px] border-black/30"></div>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div class="w-48 h-48 border-2 border-cyan-400/50 rounded-xl relative">
                <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 -mt-0.5 -ml-0.5"></div>
                <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 -mt-0.5 -mr-0.5"></div>
                <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 -mb-0.5 -ml-0.5"></div>
                <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 -mb-0.5 -mr-0.5"></div>
             </div>
          </div>
        {:else if uploadedImageUrl}
          <img src={uploadedImageUrl} alt="Uploaded QR" class="h-full w-full object-contain bg-slate-900" />
        {:else}
          <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            <p>{$t('scanner.subtitle')}</p>
          </div>
        {/if}

        <!-- Torch Button (Overlay) -->
        {#if isScanning && torchSupported}
          <button 
            type="button" 
            class="absolute top-4 right-4 p-3 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
            on:click={toggleTorch}
            title={torchEnabled ? $t('scanner.toggleTorch.off') : $t('scanner.toggleTorch.on')}
          >
            <svg class="w-5 h-5 {torchEnabled ? 'text-yellow-400' : 'text-slate-300'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- Primary Controls -->
      <div class="flex flex-col sm:flex-row gap-4">
        {#if !isScanning}
          <button
            type="button"
            class="flex-1 rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-slate-900 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-emerald-400/30 transition-all active:scale-[0.98]"
            on:click={startScanner}
          >
            <div class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {$t('scanner.startScanning')}
            </div>
          </button>
        {:else}
          <button
            type="button"
            class="flex-1 rounded-2xl bg-rose-500/10 border border-rose-500/50 px-6 py-4 font-bold text-rose-200 hover:bg-rose-500/20 transition-all active:scale-[0.98]"
            on:click={stopScanner}
          >
            {$t('scanner.stopScanning')}
          </button>
        {/if}

        <button
          type="button"
          class="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-white hover:bg-white/10 transition-all active:scale-[0.98]"
          on:click={() => uploadInput?.click()}
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {$t('scanner.scanFromImage')}
          </div>
        </button>
        <input type="file" accept="image/*" class="hidden" bind:this={uploadInput} on:change={handleFile} />
      </div>

      <!-- Camera Selection (Only when active) -->
      {#if isScanning && availableDevices.length > 1}
        <div class="relative">
          <span aria-hidden="true" class="absolute -top-2 left-3 z-10 bg-slate-900 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{$t('scanner.cameraLabel')}</span>
          <Dropdown
            options={deviceOptions}
            bind:value={selectedDeviceId}
            triggerClass="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-white/20 focus:outline-none"
          />
        </div>
      {/if}

      {#if permissionError}
        <div class="rounded-2xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-100">
          {permissionError}
        </div>
      {/if}
    </div>

    <!-- Right Column: Results & History -->
    <div class="space-y-6">
      <!-- Result Card -->
      <div class="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
        <h2 class="text-xs uppercase tracking-[0.2em] text-cyan-200 mb-4">{$t('scanner.result.title')}</h2>
        
        {#if lastResult}
          <button 
            type="button"
            class="group relative w-full text-left"
            on:click={copyResult}
          >
            <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-5 transition-all group-hover:border-white/20 group-hover:bg-slate-950/80 group-active:scale-[0.99]">
              <p class="break-all font-mono text-sm text-white leading-relaxed">{lastResult}</p>
              <div class="mt-3 flex items-center gap-2 text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                {$t('scanner.copyText')}
              </div>
            </div>

            <!-- Copied Overlay -->
            {#if showCopyFeedback}
              <div 
                transition:fade={{ duration: 200 }}
                class="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-emerald-500/90 backdrop-blur-sm"
              >
                <div class="flex items-center gap-2 font-bold text-white">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  {$t('generator.messages.copied')}
                </div>
              </div>
            {/if}
          </button>
        {:else}
          <div class="rounded-2xl border border-white/5 bg-white/5 p-8 text-center">
            <p class="text-sm text-slate-500">{$t('scanner.result.empty')}</p>
          </div>
        {/if}
      </div>

      <!-- History -->
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 class="text-xs uppercase tracking-[0.2em] text-slate-400 mb-4">{$t('scanner.history.title')}</h3>
        <ul class="space-y-3">
          {#if scanHistory.length === 0}
            <li class="text-sm text-slate-600 text-center py-4">{$t('scanner.history.empty')}</li>
          {:else}
            {#each scanHistory as record}
              <li class="group relative rounded-2xl border border-white/5 bg-slate-900/20 p-4 hover:bg-slate-900/40 transition-colors">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] uppercase tracking-wider font-bold text-slate-500">{record.source}</span>
                  <time class="text-[10px] text-slate-600">{new Date(record.timestamp).toLocaleTimeString()}</time>
                </div>
                <p class="line-clamp-2 break-all font-mono text-xs text-slate-300">{record.text}</p>
                <button 
                  type="button" 
                  class="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"
                  on:click={() => { lastResult = record.text; copyResult(); }}
                  aria-label={$t('common.copy')}
                ></button>
              </li>
            {/each}
          {/if}
        </ul>
      </div>
    </div>
  </div>
</section>


