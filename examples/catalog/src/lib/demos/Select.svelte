<script lang="ts">
  import { Select } from '@loidolt/theme-svelte';

  let format = $state('');
</script>

<div class="ldt-stack">
  <Select
    label="Export format"
    placeholder="Choose a format"
    boxed
    bind:value={format}
    options={[
      { value: 'svg', label: 'SVG vector' },
      { value: 'pdf', label: 'PDF document' },
      { value: 'png', label: 'PNG image' },
    ]}
  />
  <p class="ldt-utility-text">Value: {format || 'unset'}</p>
</div>
