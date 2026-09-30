<script lang="ts">
  import { FillLayer, LineLayer, MapSource, MapView } from '@loidolt/theme-maps';
  import { areas, portland } from '$lib/sample-geo.js';

  let hovered = $state<string | null>(null);
</script>

<div class="ldt-stack">
  <MapView label="Delivery zones" center={portland} zoom={12} height={340}>
    <MapSource id="zones" data={areas}>
      <FillLayer
        id="zone-fill"
        paint={(colors) => ({
          'fill-color': [
            'match',
            ['get', 'name'],
            'Same-day zone',
            colors.categorical[0],
            colors.categorical[1],
          ],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.45, 0.25],
        })}
        onHover={(event) => (hovered = (event?.feature.properties?.name as string) ?? null)}
      />
      <LineLayer
        id="zone-outline"
        paint={(colors) => ({ 'line-color': colors.text, 'line-width': 1 })}
      />
    </MapSource>
  </MapView>
  <p class="ldt-eyebrow">{hovered ?? 'Hover a zone'}</p>
</div>
