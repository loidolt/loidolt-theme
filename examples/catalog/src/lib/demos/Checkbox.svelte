<script lang="ts">
  import { Checkbox } from '@loidolt/theme-svelte';

  let guides = $state(true);
</script>

<div class="ldt-stack">
  <Checkbox bind:checked={guides}>Alignment guides</Checkbox>
  <Checkbox label="Snap to grid" />
  <Checkbox label="Mixed selection" indeterminate />
  <Checkbox label="Locked" disabled />
</div>
