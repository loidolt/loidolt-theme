<script lang="ts">
  import type { MapColors } from '@loidolt/theme-tokens';
  import { useLayer, type LayerProps } from '../internal/use-layer.svelte.js';

  /* Shapes filled from polygon data. Defaults to the first series colour, lightly filled. */
  type Props = LayerProps;

  let props: Props = $props();

  useLayer(
    'fill',
    () => props,
    (colors: MapColors) => ({
      paint: {
        'fill-color': colors.categorical[0],
        'fill-opacity': 0.28,
        'fill-outline-color': colors.categorical[0],
      },
    })
  );
</script>
