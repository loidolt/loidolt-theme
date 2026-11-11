<script lang="ts">
  import { base } from '$app/paths';
  import { MapSource, MapView, RasterLayer } from '@loidolt/theme-maps';
  import { Slider } from '@loidolt/theme-svelte';
  import { portland } from '$lib/sample-geo.js';

  let opacity = $state(0.8);
</script>

<div class="ldt-stack">
  <MapView label="Site plan over the map" center={portland} zoom={13} height={340}>
    <MapSource
      id="site-plan"
      spec={{
        type: 'image',
        url: `${base}/media/sample-plan.png`,
        coordinates: [
          [-122.69, 45.532],
          [-122.662, 45.532],
          [-122.662, 45.514],
          [-122.69, 45.514],
        ],
      }}
    >
      <RasterLayer id="site-plan-image" paint={{ 'raster-opacity': opacity }} />
    </MapSource>
  </MapView>
  <Slider
    label="Plan opacity"
    min={0}
    max={1}
    step={0.1}
    bind:value={opacity}
    formatValue={(value) => `${Math.round(value * 100)}%`}
  />
</div>
