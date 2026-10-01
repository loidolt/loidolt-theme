<script lang="ts">
  import { Button, createToaster, Toast, ToastViewport } from '@loidolt/theme-svelte';

  const toaster = createToaster({ duration: 6000 });

  function upload() {
    const id = toaster.info('Uploading 3 sheets…', { duration: 0 });
    setTimeout(
      () => toaster.update(id, { title: 'Uploaded 3 sheets', variant: 'success', duration: 4000 }),
      1500
    );
  }
</script>

<div class="ldt-cluster">
  <Button onclick={() => toaster.success('Saved', { description: 'Draft stored locally.' })}>
    Success
  </Button>
  <Button
    variant="quiet"
    onclick={() =>
      toaster.push({
        title: 'Sheet deleted',
        duration: 10000,
        action: { label: 'Undo', onAction: () => toaster.success('Sheet restored') },
      })}
  >
    With an action
  </Button>
  <Button variant="quiet" onclick={upload}>Update in place</Button>
  <Button
    variant="danger"
    onclick={() => toaster.error('Export failed', { description: 'Stays until dismissed.' })}
  >
    Error
  </Button>
</div>

<ToastViewport
  onpointerenter={toaster.pause}
  onpointerleave={toaster.resume}
  onfocusin={toaster.pause}
  onfocusout={toaster.resume}
>
  {#each toaster.toasts as toast (toast.id)}
    <Toast {...toast} onDismiss={() => toaster.dismiss(toast.id)} />
  {/each}
</ToastViewport>
