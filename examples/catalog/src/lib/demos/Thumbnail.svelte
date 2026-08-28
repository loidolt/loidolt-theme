<script lang="ts">
  import { Thumbnail } from '@loidolt/theme-svelte';
</script>

<div class="ldt-grid" style="--ldt-min: 10rem;">
  <Thumbnail ratio="4/3" alt="">
    <svg viewBox="0 0 40 30" width="80"
      ><rect x="6" y="6" width="28" height="18" fill="#c94f2a" /></svg
    >
  </Thumbnail>
  <Thumbnail ratio="1/1" surface="paper" alt="">
    <svg viewBox="0 0 30 30" width="60"><circle cx="15" cy="15" r="10" fill="#3a6ea5" /></svg>
  </Thumbnail>
</div>
