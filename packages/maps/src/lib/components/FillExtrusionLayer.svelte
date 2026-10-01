<script lang="ts">
  import type { MapColors } from '@loidolt/theme-tokens';
  import { useLayer, type LayerProps } from '../internal/use-layer.svelte.js';

  /* Polygons raised into 3D by a height property. */
  type Props = LayerProps;

  let props: Props = $props();

  useLayer(
    'fill-extrusion',
    () => props,
    (colors: MapColors) => ({
      paint: { 'fill-extrusion-color': colors.categorical[1], 'fill-extrusion-opacity': 0.8 },
    })
  );
</script>
