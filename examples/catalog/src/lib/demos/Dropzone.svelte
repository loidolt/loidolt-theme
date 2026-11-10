<script lang="ts">
  import { Button, Dropzone, Switch, type FileRejection } from '@loidolt/theme-svelte';

  let zone = $state<ReturnType<typeof Dropzone>>();
  let anywhere = $state(false);
  let received = $state<Array<{ name: string; size: number }>>([]);
  let turnedAway = $state(0);

  const sizeText = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

  function onFiles(accepted: File[], rejected: FileRejection[]) {
    received = [...received, ...accepted.map(({ name, size }) => ({ name, size }))];
    turnedAway += rejected.length;
  }

  // Any source can hand files over: here a button, in an app a native drop event.
  function addSample() {
    zone?.addFiles([
      new File(['%PDF-1.7 sample'], 'sample-sheet.pdf', { type: 'application/pdf' }),
    ]);
  }
</script>

<div class="ldt-stack">
  <Dropzone
    bind:this={zone}
    label="Drop PDFs or images"
    hint="PDF, PNG or JPEG, up to 10 MB each."
    accept=".pdf,image/png,image/jpeg"
    multiple
    maxSize={10 * 1024 * 1024}
    name="documents"
    window={anywhere}
    {onFiles}
  />
  <div class="ldt-cluster">
    <Switch bind:checked={anywhere}>Accept drops anywhere on the page</Switch>
    <Button size="sm" onclick={addSample}>Add a sample file</Button>
  </div>
  {#if received.length}
    <ul class="ldt-utility-text" aria-label="Received files">
      {#each received as file, index (index)}
        <li>{file.name} · {sizeText(file.size)}</li>
      {/each}
    </ul>
  {:else}
    <p class="ldt-utility-text">No files yet</p>
  {/if}
  {#if turnedAway}<p class="ldt-muted">{turnedAway} turned away</p>{/if}
</div>
