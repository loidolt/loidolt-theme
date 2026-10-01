<script lang="ts">
  import { PresetPicker } from '@loidolt/theme-svelte';
  import { theme } from '$lib/theme.js';
</script>

<div class="ldt-stack">
  <PresetPicker {theme} />
  <PresetPicker {theme} variant="select" label="Style (select)" />
  <p class="ldt-utility-text">Preset: {theme.preset} / scheme: {theme.resolved}</p>
</div>
