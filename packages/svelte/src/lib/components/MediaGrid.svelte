<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { rovingFocus } from '../attachments.js';
  import MediaTile from '../internal/media/MediaTile.svelte';
  import { mediaKey, type AspectRatioName, type MediaItem } from '../media-utils.js';
  import { cx } from '../utils.js';
  import Lightbox from './Lightbox.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
    items: MediaItem[];
    /** Accessible name of the collection. */
    label: string;
    /** `grid` crops tiles to `ratio`; `masonry` keeps each image's own shape in columns. */
    variant?: 'grid' | 'masonry';
    /** Narrowest a column may get before the grid drops one. */
    minColumnWidth?: string;
    gap?: 'sm' | 'md' | 'lg';
    ratio?: AspectRatioName | string | number;
    /** Open a `Lightbox` on the pressed item. */
    lightbox?: boolean;
    /** Called when an item is pressed, whether or not the lightbox opens. */
    onSelect?: (index: number, item: MediaItem) => void;
    /** Words for the marker on time-based tiles. */
    kindLabels?: Partial<Record<MediaItem['kind'], string>>;
    class?: string;
    ref?: HTMLUListElement | null;
  }

  let {
    items,
    label,
    variant = 'grid',
    minColumnWidth = '12rem',
    gap = 'md',
    ratio = 'photo',
    lightbox = true,
    onSelect,
    kindLabels,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const kinds = $derived({
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    embed: 'Video',
    ...kindLabels,
  });
  let open = $state(false);
  let active = $state(0);

  function select(index: number) {
    onSelect?.(index, items[index]);
    if (!lightbox) return;
    active = index;
    open = true;
  }
</script>

<!--
  A list with one tab stop: arrow keys, Home and End move between tiles, so a long gallery costs
  a keyboard user one Tab rather than one per image.
-->
<ul
  bind:this={ref}
  class={cx(
    'ldt-media-grid',
    variant === 'masonry' && 'ldt-media-grid--masonry',
    gap !== 'md' && `ldt-media-grid--${gap}`,
    className
  )}
  style:--ldt-media-grid-min={minColumnWidth}
  aria-label={label}
  {@attach rovingFocus({ orientation: 'both' })}
  {...rest}
>
  {#each items as item, index (mediaKey(item, index))}
    <li class="ldt-media-grid__item">
      <MediaTile
        {item}
        {index}
        ratio={variant === 'masonry' ? 'auto' : ratio}
        kindLabels={kinds}
        onSelect={() => select(index)}
      />
    </li>
  {/each}
</ul>
{#if lightbox}<Lightbox {items} bind:open bind:index={active} title={label} showThumbnails />{/if}
