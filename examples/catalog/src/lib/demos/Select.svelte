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
      {
        label: 'Vector',
        options: [
          { value: 'svg', label: 'SVG vector' },
          { value: 'pdf', label: 'PDF document' },
        ],
      },
      {
        label: 'Raster',
        options: [
          { value: 'png', label: 'PNG image' },
          { value: 'tiff', label: 'TIFF image' },
        ],
      },
    ]}
  />
  <p class="ldt-utility-text">Value: {format || 'unset'}</p>
</div>
