<script lang="ts">
  import Toast from '../../src/lib/components/Toast.svelte';
  import ToastViewport from '../../src/lib/components/ToastViewport.svelte';
  import { createToaster } from '../../src/lib/toaster.svelte.js';

  const toaster = createToaster({ duration: 1000 });
</script>

<button type="button" onclick={() => toaster.push({ title: 'Export queued' })}>Raise</button>

<ToastViewport
  onpointerenter={toaster.pause}
  onpointerleave={toaster.resume}
  onfocusin={toaster.pause}
  onfocusout={toaster.resume}
>
  {#each toaster.toasts as toast (toast.id)}
    <Toast
      title={toast.title}
      description={toast.description}
      variant={toast.variant}
      onDismiss={() => toaster.dismiss(toast.id)}
    />
  {/each}
</ToastViewport>
