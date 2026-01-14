<script lang="ts">
  import { page } from '$app/stores';
  import ScannerPage from '$lib/pages/ScannerPage.svelte';
</script>

<ScannerPage shareId={$page.url.searchParams.get('share')} />
