<script lang="ts">
  import { CircleLayer, MapSource, MapView } from '@loidolt/theme-maps';
  import { jobs, portland } from '$lib/sample-geo.js';
</script>

<MapView label="Jobs by size" center={portland} zoom={12} height={340}>
  <MapSource id="sized-jobs" data={jobs}>
    <CircleLayer
      id="sized-job-points"
      paint={(colors) => ({
        'circle-radius': ['interpolate', ['linear'], ['get', 'weight'], 1, 3, 5, 9],
        'circle-color': [
          'step',
          ['get', 'weight'],
          colors.categorical[1],
          3,
          colors.categorical[0],
        ],
        'circle-opacity': 0.85,
      })}
    />
  </MapSource>
</MapView>
