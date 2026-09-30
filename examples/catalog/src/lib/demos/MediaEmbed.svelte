<script lang="ts">
  import { MediaEmbed } from '@loidolt/theme-svelte';
</script>

<!-- Nothing is requested from YouTube or Vimeo until a play button is pressed. -->
<div class="ldt-grid" style="--ldt-min: 16rem">
  <MediaEmbed url="https://www.youtube.com/watch?v=aqz-KE-bpKQ" title="Big Buck Bunny" />
  <MediaEmbed url="https://vimeo.com/76979871" title="The New Vimeo Player" ratio="wide" />
</div>
