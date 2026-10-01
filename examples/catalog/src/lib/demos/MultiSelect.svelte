<script lang="ts">
  import { Field, MultiSelect } from '@loidolt/theme-svelte';

  let layers = $state(['cut']);
</script>

<Field label="Export layers" description="Choose up to three.">
  {#snippet children({ id, describedBy })}
    <MultiSelect
      {id}
      aria-describedby={describedBy}
      boxed
      max={3}
      placeholder="Add a layer"
      bind:value={layers}
      options={[
        { value: 'cut', label: 'Cut lines' },
        { value: 'score', label: 'Score lines' },
        { value: 'engrave', label: 'Raster engrave' },
        { value: 'labels', label: 'Part labels' },
        { value: 'registration', label: 'Registration marks' },
      ]}
    />
  {/snippet}
</Field>
