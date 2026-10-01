<script lang="ts">
  import AudioPlayer from '../../components/AudioPlayer.svelte';
  import MediaEmbed from '../../components/MediaEmbed.svelte';
  import VideoPlayer from '../../components/VideoPlayer.svelte';
  import type { MediaZoom } from '../../media-zoom.svelte.js';
  import type { MediaItem } from '../../media-utils.js';

  /* One item shown at full size — the body of a Lightbox or a carousel slide. */
  interface Props {
    item: MediaItem;
    zoom?: MediaZoom;
    /** Images fill the frame (`cover`) in a carousel, and fit whole (`contain`) in a lightbox. */
    fit?: 'contain' | 'cover';
  }

  let { item, zoom, fit = 'contain' }: Props = $props();
</script>

{#if item.kind === 'image'}
  <div class="ldt-media-stage ldt-media-stage--image" {@attach zoom?.attach}>
    <img
      class="ldt-media-stage__image"
      src={item.src}
      srcset={item.srcset}
      alt={item.alt}
      style:object-fit={fit}
      style:transform={zoom?.transform}
      draggable="false"
    />
  </div>
{:else if item.kind === 'video'}
  <VideoPlayer
    class="ldt-media-stage"
    src={item.src}
    label={item.title}
    poster={item.poster}
    tracks={item.tracks}
  />
{:else if item.kind === 'audio'}
  <AudioPlayer
    class="ldt-media-stage"
    src={item.src}
    title={item.title}
    artist={item.artist}
    artwork={item.artwork}
  />
{:else}
  <MediaEmbed class="ldt-media-stage" url={item.url} title={item.title} poster={item.poster} />
{/if}
