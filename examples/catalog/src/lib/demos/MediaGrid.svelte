<script lang="ts">
  import { MediaGrid } from '@loidolt/theme-svelte';
  import { sampleMedia } from '$lib/sample-media.js';
</script>

<MediaGrid items={sampleMedia()} label="Relief models" minColumnWidth="10rem" />
