<script lang="ts">
  import { CircleLayer, LineLayer, MapSource, MapView } from '@loidolt/theme-maps';
  import { portland, route, stopPoints } from '$lib/sample-geo.js';
</script>

<MapView label="Delivery route" center={portland} zoom={12.4} height={340}>
  <MapSource id="route" data={route}>
    <LineLayer id="route-line" paint={{ 'line-width': 3, 'line-dasharray': [2, 1] }} />
  </MapSource>
  <MapSource id="route-stops" data={stopPoints}>
    <CircleLayer id="route-stop-points" />
  </MapSource>
</MapView>
