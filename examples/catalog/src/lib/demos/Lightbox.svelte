<script lang="ts">
  import { base } from '$app/paths';
  import { Lightbox } from '@loidolt/theme-svelte';
  import { sampleMedia } from '$lib/sample-media.js';
</script>

<Lightbox items={sampleMedia(base)} title="Relief models" showThumbnails>
  {#snippet trigger()}Open the viewer{/snippet}
</Lightbox>
