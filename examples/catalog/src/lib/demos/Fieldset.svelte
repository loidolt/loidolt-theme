<script lang="ts">
  import { Checkbox, Fieldset } from '@loidolt/theme-svelte';

  let svg = $state(true);
  let pdf = $state(false);
  let png = $state(false);

  const error = $derived(svg || pdf || png ? undefined : 'Choose at least one format');
</script>

<Fieldset legend="Output formats" description="Every selected format is written on export." {error}>
  <Checkbox bind:checked={svg} label="SVG vector" />
  <Checkbox bind:checked={pdf} label="PDF document" />
  <Checkbox bind:checked={png} label="PNG image" />
</Fieldset>
