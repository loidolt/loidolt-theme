<script lang="ts">
  import { ImageViewer, ListRow, StatusDot } from '@loidolt/theme-svelte';
  import { samplePage } from '$lib/sample-page.js';

  const status = { success: 'Read', warning: 'Check', error: 'Unreadable' } as const;
  let selectedRegionId = $state<string | null>(null);
  let hoveredRegionId = $state<string | null>(null);
</script>

<div
  style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); gap: var(--loidolt-space-3); align-items: start;"
>
  <ImageViewer
    src={samplePage.src}
    alt={samplePage.alt}
    width={samplePage.width}
    height={samplePage.height}
    regions={samplePage.blocks}
    label="Scanned page"
    regionsLabel="Text blocks"
    bind:selectedRegionId
    bind:hoveredRegionId
    style="--ldt-image-viewer-min-height: 24rem;"
  />
  <ul
    aria-label="Recognised text"
    style="max-height: 28rem; overflow: auto; margin: 0; padding: 0; list-style: none;"
  >
    {#each samplePage.blocks as block (block.id)}
      <li>
        <ListRow
          selected={block.id === selectedRegionId}
          data-hovered={block.id === hoveredRegionId ? '' : undefined}
          onclick={() => (selectedRegionId = block.id)}
          onpointerenter={() => (hoveredRegionId = block.id)}
          onpointerleave={() => (hoveredRegionId = null)}
        >
          <StatusDot
            variant={block.variant ?? 'default'}
            label={status[block.variant as keyof typeof status] ?? ''}
          />
          {block.text}
        </ListRow>
      </li>
    {/each}
  </ul>
</div>
