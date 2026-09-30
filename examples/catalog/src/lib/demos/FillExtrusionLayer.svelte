<script lang="ts">
  import { FillExtrusionLayer, MapSource, MapView } from '@loidolt/theme-maps';
  import { areas, portland } from '$lib/sample-geo.js';

  const raised = {
    ...areas,
    features: areas.features.map((feature, index) => ({
      ...feature,
      properties: { ...feature.properties, height: 600 + index * 900 },
    })),
  };
</script>

<MapView
  label="Orders by zone, in 3D"
  center={portland}
  zoom={12}
  pitch={50}
  bearing={-20}
  height={340}
>
  <MapSource id="raised-zones" data={raised}>
    <FillExtrusionLayer
      id="raised-zone-blocks"
      paint={(colors) => ({
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-color': [
          'match',
          ['get', 'name'],
          'Same-day zone',
          colors.categorical[0],
          colors.categorical[1],
        ],
        'fill-extrusion-opacity': 0.75,
      })}
    />
  </MapSource>
</MapView>
