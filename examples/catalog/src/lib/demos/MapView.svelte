<script lang="ts">
  import { MapView } from '@loidolt/theme-maps';
  import { portland } from '$lib/sample-geo.js';

  let center = $state(portland);
  let zoom = $state(12);
</script>

<div class="ldt-stack">
  <MapView
    label="Portland"
    description="The workshop's delivery area in central Portland."
    bind:center
    bind:zoom
    scaleControl
    fullscreenControl
    height={360}
  />
  <p class="ldt-eyebrow">
    Centre {center[1].toFixed(4)}, {center[0].toFixed(4)} · zoom {zoom.toFixed(1)}
  </p>
</div>
