<script lang="ts">
  import { Input, Tabs, type TabItem } from '@loidolt/theme-svelte';

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'tokens', label: 'Tokens' },
    { value: 'usage', label: 'Usage' },
  ];
</script>

{#snippet pin()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle
      cx="12"
      cy="10"
      r="2.5"
    /></svg
  >{/snippet}
{#snippet waves()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><path d="M2 8c3-2 5 2 8 0s5-2 8 0 4 0 4 0M2 14c3-2 5 2 8 0s5-2 8 0 4 0 4 0" /></svg
  >{/snippet}
{#snippet type()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><path d="M5 6V4h14v2M12 4v16M9 20h6" /></svg
  >{/snippet}

<div class="ldt-stack">
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

  <div style="height: 16rem; border: 1px solid var(--loidolt-border)">
    <Tabs
      variant="rail"
      orientation="vertical"
      label="Settings"
      tabs={[
        {
          value: 'place',
          label: 'Place',
          icon: pin,
          description: 'Where the model is and how big',
        },
        { value: 'water', label: 'Water', icon: waves, description: 'Shorelines and depth' },
        { value: 'labels', label: 'Labels', icon: type, description: 'Text and marks' },
      ] satisfies TabItem[]}
    >
      {#snippet panelHeader()}<div style="padding: var(--loidolt-space-3)">
          <Input type="search" placeholder="Find a setting" aria-label="Find a setting" />
        </div>{/snippet}
      {#snippet children({ value })}
        <div style="padding: 0 var(--loidolt-space-3) var(--loidolt-space-3)">
          {#if value === 'place'}
            Location, crop shape and size. Every panel stays mounted, so a hidden panel keeps its
            state.
          {:else if value === 'water'}
            Outlines, carved depth and inserts, in one place.
          {:else}
            Font, text size and the marks placed on the map.
          {/if}
        </div>
      {/snippet}
    </Tabs>
  </div>
</div>
