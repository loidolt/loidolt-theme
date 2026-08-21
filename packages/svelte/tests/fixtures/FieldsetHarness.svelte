<script lang="ts">
  import Checkbox from '../../src/lib/components/Checkbox.svelte';
  import Fieldset from '../../src/lib/components/Fieldset.svelte';

  let {
    legend = 'Output formats',
    description = undefined,
    error = undefined,
    optional = false,
    optionalText = undefined,
  } = $props();
</script>

<Fieldset {legend} {description} {error} {optional} {optionalText}>
  <Checkbox label="SVG" />
  <Checkbox label="PDF" />
</Fieldset>
