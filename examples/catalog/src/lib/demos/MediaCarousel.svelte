<script lang="ts">
  import { base } from '$app/paths';
  import { MediaCarousel } from '@loidolt/theme-svelte';
  import { sampleMedia } from '$lib/sample-media.js';

  const items = sampleMedia(base).filter((item) => item.kind === 'image');
</script>

<MediaCarousel
  {items}
  label="Featured reliefs"
  ratio="photo"
  showThumbnails
  autoplay
  interval={6000}
/>
