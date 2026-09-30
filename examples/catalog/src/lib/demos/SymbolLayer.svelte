<script lang="ts">
  import { CircleLayer, MapSource, MapView, SymbolLayer } from '@loidolt/theme-maps';
  import { portland, stopPoints } from '$lib/sample-geo.js';
</script>

<MapView label="Named stops" center={portland} zoom={12.4} height={340}>
  <MapSource id="named-stops" data={stopPoints}>
    <CircleLayer id="named-stop-points" paint={{ 'circle-radius': 4 }} />
    <SymbolLayer
      id="named-stop-labels"
      layout={{ 'text-field': ['get', 'name'], 'text-offset': [0, 1.2], 'text-anchor': 'top' }}
    />
  </MapSource>
</MapView>
