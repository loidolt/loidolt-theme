<script lang="ts">
  import { base } from '$app/paths';
  import { VideoPlayer } from '@loidolt/theme-svelte';
</script>

<VideoPlayer
  label="Cutting a bracket"
  src={`${base}/media/sample-cut.webm`}
  poster={`${base}/media/sample-poster.svg`}
  tracks={[{ src: `${base}/media/sample-cut.en.vtt`, srclang: 'en', label: 'English' }]}
  loop
/>
