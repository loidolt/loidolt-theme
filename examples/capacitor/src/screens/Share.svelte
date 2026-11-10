<script lang="ts">
  import { Directory, Filesystem } from '@capacitor/filesystem';
  import { Badge, Button, Section } from '@loidolt/theme-svelte';
  import {
    SHARE_CACHE_PATH,
    type CapacitorSetup,
    type ShareContent,
  } from '@loidolt/theme-capacitor';
  import { describeFocus, log, makePdf } from '../lib.svelte.js';

  let { native }: { native: CapacitorSetup } = $props();

  let outcome = $state('');
  let cache = $state<string[]>([]);
  let available = $state<boolean | null>(null);

  $effect(() => {
    native.share?.canShare().then((value) => (available = value));
    void listCache();
  });

  /** What is in CACHE/ldt-share right now, folder by folder. */
  async function listCache() {
    try {
      const { files: folders } = await Filesystem.readdir({
        path: SHARE_CACHE_PATH,
        directory: Directory.Cache,
      });
      const names: string[] = [];
      for (const folder of folders) {
        const { files } = await Filesystem.readdir({
          path: `${SHARE_CACHE_PATH}/${folder.name}`,
          directory: Directory.Cache,
        });
        for (const file of files) names.push(`${folder.name}/${file.name}`);
      }
      cache = names.sort();
    } catch {
      cache = [];
    }
    log('share-cache', cache);
  }

  async function run(label: string, content: ShareContent) {
    outcome = `${label}: sharing…`;
    try {
      const result = await native.share!.share(content);
      outcome = `${label}: ${JSON.stringify(result)}`;
      log('share', { label, result, focus: describeFocus() });
    } catch (error) {
      outcome = `${label}: threw ${String(error)}`;
      log('share-error', { label, error: String(error) });
    }
    await listCache();
  }

  const note = () =>
    new File([`A note written at ${new Date().toISOString()}\n`], 'note.txt', {
      type: 'text/plain',
    });
</script>

<Section title="Share" headingLevel={1}>
  <p>
    Each button opens the native share sheet. Closing it without picking a target resolves
    <code>cancelled: true</code>; it never throws.
    <Badge variant={available ? 'success' : 'default'}
      >{available === null ? '…' : available ? 'Share sheet available' : 'No share sheet'}</Badge
    >
  </p>
  <div class="ldt-cluster">
    <Button onclick={() => run('url', { title: 'A link', url: 'https://capacitorjs.com' })}
      >Share a link</Button
    >
    <Button
      onclick={() => run('text', { title: 'Some text', text: 'Shared from the example app.' })}
      >Share text</Button
    >
    <Button
      onclick={() =>
        run('pdf', {
          title: 'A PDF',
          files: [
            new File([makePdf('Shared from the example app')], 'example.pdf', {
              type: 'application/pdf',
            }),
          ],
        })}>Share a PDF</Button
    >
    <Button
      onclick={() =>
        run('several', {
          title: 'Several files',
          files: [
            note(),
            { blob: makePdf('One of several'), name: 'several.pdf' },
            new File(['{"same":"name"}'], 'note.txt', { type: 'text/plain' }),
          ],
        })}>Share three files</Button
    >
  </div>
  <p role="status">{outcome || 'Nothing shared yet.'}</p>
</Section>

<Section title="Share cache" headingLevel={2}>
  <p>
    Files go to <code>CACHE/{SHARE_CACHE_PATH}</code> and stay until the next share clears them, since
    the receiving app may still be reading.
  </p>
  <ul>
    {#each cache as name (name)}<li><code>{name}</code></li>{:else}<li>Empty.</li>{/each}
  </ul>
  <Button variant="quiet" onclick={listCache}>Refresh</Button>
</Section>
