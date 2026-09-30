<script lang="ts">
  import { Spinner } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <div class="ldt-cluster"><Spinner label="Generating preview" /> Generating preview</div>
  <div class="ldt-cluster">
    <Spinner size="sm" label="Small" />
    <Spinner size="md" label="Medium" />
    <Spinner size="lg" label="Large" />
  </div>
</div>
