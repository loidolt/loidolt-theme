<script lang="ts">
  import { cx } from '@loidolt/theme-svelte';
  import { formatCoordinate } from '../core/format.js';
  import type { LngLat } from '../core/types.js';
  import { requireMapContext } from '../internal/context.js';
  import MapControl from './MapControl.svelte';

  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  interface Props {
    position?: Corner;
    /** `decimal` degrees, or degrees, minutes and seconds. */
    format?: 'decimal' | 'dms';
    precision?: number;
    showZoom?: boolean;
    zoomLabel?: string;
    class?: string;
  }

  let {
    position = 'bottom-left',
    format = 'decimal',
    precision,
    showZoom = true,
    zoomLabel = 'Zoom',
    class: className,
  }: Props = $props();

  const context = requireMapContext('CoordinateDisplay');
  let coordinate = $state<LngLat | null>(null);
  let zoom = $state(0);

  // Under the pointer while it is over the map; the centre otherwise, so keyboard users see it too.
  $effect(() => {
    const target = context.map;
    if (!target) return;
    let pointer = false;
    const centre = () => {
      const { lng, lat } = target.getCenter();
      zoom = target.getZoom();
      if (!pointer) coordinate = [lng, lat];
    };
    const move = (event: { lngLat: { lng: number; lat: number } }) => {
      pointer = true;
      coordinate = [event.lngLat.lng, event.lngLat.lat];
    };
    const leave = () => {
      pointer = false;
      centre();
    };
    centre();
    target.on('move', centre);
    target.on('mousemove', move);
    target.on('mouseout', leave);
    return () => {
      target.off('move', centre);
      target.off('mousemove', move);
      target.off('mouseout', leave);
    };
  });
</script>

<MapControl {position}>
  <p class={cx('ldt-map-coordinates', className)}>
    {#if coordinate}<span>{formatCoordinate(coordinate, { format, precision })}</span>{/if}
    {#if showZoom}<span>{zoomLabel} {zoom.toFixed(1)}</span>{/if}
  </p>
</MapControl>
