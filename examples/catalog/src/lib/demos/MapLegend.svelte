<script lang="ts">
  import { FillLayer, MapLegend, MapSource, MapView } from '@loidolt/theme-maps';
  import { chartColors } from '@loidolt/theme-tokens';
  import { areas, portland } from '$lib/sample-geo.js';

  const colors = chartColors();
</script>

<div class="ldt-grid" style="--ldt-min: 16rem;">
  <MapView label="Zones with a legend" center={portland} zoom={12} height={300}>
    <MapSource id="legend-zones" data={areas}>
      <FillLayer
        id="legend-zone-fill"
        paint={(live) => ({
          'fill-color': [
            'match',
            ['get', 'name'],
            'Same-day zone',
            live.categorical[0],
            live.categorical[1],
          ],
        })}
      />
    </MapSource>
    <MapLegend
      title="Delivery"
      items={[
        { label: 'Same day', color: colors.categorical[0] },
        { label: 'Next day', color: colors.categorical[1] },
      ]}
    />
  </MapView>
  <MapLegend
    title="Beside the map"
    items={[
      { label: 'Route', color: colors.accent, shape: 'line' },
      { label: 'Stop', color: colors.accent, shape: 'dot' },
    ]}
  />
</div>
