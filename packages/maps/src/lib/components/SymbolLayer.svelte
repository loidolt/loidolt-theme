<script lang="ts">
  import type { MapColors } from '@loidolt/theme-tokens';
  import { useLayer, type LayerProps } from '../internal/use-layer.svelte.js';

  /* Text and icons placed on features. Labels default to the map label colour and halo. */
  type Props = LayerProps;

  let props: Props = $props();

  useLayer(
    'symbol',
    () => props,
    (colors: MapColors) => ({
      paint: {
        'text-color': colors.label,
        'text-halo-color': colors.labelHalo,
        'text-halo-width': 1.4,
      },
      layout: { 'text-font': ['Noto Sans Regular'], 'text-size': 12 },
    })
  );
</script>
