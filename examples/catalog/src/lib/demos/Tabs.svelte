<script lang="ts">
  import { Tabs } from '@loidolt/theme-svelte';

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'tokens', label: 'Tokens' },
    { value: 'usage', label: 'Usage' },
  ];
</script>

<Tabs {tabs} label="Detail views">
  {#snippet children({ value })}
    {#if value === 'overview'}
      A small, coherent foundation for Loidolt applications.
    {:else if value === 'tokens'}
      Typed values and CSS custom properties stay in sync.
    {:else}
      Import the stylesheet once, then the components you need.
    {/if}
  {/snippet}
</Tabs>
