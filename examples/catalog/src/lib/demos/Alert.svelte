<script lang="ts">
  import { Alert } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <Alert title="Import complete" variant="info">Nothing needs your attention.</Alert>
  <Alert title="Preview ready" variant="success">All geometry checks passed.</Alert>
  <Alert title="Material warning" variant="warning">Two layers exceed the sheet width.</Alert>
  <Alert title="Export blocked" variant="error">Resolve document errors before export.</Alert>
</div>
