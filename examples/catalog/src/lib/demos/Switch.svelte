<script lang="ts">
  import { Switch } from '@loidolt/theme-svelte';

  let live = $state(true);
</script>

<div class="ldt-stack">
  <Switch bind:checked={live}>Live preview</Switch>
  <Switch disabled>Unavailable</Switch>
</div>
