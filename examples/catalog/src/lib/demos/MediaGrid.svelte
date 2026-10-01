<script lang="ts">
  import { base } from '$app/paths';
  import { MediaGrid } from '@loidolt/theme-svelte';
  import { sampleMedia } from '$lib/sample-media.js';
</script>

<MediaGrid items={sampleMedia(base)} label="Relief models" minColumnWidth="10rem" />
