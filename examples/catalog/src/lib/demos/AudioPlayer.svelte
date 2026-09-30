<script lang="ts">
  import { base } from '$app/paths';
  import { AudioPlayer } from '@loidolt/theme-svelte';
</script>

<AudioPlayer
  title="Calibration tone"
  artist="Workshop sounds"
  src={`${base}/media/sample-tone.wav`}
  artwork={`${base}/media/sample-artwork.svg`}
/>
