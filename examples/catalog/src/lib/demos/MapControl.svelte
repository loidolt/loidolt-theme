<script lang="ts">
  import { Button } from '@loidolt/theme-svelte';
  import { MapControl, MapView } from '@loidolt/theme-maps';
  import { portland } from '$lib/sample-geo.js';

  let center = $state(portland);
  let zoom = $state(12);
</script>

<MapView label="Map with a custom control" bind:center bind:zoom height={320}>
  <MapControl position="top-left">
    <Button
      size="sm"
      onclick={() => {
        center = portland;
        zoom = 12;
      }}>Back to the workshop</Button
    >
  </MapControl>
</MapView>
