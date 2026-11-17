<script lang="ts">
  import { asset } from '$app/paths';
  import { VideoPlayer } from '@loidolt/theme-svelte';
</script>

<VideoPlayer
  label="Cutting a bracket"
  src={asset('media/sample-cut.webm')}
  poster={asset('media/sample-poster.svg')}
  tracks={[{ src: asset('media/sample-cut.en.vtt'), srclang: 'en', label: 'English' }]}
  loop
/>
