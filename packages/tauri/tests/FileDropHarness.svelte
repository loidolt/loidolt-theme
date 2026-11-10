<script lang="ts">
  import { Dropzone, type FileRejection } from '@loidolt/theme-svelte';
  import { createFileDrop } from '../src/lib/index.js';
  import type { FsPlugin, WebviewPlugin } from '../src/lib/index.js';

  interface Props {
    webview: WebviewPlugin;
    fs: Pick<FsPlugin, 'readFile'>;
    accept?: string;
    onFiles: (accepted: File[], rejected: FileRejection[]) => void;
  }

  let { webview, fs, accept, onFiles }: Props = $props();

  let dropzone = $state<ReturnType<typeof Dropzone>>();
  // svelte-ignore state_referenced_locally
  const drop = createFileDrop({ webview, fs, target: () => dropzone });
</script>

<Dropzone
  bind:this={dropzone}
  {accept}
  multiple
  window
  externalDragging={drop.dragging}
  {onFiles}
/>
