<script lang="ts">
  import type { Map as MapLibreMap } from 'maplibre-gl';
  import { MapFeatureList, MapMarker, MapView } from '@loidolt/theme-maps';
  import { portland, stops } from '$lib/sample-geo.js';

  let map = $state<MapLibreMap | null>(null);
  let selected = $state<string | number | null>(null);
</script>

<div class="ldt-grid" style="--ldt-min: 16rem;">
  <MapView label="Stops" center={portland} zoom={11.4} bind:map height={320}>
    {#each stops as stop, index (stop.id)}
      <MapMarker
        lngLat={stop.lngLat}
        label={stop.label}
        number={index + 1}
        active={selected === stop.id}
        onSelect={() => (selected = stop.id)}
      />
    {/each}
  </MapView>
  <MapFeatureList label="Stops on this map" items={stops} {map} bind:selected />
</div>
