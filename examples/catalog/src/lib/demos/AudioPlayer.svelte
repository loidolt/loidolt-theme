<script lang="ts">
  import { asset } from '$app/paths';
  import { AudioPlayer } from '@loidolt/theme-svelte';
</script>

<AudioPlayer
  title="Calibration tone"
  artist="Workshop sounds"
  src={asset('media/sample-tone.wav')}
  artwork={asset('media/sample-artwork.svg')}
/>
