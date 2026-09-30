<script lang="ts">
  import Thumbnail from '../../components/Thumbnail.svelte';
  import { mediaLabel, mediaThumbnail, type MediaItem } from '../../media-utils.js';

  /* One pressable tile in a MediaGrid: the preview, plus a kind marker for time-based media. */
  interface Props {
    item: MediaItem;
    index: number;
    ratio?: string | number;
    kindLabels: Record<MediaItem['kind'], string>;
    onSelect: () => void;
  }

  let { item, index, ratio, kindLabels, onSelect }: Props = $props();

  const label = $derived(mediaLabel(item, index));
  const preview = $derived(mediaThumbnail(item));
</script>

<button
  type="button"
  class="ldt-media-tile"
  data-roving-item
  aria-label={item.kind === 'image' ? label : `${label}, ${kindLabels[item.kind]}`}
  onclick={onSelect}
>
  <Thumbnail src={preview} alt="" {ratio} fit="cover">
    {#snippet overlay()}
      {#if item.kind !== 'image'}<span class="ldt-media-tile__kind" aria-hidden="true"
          >{kindLabels[item.kind]}</span
        >{/if}
    {/snippet}
  </Thumbnail>
  {#if item.caption}<span class="ldt-media-tile__caption" aria-hidden="true">{item.caption}</span
    >{/if}
</button>
