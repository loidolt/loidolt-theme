<script lang="ts">
  import type { MapColors } from '@loidolt/theme-tokens';
  import { useLayer, type LayerProps } from '../internal/use-layer.svelte.js';

  /* Lines — routes, boundaries, outlines. Defaults to the accent colour. */
  type Props = LayerProps;

  let props: Props = $props();

  useLayer(
    'line',
    () => props,
    (colors: MapColors) => ({
      paint: { 'line-color': colors.accent, 'line-width': 2.5 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    })
  );
</script>
