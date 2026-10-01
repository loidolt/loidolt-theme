<script lang="ts">
  import type { MapColors } from '@loidolt/theme-tokens';
  import { useLayer, type LayerProps } from '../internal/use-layer.svelte.js';

  /* Point density as a heatmap, coloured on the sequential ramp. */
  type Props = LayerProps;

  let props: Props = $props();

  useLayer(
    'heatmap',
    () => props,
    (colors: MapColors) => ({
      paint: {
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          `${colors.sequential[0].slice(0, 7)}00`,
          0.2,
          colors.sequential[0],
          0.4,
          colors.sequential[1],
          0.6,
          colors.sequential[2],
          0.8,
          colors.sequential[3],
          1,
          colors.sequential[4],
        ],
        'heatmap-opacity': 0.85,
      },
    })
  );
</script>
