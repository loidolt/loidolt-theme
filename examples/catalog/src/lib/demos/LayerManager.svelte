<script lang="ts">
  import {
    CircleLayer,
    FillLayer,
    HeatmapLayer,
    LayerManager,
    LineLayer,
    MapSource,
    MapView,
  } from '@loidolt/theme-maps';
  import { areas, jobs, portland, route, stopPoints } from '$lib/sample-geo.js';
</script>

<MapView label="Delivery map with a layer list" center={portland} zoom={12.2} height={420}>
  <MapSource id="manager-zones" data={areas}>
    <FillLayer id="manager-zone-fill" label="Delivery zones" />
  </MapSource>
  <MapSource id="manager-jobs" data={jobs}>
    <HeatmapLayer id="manager-heat" label="Job density" paint={{ 'heatmap-radius': 22 }} />
  </MapSource>
  <MapSource id="manager-route" data={route}>
    <LineLayer id="manager-route-line" label="Route" />
  </MapSource>
  <MapSource id="manager-stops" data={stopPoints}>
    <CircleLayer id="manager-stop-points" label="Stops" />
  </MapSource>
  <LayerManager position="top-left" />
</MapView>
