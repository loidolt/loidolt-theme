<script lang="ts">
  import { CoordinateDisplay, MapView } from '@loidolt/theme-maps';
  import { portland } from '$lib/sample-geo.js';
</script>

<div class="ldt-grid" style="--ldt-min: 16rem;">
  <MapView label="Coordinates in decimal degrees" center={portland} zoom={12} height={280}>
    <CoordinateDisplay />
  </MapView>
  <MapView label="Coordinates in degrees and minutes" center={portland} zoom={12} height={280}>
    <CoordinateDisplay format="dms" showZoom={false} />
  </MapView>
</div>
