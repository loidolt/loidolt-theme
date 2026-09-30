<script lang="ts">
  import { NumberField } from '@loidolt/theme-svelte';

  let layers = $state(12);
  let copies = $state<number | null>(null);
</script>

<div class="ldt-stack">
  <NumberField label="Layer count" min={1} max={40} bind:value={layers} boxed />
  <p class="ldt-utility-text">Value: {layers}</p>
  <NumberField label="Extra copies" min={1} max={20} nullable bind:value={copies} boxed />
  <p class="ldt-utility-text">Value: {copies ?? 'not set'}</p>
</div>
