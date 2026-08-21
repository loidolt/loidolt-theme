<script lang="ts">
  import { Button, Dialog } from '@loidolt/theme-svelte';
</script>

<Dialog
  title="Export fabrication package"
  description="Choose a final format and verify the current project."
  size="md"
>
  {#snippet trigger()}Open dialog{/snippet}
  <p>Twelve layers will be written as SVG.</p>
  {#snippet footer()}
    <Button variant="quiet">Cancel</Button>
    <Button variant="primary">Export</Button>
  {/snippet}
</Dialog>
