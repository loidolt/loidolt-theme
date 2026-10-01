<script lang="ts">
  import {
    CircleLayer,
    LineLayer,
    MapSource,
    MapView,
    SymbolLayer,
    appleDirectionsUrl,
    boundsOf,
    formatDistance,
    googleDirectionsUrl,
    optimizeRoute,
    type FeatureCollection,
  } from '@loidolt/theme-maps';
  import { stops } from '$lib/sample-geo.js';

  // The workshop is the depot; the rest are visited in the shortest order found.
  const [depot, ...rest] = stops;
  const plan = optimizeRoute(
    depot.lngLat,
    rest.map((stop) => stop.lngLat)
  );
  const ordered = plan.order.map((index) => rest[index]);

  const line: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [depot.lngLat, ...ordered.map((stop) => stop.lngLat)],
        },
      },
    ],
  };
  const points: FeatureCollection = {
    type: 'FeatureCollection',
    features: [depot, ...ordered].map((stop, index) => ({
      type: 'Feature',
      properties: { label: `${index === 0 ? 'Start' : index}. ${stop.label}` },
      geometry: { type: 'Point', coordinates: stop.lngLat },
    })),
  };
  const lngLats = ordered.map((stop) => stop.lngLat);
</script>

<div class="ldt-stack">
  <MapView label="Delivery route, shortest order" bounds={boundsOf(line) ?? undefined} height={360}>
    <MapSource id="route" data={line}>
      <LineLayer id="route-line" paint={{ 'line-width': 3, 'line-dasharray': [2, 1] }} />
    </MapSource>
    <MapSource id="route-stops" data={points}>
      <CircleLayer id="route-stop-points" />
      <SymbolLayer
        id="route-stop-labels"
        layout={{ 'text-field': ['get', 'label'], 'text-offset': [0, 1.1], 'text-anchor': 'top' }}
      />
    </MapSource>
  </MapView>
  <p class="ldt-eyebrow">
    {ordered.length} stops · {formatDistance(plan.total, { locale: 'en' })} as the crow flies ·
    <a href={googleDirectionsUrl(lngLats, { origin: depot.lngLat })} target="_blank" rel="noopener"
      >Google Maps</a
    >
    ·
    <a href={appleDirectionsUrl(lngLats, { origin: depot.lngLat })} target="_blank" rel="noopener"
      >Apple Maps</a
    >
  </p>
</div>
