<script lang="ts">
  import { MapMarker, MapView } from '@loidolt/theme-maps';
  import { portland, stops } from '$lib/sample-geo.js';

  let selected = $state<string | null>(null);
</script>

<div class="ldt-stack">
  <MapView label="Delivery stops" center={portland} zoom={12.4} height={360}>
    {#each stops as stop, index (stop.id)}
      <MapMarker
        lngLat={stop.lngLat}
        label={stop.label}
        number={index + 1}
        active={selected === stop.id}
        onSelect={() => (selected = stop.id)}
      >
        {#snippet popup()}
          <strong>{stop.label}</strong>
          <p>{stop.description}</p>
        {/snippet}
      </MapMarker>
    {/each}
  </MapView>
  <p class="ldt-eyebrow">Tab to a stop and press Enter to open it.</p>
</div>
