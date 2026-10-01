<script lang="ts">
  import { HeatmapLayer, MapLegend, MapSource, MapView } from '@loidolt/theme-maps';
  import { chartColors } from '@loidolt/theme-tokens';
  import { jobs, portland } from '$lib/sample-geo.js';
</script>

<MapView label="Where jobs come from" center={portland} zoom={12} height={340}>
  <MapSource id="heat-jobs" data={jobs}>
    <HeatmapLayer
      id="job-heat"
      paint={{
        'heatmap-weight': ['get', 'weight'],
        'heatmap-radius': 26,
        'heatmap-intensity': 0.6,
      }}
    />
  </MapSource>
  <MapLegend
    title="Job density"
    gradient={{ colors: chartColors().sequential, min: 'Few', max: 'Many' }}
    position="bottom-left"
  />
</MapView>
