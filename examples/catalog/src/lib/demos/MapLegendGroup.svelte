<script lang="ts">
  import { MapLegendGroup, MapView } from '@loidolt/theme-maps';
  import { chartColors } from '@loidolt/theme-tokens';
  import { portland } from '$lib/sample-geo.js';

  const colors = chartColors();
</script>

<MapView label="Map with a legend group" center={portland} zoom={12} height={320}>
  <MapLegendGroup
    title="On this map"
    position="top-left"
    legends={[
      {
        title: 'Zones',
        items: [
          { label: 'Same day', color: colors.categorical[0] },
          { label: 'Next day', color: colors.categorical[1] },
        ],
      },
      {
        title: 'Job density',
        gradient: { colors: colors.sequential, min: 'Few', max: 'Many' },
        open: false,
      },
    ]}
  />
</MapView>
