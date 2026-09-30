<script lang="ts">
  import { base } from '$app/paths';
  import { AspectRatio } from '@loidolt/theme-svelte';
</script>

<div class="ldt-grid" style="--ldt-min: 10rem">
  {#each ['video', 'photo', 'square', 'portrait'] as const as ratio (ratio)}
    <figure class="ldt-stack" style="margin: 0; --ldt-gap: 0.4rem">
      <AspectRatio {ratio}>
        <img src={`${base}/media/sample-poster.svg`} alt="" />
      </AspectRatio>
      <figcaption class="ldt-utility-text">{ratio}</figcaption>
    </figure>
  {/each}
</div>
