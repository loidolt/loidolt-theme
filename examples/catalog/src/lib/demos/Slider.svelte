<script lang="ts">
  import { Slider } from '@loidolt/theme-svelte';

  let kerf = $state(0.2);
  let thickness = $state([3, 9]);
</script>

<div class="ldt-stack">
  <Slider
    label="Kerf"
    bind:value={kerf}
    min={0}
    max={1}
    step={0.05}
    showValue
    formatValue={(value) => `${value.toFixed(2)} mm`}
  />
  <Slider
    label="Sheet thickness"
    bind:value={thickness}
    min={0}
    max={12}
    step={3}
    ticks
    showValue
    formatValue={(value) => `${value} mm`}
  />
</div>
