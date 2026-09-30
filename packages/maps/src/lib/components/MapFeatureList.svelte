<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Map as MapLibreMap } from 'maplibre-gl';
  import { cx } from '@loidolt/theme-svelte';
  import type { MapFeatureItem } from '../core/types.js';
  import { getMapContext } from '../internal/context.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The places on the map, in reading order. */
    items: MapFeatureItem[];
    /** Names the list, e.g. "Stops on this route". */
    label: string;
    /** The map to move. Found automatically inside a `MapView`; pass it when the list sits beside one. */
    map?: MapLibreMap | null;
    /** Zoom level to fly to. */
    zoom?: number;
    /** The chosen item, highlighted. Bindable. */
    selected?: string | number | null;
    onSelect?: (item: MapFeatureItem) => void;
    class?: string;
  }

  let {
    items,
    label,
    map = null,
    zoom = 14,
    selected = $bindable(null),
    onSelect,
    class: className,
    ...rest
  }: Props = $props();

  const context = getMapContext();
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function choose(item: MapFeatureItem) {
    selected = item.id;
    const target = map ?? context?.map;
    const move = { center: item.lngLat, zoom: Math.max(zoom, target?.getZoom() ?? 0) };
    if (context?.reducedMotion ?? reducedMotion) target?.jumpTo(move);
    else target?.flyTo(move);
    onSelect?.(item);
  }
</script>

<!-- Every place on the map, as a list: the non-visual way to find and go to one. -->
<nav class={cx('ldt-map-features', className)} aria-label={label} {...rest}>
  <ul class="ldt-map-features__list">
    {#each items as item (item.id)}
      <li>
        <button
          type="button"
          class="ldt-map-features__item"
          aria-current={selected === item.id ? 'true' : undefined}
          onclick={() => choose(item)}
        >
          <span class="ldt-map-features__label">{item.label}</span>
          {#if item.description}<span class="ldt-map-features__description">{item.description}</span
            >{/if}
        </button>
      </li>
    {/each}
  </ul>
</nav>
