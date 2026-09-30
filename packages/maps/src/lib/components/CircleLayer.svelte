<script lang="ts">
  import type { MapColors } from '@loidolt/theme-tokens';
  import { useLayer, type LayerProps } from '../internal/use-layer.svelte.js';

  /* Points as circles. Defaults to accent dots with a surface-coloured ring. */
  type Props = LayerProps;

  let props: Props = $props();

  useLayer(
    'circle',
    () => props,
    (colors: MapColors) => ({
      paint: {
        'circle-color': colors.accent,
        'circle-radius': 6,
        'circle-stroke-color': colors.surface,
        'circle-stroke-width': 1.5,
      },
    })
  );
</script>
