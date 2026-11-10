<script lang="ts">
  import { Directory, Filesystem } from '@capacitor/filesystem';
  import { Button, Section, Switch } from '@loidolt/theme-svelte';
  import type { CapacitorSetup, PickOptions, SaveOutcome } from '@loidolt/theme-capacitor';
  import { describeFocus, log, makePdf, size } from '../lib.svelte.js';

  let { native }: { native: CapacitorSetup } = $props();

  interface Picked {
    name: string;
    type: string;
    size: number;
    isFile: boolean;
    head: string;
  }

  let picked = $state<Picked[]>([]);
  let pickStatus = $state('');
  let saved = $state<SaveOutcome | null>(null);
  let saveError = $state('');
  let overwrite = $state(false);
  let documents = $state<string[]>([]);

  $effect(() => {
    void listDocuments();
  });

  async function listDocuments() {
    try {
      const { files } = await Filesystem.readdir({ path: '', directory: Directory.Documents });
      documents = files.map((file) => file.name).sort();
    } catch {
      documents = [];
    }
    log('documents', documents);
  }

  async function pick(label: string, options: PickOptions) {
    pickStatus = `${label}: picking…`;
    try {
      const files = await native.files!.pick(options);
      picked = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          isFile: file instanceof File,
          // The first bytes, to show the contents really came across.
          head: [...new Uint8Array(await file.slice(0, 4).arrayBuffer())]
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join(' '),
        }))
      );
      pickStatus = `${label}: ${files.length} file${files.length === 1 ? '' : 's'}`;
      log('pick', { label, picked, focus: describeFocus() });
    } catch (error) {
      pickStatus = `${label}: threw ${String(error)}`;
      log('pick-error', { label, error: String(error) });
    }
  }

  async function save(file: File) {
    saveError = '';
    try {
      saved = await native.files!.save(file, { overwrite });
      log('save', saved);
    } catch (error) {
      saved = null;
      saveError = String(error);
      log('save-error', saveError);
    }
    await listDocuments();
  }
</script>

<Section title="Pick" headingLevel={1}>
  <p>The system picker, resolving real <code>File</code> objects. Dismissing it resolves none.</p>
  <div class="ldt-cluster">
    <Button onclick={() => pick('pdf', { accept: '.pdf' })}>Pick a PDF</Button>
    <Button onclick={() => pick('pdfs', { accept: '.pdf', multiple: true })}>Pick PDFs</Button>
    <Button onclick={() => pick('image', { accept: 'image/*' })}>Pick an image</Button>
    <Button onclick={() => pick('images', { accept: 'image/*', multiple: true })}
      >Pick images</Button
    >
    <Button onclick={() => pick('any', { multiple: true })}>Pick anything</Button>
  </div>
  <p role="status">{pickStatus || 'Nothing picked yet.'}</p>
  {#if picked.length}
    <ul>
      {#each picked as file, index (index)}
        <li>
          <code>{file.name}</code> · {file.type || 'no type'} · {size(file.size)} ·
          {file.isFile ? 'File' : 'not a File'} · <code>{file.head}</code>
        </li>
      {/each}
    </ul>
  {/if}
</Section>

<Section title="Save" headingLevel={2}>
  <p>
    Saved to the app's Documents folder, which the Files app shows under
    <em>On My iPhone › Theme example</em>. A name already taken becomes
    <code>name (1).ext</code> unless overwriting.
  </p>
  <Switch bind:checked={overwrite}>Overwrite a file of the same name</Switch>
  <div class="ldt-cluster">
    <Button
      onclick={() =>
        save(
          new File([`Saved at ${new Date().toISOString()}\n`], 'saved.txt', { type: 'text/plain' })
        )}>Save saved.txt</Button
    >
    <Button
      onclick={() =>
        save(
          new File([makePdf('Saved from the example app')], 'saved.pdf', {
            type: 'application/pdf',
          })
        )}>Save saved.pdf</Button
    >
  </div>
  {#if saved}
    <dl class="readout" role="status">
      {#each Object.entries(saved) as [key, value] (key)}
        <dt>{key}</dt>
        <dd><code>{value}</code></dd>
      {/each}
    </dl>
  {:else if saveError}
    <p role="alert">{saveError}</p>
  {/if}
  <h3>In Documents</h3>
  <ul>
    {#each documents as name (name)}<li><code>{name}</code></li>{:else}<li>Empty.</li>{/each}
  </ul>
</Section>

<style>
  .readout {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--loidolt-space-1) var(--loidolt-space-4);
    margin: 0;
    overflow-wrap: anywhere;
  }
  .readout dd {
    margin: 0;
  }
</style>
