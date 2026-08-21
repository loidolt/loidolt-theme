<script lang="ts">
  import { RadioGroup } from '@loidolt/theme-svelte';

  let mode = $state('design');
</script>

<RadioGroup
  label="Workspace mode"
  bind:value={mode}
  options={[
    { value: 'design', label: 'Design' },
    { value: 'proof', label: 'Proof' },
    { value: 'batch', label: 'Batch' },
  ]}
/>
