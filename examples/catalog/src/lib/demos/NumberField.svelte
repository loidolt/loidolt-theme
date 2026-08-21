<script lang="ts">
  import { NumberField } from '@loidolt/theme-svelte';

  let layers = $state(12);
</script>

<div class="ldt-stack">
  <NumberField label="Layer count" min={1} max={40} bind:value={layers} boxed />
  <p class="ldt-utility-text">Value: {layers}</p>
</div>
