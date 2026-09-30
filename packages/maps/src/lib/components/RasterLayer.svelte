<script lang="ts">
  import { useLayer, type LayerProps } from '../internal/use-layer.svelte.js';

  /* Raster tiles or an image from a raster source. */
  type Props = LayerProps;

  let props: Props = $props();

  useLayer(
    'raster',
    () => props,
    () => ({ paint: { 'raster-opacity': 1 } })
  );
</script>
