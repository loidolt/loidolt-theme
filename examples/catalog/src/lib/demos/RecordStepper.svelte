<script lang="ts">
  import { RecordStepper } from '@loidolt/theme-svelte';

  let index = $state(0);
</script>

<RecordStepper
  {index}
  total={12}
  label="Outputs"
  onPrevious={() => (index -= 1)}
  onNext={() => (index += 1)}
/>
