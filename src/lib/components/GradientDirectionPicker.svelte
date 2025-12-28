<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GeneratorGradientDirection } from '$utils/payloads';

  export let value: GeneratorGradientDirection = 'to-r';

  const dispatch = createEventDispatcher<{ change: GeneratorGradientDirection }>();

  const directions: GeneratorGradientDirection[] = [
    'to-r',
    'to-br',
    'to-b',
    'to-bl',
    'to-l',
    'to-tl',
    'to-t',
    'to-tr',
  ];

  // Map direction to rotation degrees (assuming arrow points right by default)
  const rotations: Record<GeneratorGradientDirection, number> = {
    'to-r': 0,
    'to-br': 45,
    'to-b': 90,
    'to-bl': 135,
    'to-l': 180,
    'to-tl': 225,
    'to-t': 270,
    'to-tr': 315,
  };

  // Track the current visual rotation to ensure smooth clockwise animation
  let currentRotation = 0;
  
  // Initialize currentRotation based on initial value
  $: {
    // Only set initial rotation if we haven't started rotating yet (or on mount)
    if (currentRotation === 0 && value !== 'to-r') {
      currentRotation = rotations[value] || 0;
    }
  }

  function next() {
    const idx = directions.indexOf(value);
    const nextIdx = (idx + 1) % directions.length;
    const nextDir = directions[nextIdx];
    
    // Always add 45 degrees for clockwise rotation
    currentRotation += 45;
    
    dispatch('change', nextDir);
  }
</script>

<button
  type="button"
  class="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-900/60 text-white transition hover:bg-slate-800 focus:border-cyan-400 focus:outline-none"
  on:click={next}
  title="Change Gradient Direction"
>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="h-5 w-5 transition-transform duration-300"
    style="transform: rotate({currentRotation}deg);"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
</button>
