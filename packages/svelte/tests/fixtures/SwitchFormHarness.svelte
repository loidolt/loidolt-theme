<script lang="ts">
  import Switch from '../../src/lib/components/Switch.svelte';

  let checked = $state(true);
</script>

<form>
  <Switch name="preview" bind:checked>Live preview</Switch>
  <button type="reset">Reset</button>
</form>
