<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import { registerSW } from 'virtual:pwa-register';
  import { t } from '$lib/i18n';

  // --- Update Notification State ---
  let needRefresh = false;
  let updateServiceWorker: () => void = () => {};
  let swUpdateInterval: ReturnType<typeof setInterval> | null = null;

  // --- Install Prompt State ---
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  let showInstallPrompt = false;
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  let installing = false;

  // --- Lifecycle ---
  onMount(() => {
    if (!browser) return;

    // 1. Register Service Worker
    const updateSW = registerSW({
      onRegistered(r) {
        console.log('SW Registered: ', r);
        if (r) {
          swUpdateInterval = setInterval(() => {
            r.update();
          }, 60 * 60 * 1000); // Check every hour instead of minute to be less aggressive
        }
      },
      onRegisterError(e) {
        console.warn('SW registration failed:', e);
      },
      onNeedRefresh() {
        console.log('New content available, please refresh.');
        needRefresh = true;
      },
      onOfflineReady() {
        console.log('App ready to work offline');
      },
    });
    updateServiceWorker = () => {
      updateSW(true);
    };

    // 2. Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Return cleanup function for onMount
    return () => {
      if (swUpdateInterval !== null) {
        clearInterval(swUpdateInterval);
        swUpdateInterval = null;
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  });

  // Keep onDestroy as fallback for edge cases
  onDestroy(() => {
    if (swUpdateInterval !== null) {
      clearInterval(swUpdateInterval);
      swUpdateInterval = null;
    }
    if (browser) {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  });

  // --- Update Notification Handlers ---
  function handleUpdateClick() {
    updateServiceWorker();
  }

  function handleDismissUpdate() {
    needRefresh = false;
  }

  // --- Install Prompt Handlers ---
  function isInstalled(): boolean {
    if (!browser) return false;
    
    // Check if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    
    // iOS Safari fullscreen mode
    if ((navigator as any).standalone === true) {
      return true;
    }
    
    return false;
  }

  function isDismissed(): boolean {
    if (!browser) return false;
    try {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) return false;
      
      // Auto-show again after 7 days
      const dismissedTime = parseInt(dismissed, 10);
      const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      return daysSince < 7;
    } catch {
      return false;
    }
  }

  function handleBeforeInstallPrompt(e: Event) {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Don't show if already installed or user dismissed recently
    if (isInstalled() || isDismissed()) {
      return;
    }
    
    // Show install banner
    showInstallPrompt = true;
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    
    installing = true;
    
    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    } finally {
      // Clear the deferred prompt
      deferredPrompt = null;
      showInstallPrompt = false;
      installing = false;
    }
  }

  function handleDismissInstall() {
    showInstallPrompt = false;
    deferredPrompt = null;
    
    // Remember dismissal
    try {
      localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    } catch {
      // Ignore localStorage errors
    }
  }
</script>

<!-- Update Notification UI -->
{#if needRefresh}
  <div class="fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 animate-slide-down">
    <div class="overflow-hidden rounded-xl border border-amber-400/30 bg-slate-900/95 shadow-xl shadow-amber-500/20 backdrop-blur">
      <div class="flex items-center gap-4 p-4">
        <!-- Icon -->
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <svg viewBox="0 0 20 20" class="h-6 w-6" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-white">{$t('pwa.update.title')}</h3>
          <p class="mt-0.5 text-xs text-slate-300">{$t('pwa.update.message')}</p>
        </div>

        <!-- Actions -->
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            on:click={handleDismissUpdate}
          >
            {$t('pwa.update.later')}
          </button>
          <button
            type="button"
            class="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow transition hover:bg-amber-400"
            on:click={handleUpdateClick}
          >
            {$t('pwa.update.reload')}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Install Prompt UI -->
{#if showInstallPrompt}
  <div class="fixed bottom-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 animate-slide-up">
    <div class="overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/95 shadow-xl shadow-cyan-500/20 backdrop-blur">
      <div class="flex items-center gap-4 p-4">
        <!-- Icon -->
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg">
          <div class="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900">
            <img src="/favicon.svg" alt="App Icon" class="h-8 w-8" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-white">{$t('pwa.install.title')}</h3>
          <p class="mt-0.5 text-xs text-slate-300">{$t('pwa.install.description')}</p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-cyan-400 disabled:opacity-50"
            on:click={handleInstallClick}
            disabled={installing}
          >
            {installing ? $t('pwa.install.installing') : $t('pwa.install.button')}
          </button>
          <button
            type="button"
            class="text-[10px] font-medium text-slate-400 hover:text-slate-200"
            on:click={handleDismissInstall}
          >
            {$t('pwa.install.dismiss')}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-down {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
