<script lang="ts">
  import { Button } from '@loidolt/theme-svelte';
  import { MapPopup, MapView } from '@loidolt/theme-maps';
  import { portland } from '$lib/sample-geo.js';

  let open = $state(true);
</script>

<div class="ldt-stack">
  <MapView label="Workshop location" center={portland} zoom={13} height={320}>
    <MapPopup lngLat={portland} label="Workshop" bind:open>
      <strong>Workshop</strong>
      <p>Open weekdays, 8 to 5.</p>
    </MapPopup>
  </MapView>
  <div>
    <Button size="sm" onclick={() => (open = !open)}>{open ? 'Close' : 'Open'} the popup</Button>
  </div>
</div>
