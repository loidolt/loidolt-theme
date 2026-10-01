<script lang="ts">
  import {
    CircleLayer,
    MapSource,
    MapView,
    SymbolLayer,
    clusterColor,
    clusterRadius,
    expandCluster,
  } from '@loidolt/theme-maps';
  import { jobs, portland } from '$lib/sample-geo.js';
  import type { Map as MapLibreMap } from 'maplibre-gl';

  let map = $state<MapLibreMap | null>(null);
</script>

<MapView label="Recent jobs, clustered" center={portland} zoom={11.5} bind:map height={360}>
  <MapSource id="jobs" data={jobs} cluster={{ radius: 40 }}>
    <CircleLayer
      id="job-clusters"
      label="Clusters"
      filter={['has', 'point_count']}
      paint={(colors) => ({
        'circle-color': clusterColor(colors),
        'circle-radius': clusterRadius(),
        'circle-stroke-color': colors.surface,
      })}
      onClick={({ feature }) => map && expandCluster(map as never, 'jobs', feature)}
    />
    <SymbolLayer
      id="job-cluster-count"
      filter={['has', 'point_count']}
      layout={{ 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 11 }}
      paint={(colors) => ({
        'text-color': colors.text,
        'text-halo-color': colors.surface,
        'text-halo-width': 1.5,
      })}
    />
    <CircleLayer id="job-points" label="Jobs" filter={['!', ['has', 'point_count']]} />
  </MapSource>
</MapView>
