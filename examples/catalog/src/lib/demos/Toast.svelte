<script lang="ts">
  import { Button, createToaster, Toast, ToastViewport } from '@loidolt/theme-svelte';

  const toaster = createToaster();
</script>

<div class="ldt-cluster">
  <Button onclick={() => toaster.push({ title: 'Saved', description: 'Draft stored locally.' })}>
    Raise a toast
  </Button>
  <Button
    variant="quiet"
    onclick={() =>
      toaster.push({
        title: 'Export queued',
        description: 'Your package is being prepared.',
        variant: 'success',
      })}
  >
    Success toast
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
