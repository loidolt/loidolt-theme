<script lang="ts">
  import { AlertDialog } from '@loidolt/theme-svelte';

  let last = $state('nothing yet');
</script>

<div class="ldt-cluster">
  <AlertDialog
    title="Delete terrain.svg?"
    description="The file and its cut layers are removed. This cannot be undone."
    confirmLabel="Delete file"
    confirmVariant="danger"
    triggerClass="ldt-button ldt-button--danger"
    onConfirm={() => (last = 'deleted')}
    onCancel={() => (last = 'cancelled')}
  >
    {#snippet trigger()}Delete file{/snippet}
  </AlertDialog>
  <span class="ldt-utility-text">Last answer: {last}</span>
</div>
