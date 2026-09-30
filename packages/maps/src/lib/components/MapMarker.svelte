<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { Marker as MapLibreMarker } from 'maplibre-gl';
  import { Marker, cx } from '@loidolt/theme-svelte';
  import type { LngLat } from '../core/types.js';
  import { requireMapContext } from '../internal/context.js';
  import { safely } from '../internal/safely.js';
  import MapPopup from './MapPopup.svelte';

  interface Props {
    /** Where the marker stands. */
    lngLat: LngLat;
    /** Names the marker — its button's accessible name. */
    label: string;
    /** A number printed in the marker, e.g. a stop's order. */
    number?: number;
    /** `pin` points at its spot from above; `dot` sits centred on it. */
    shape?: 'pin' | 'dot';
    /** Draws the marker in its selected state. */
    active?: boolean;
    /** Let the marker be dragged to a new spot (pointer only). */
    draggable?: boolean;
    /** The marker was pressed — by pointer, Enter or Space. */
    onSelect?: () => void;
    /** A drag ended, at this spot. */
    onDragEnd?: (lngLat: LngLat) => void;
    /** Content for a popup the marker opens when pressed. Focus moves in, and back on close. */
    popup?: Snippet;
    /** Names the popup. Defaults to `label`. */
    popupLabel?: string;
    /** Whether the popup is showing. Bindable. */
    popupOpen?: boolean;
    /** Custom marker content in place of the loidolt pin. */
    children?: Snippet;
    class?: string;
  }

  let {
    lngLat,
    label,
    number,
    shape = 'pin',
    active = false,
    draggable = false,
    onSelect,
    onDragEnd,
    popup,
    popupLabel,
    popupOpen = $bindable(false),
    children,
    class: className,
  }: Props = $props();

  const context = requireMapContext('MapMarker');
  let element = $state<HTMLElement | null>(null);
  // Something to do makes it a button; otherwise it is a named picture, not a dead tab stop.
  const interactive = $derived(Boolean(popup || onSelect || draggable));
  let marker = $state.raw<MapLibreMarker | null>(null);

  $effect(() => {
    const target = context.map;
    const lib = context.lib;
    const node = element;
    if (!target || !lib || !node) return;
    // The pin's point is its bottom-left corner; a dot is centred on its spot.
    const created = new lib.Marker({
      element: node,
      anchor: untrack(() => (shape === 'pin' ? 'bottom-left' : 'center')),
      draggable: untrack(() => draggable),
    })
      .setLngLat(untrack(() => lngLat))
      .addTo(target);
    created.on('dragend', () => {
      const { lng, lat } = created.getLngLat();
      onDragEnd?.([lng, lat]);
    });
    marker = created;
    return () => {
      marker = null;
      safely(() => created.remove());
    };
  });

  $effect(() => {
    marker?.setLngLat(lngLat);
  });
  $effect(() => {
    marker?.setDraggable(draggable);
  });
</script>

<div hidden>
  {#if interactive}
    <button
      bind:this={element}
      type="button"
      class={cx('ldt-map-marker', className)}
      aria-label={label}
      aria-haspopup={popup ? 'dialog' : undefined}
      aria-expanded={popup ? popupOpen : undefined}
      onclick={(event) => {
        // The map must not also take this as a click on the map, which closes popups.
        event.stopPropagation();
        if (popup) popupOpen = !popupOpen;
        onSelect?.();
      }}
    >
      {@render face()}
    </button>
  {:else}
    <span bind:this={element} class={cx('ldt-map-marker', className)} role="img" aria-label={label}>
      {@render face()}
    </span>
  {/if}
</div>

{#snippet face()}
  {#if children}{@render children()}{:else}<Marker {shape} {number} {active} />{/if}
{/snippet}

{#if popup}
  <MapPopup
    {lngLat}
    label={popupLabel ?? label}
    bind:open={popupOpen}
    offset={shape === 'pin' ? 28 : 14}
  >
    {@render popup()}
  </MapPopup>
{/if}
