<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  // Generic type T for option value
  type T = $$Generic;

  export let options: Array<{ value: T; label: string; disabled?: boolean; [key: string]: any }> = [];
  export let value: T | undefined = undefined;
  export let placeholder: string = '';
  export let placement: 'top' | 'bottom' | 'top-end' | 'bottom-end' = 'bottom';
  export let width: string = '100%';
  export let disabled: boolean = false;
  
  // Styling props
  export let containerClass: string = '';
  export let triggerClass: string = '';
  export let menuClass: string = '';
  export let optionClass: string = '';
  
  // State
  export let open: boolean = false;

  const dispatch = createEventDispatcher<{
    change: T;
    open: void;
    close: void;
  }>();

  let container: HTMLElement;

  function toggle() {
    if (disabled) return;
    open = !open;
    if (open) dispatch('open');
    else dispatch('close');
  }

  function select(option: typeof options[0]) {
    if (option.disabled) return;
    value = option.value;
    dispatch('change', value);
    open = false;
    dispatch('close');
  }

  function handleOutsideClick(event: MouseEvent) {
    if (open && container && !container.contains(event.target as Node)) {
      open = false;
      dispatch('close');
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      open = false;
      dispatch('close');
      event.stopPropagation();
    }
  }

  $: selectedOption = options.find(o => o.value === value);
  $: displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Calculate menu position classes
  $: placementClasses = {
    'top': 'bottom-full mb-2 left-0',
    'bottom': 'top-full mt-2 left-0',
    'top-end': 'bottom-full mb-2 right-0',
    'bottom-end': 'top-full mt-2 right-0'
  }[placement] || 'top-full mt-2 left-0';

</script>

<svelte:window on:click={handleOutsideClick} on:keydown={handleKeydown} />

<div class={`relative inline-block ${containerClass}`} style="width: {width}" bind:this={container}>
  <!-- Trigger -->
  <button
    type="button"
    class={triggerClass || "flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-left text-sm text-white transition hover:border-white/20 focus:outline-none disabled:opacity-50"}
    on:click={toggle}
    {disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    {...$$restProps}
  >
    <slot name="trigger" {value} {open} {displayLabel}>
      <span class="truncate">{displayLabel}</span>
      <svg
        viewBox="0 0 20 20"
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200"
        class:rotate-180={open}
        aria-hidden="true"
      >
        <path
          d="M5.5 7.5 10 12l4.5-4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </slot>
  </button>

  <!-- Menu -->
  {#if open}
    <div
      class={`absolute z-50 min-w-full rounded-xl border border-white/10 bg-slate-950/95 p-1.5 shadow-xl backdrop-blur ${placementClasses} ${menuClass}`}
      transition:fly={{ y: placement.startsWith('top') ? 10 : -10, duration: 200 }}
    >
      <div class="max-h-60 overflow-y-auto custom-scrollbar" role="listbox">
        {#if options.length > 0}
          {#each options as option}
            <button
              type="button"
              class={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                option.value === value
                  ? 'bg-white/10 text-white'
                  : 'text-slate-200 hover:bg-white/5 hover:text-white'
              } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''} ${optionClass}`}
              on:click={() => select(option)}
              disabled={option.disabled}
              role="option"
              aria-selected={option.value === value}
            >
              <slot name="option" {option} selected={option.value === value}>
                <span>{option.label}</span>
                {#if option.value === value}
                  <span class="text-cyan-300">✓</span>
                {/if}
              </slot>
            </button>
          {/each}
        {:else}
          <div class="px-3 py-2 text-sm text-slate-500">No options</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>