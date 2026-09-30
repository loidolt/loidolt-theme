<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import MapView from '../../src/lib/components/MapView.svelte';
  import MapSource from '../../src/lib/components/MapSource.svelte';
  import FillLayer from '../../src/lib/components/FillLayer.svelte';
  import LineLayer from '../../src/lib/components/LineLayer.svelte';
  import CircleLayer from '../../src/lib/components/CircleLayer.svelte';
  import SymbolLayer from '../../src/lib/components/SymbolLayer.svelte';
  import FillExtrusionLayer from '../../src/lib/components/FillExtrusionLayer.svelte';
  import HeatmapLayer from '../../src/lib/components/HeatmapLayer.svelte';
  import RasterLayer from '../../src/lib/components/RasterLayer.svelte';
  import type { LayerProps } from '../../src/lib/internal/use-layer.svelte.js';

  interface Props {
    data?: ComponentProps<typeof MapSource>['data'];
    cluster?: ComponentProps<typeof MapSource>['cluster'];
    fill?: Partial<LayerProps>;
    showFill?: boolean;
    showSource?: boolean;
    basemap?: string;
    all?: boolean;
  }

  let {
    data = { type: 'FeatureCollection', features: [] },
    cluster,
    fill = {},
    showFill = true,
    showSource = true,
    basemap = 'blank',
    all = false,
  }: Props = $props();
</script>

<MapView label="Parks" {basemap}>
  {#if showSource}
    <MapSource id="parks" {data} {cluster}>
      {#if showFill}<FillLayer id="parks-fill" label="Park areas" {...fill} />{/if}
      {#if all}
        <LineLayer id="parks-line" />
        <CircleLayer id="parks-circle" />
        <SymbolLayer id="parks-label" layout={{ 'text-field': ['get', 'name'] }} />
        <FillExtrusionLayer id="parks-3d" />
        <HeatmapLayer id="parks-heat" />
      {/if}
    </MapSource>
  {/if}
  {#if all}
    <MapSource
      id="aerial"
      spec={{ type: 'raster', tiles: ['https://example.test/{z}/{x}/{y}.png'] }}
      attribution="Aerial"
    >
      <RasterLayer id="aerial-raster" />
    </MapSource>
    <LineLayer id="outside" source="parks" beforeId="parks-fill" />
  {/if}
</MapView>
