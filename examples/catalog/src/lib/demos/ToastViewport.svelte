<script lang="ts">
  import { Toast, ToastViewport } from '@loidolt/theme-svelte';
</script>

<p class="ldt-utility-text">
  The viewport is fixed to the corner of the page. This one is rendered inline so it can be seen.
</p>
<div style="position:relative">
  <ToastViewport style="position:static;width:auto">
    <Toast title="Export queued" description="Preparing files." variant="success" />
    <Toast title="Two warnings" description="Layers exceed the sheet width." variant="warning" />
  </ToastViewport>
</div>
