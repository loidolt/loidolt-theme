<script lang="ts">
  import { Lightbox } from '@loidolt/theme-svelte';
  import { sampleMedia } from '$lib/sample-media.js';
</script>

<Lightbox items={sampleMedia()} title="Relief models" showThumbnails>
  {#snippet trigger()}Open the viewer{/snippet}
</Lightbox>
