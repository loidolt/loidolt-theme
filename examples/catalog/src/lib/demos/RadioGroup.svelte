<script lang="ts">
  import { RadioGroup } from '@loidolt/theme-svelte';

  let mode = $state('design');
  let finish = $state('raw');
</script>

<div class="ldt-stack">
  <RadioGroup
    label="Workspace mode"
    bind:value={mode}
    options={[
      { value: 'design', label: 'Design' },
      { value: 'proof', label: 'Proof' },
      { value: 'batch', label: 'Batch' },
    ]}
  />
  <RadioGroup
    label="Finish"
    orientation="vertical"
    bind:value={finish}
    options={[
      { value: 'raw', label: 'Raw', description: 'Straight off the laser, char marks and all.' },
      { value: 'sanded', label: 'Sanded', description: 'Edges cleaned by hand; adds a day.' },
      { value: 'oiled', label: 'Oiled', description: 'Sanded, then finished with hardwax oil.' },
    ]}
  />
</div>
