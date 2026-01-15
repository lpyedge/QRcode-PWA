<script lang="ts">
  import { page } from '$app/stores';
  import GeneratorPage from '$lib/pages/GeneratorPage.svelte';
</script>

<GeneratorPage shareId={$page.url.searchParams.get('share')} />
