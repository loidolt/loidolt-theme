<script lang="ts">
  import { BasemapSwitcher, CircleLayer, MapSource, MapView } from '@loidolt/theme-maps';
  import { portland, stopPoints } from '$lib/sample-geo.js';

  let basemap = $state('default');
</script>

<div class="ldt-stack">
  <MapView label="Stops on either basemap" center={portland} zoom={12.4} bind:basemap height={320}>
    <BasemapSwitcher />
    <MapSource id="switch-stops" data={stopPoints}>
      <CircleLayer id="switch-stop-points" />
    </MapSource>
  </MapView>
  <p class="ldt-eyebrow">Showing: {basemap}</p>
</div>
