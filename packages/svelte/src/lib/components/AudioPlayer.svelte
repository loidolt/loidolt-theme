<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HlsLoader } from '../hls.js';
  import { createHlsSource } from '../hls.svelte.js';
  import { defaultMediaLabels, type MediaPlayerLabels } from '../internal/media/labels.js';
  import { mediaKeydown } from '../internal/media/keys.js';
  import MediaControls from '../internal/media/MediaControls.svelte';
  import { createMediaPlayer } from '../media-player.svelte.js';
  import { isHlsSource, toMediaSources, type MediaSourceEntry } from '../media-utils.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
    src: string | MediaSourceEntry[];
    /** The track or recording title; also names the player. */
    title: string;
    artist?: string;
    /** Cover art. Decorative: the title already names the recording. */
    artwork?: string;
    loop?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
    hlsLoader?: HlsLoader;
    labels?: Partial<MediaPlayerLabels>;
    onEnded?: () => void;
    onTimeUpdate?: (seconds: number) => void;
    class?: string;
    ref?: HTMLDivElement | null;
    mediaRef?: HTMLAudioElement | null;
  }

  let {
    src,
    title,
    artist,
    artwork,
    loop = false,
    preload = 'metadata',
    hlsLoader,
    labels,
    onEnded,
    onTimeUpdate,
    class: className,
    ref = $bindable(null),
    mediaRef = $bindable(null),
    ...rest
  }: Props = $props();

  const text = $derived({ ...defaultMediaLabels, ...labels });
  const sources = $derived(toMediaSources(src));
  const stream = $derived(sources.find((source) => isHlsSource(source)));
  const player = createMediaPlayer({
    onEnded: () => onEnded?.(),
    onTimeUpdate: (seconds) => onTimeUpdate?.(seconds),
  });
  const hls = createHlsSource({
    get loader() {
      return hlsLoader;
    },
  });
</script>

<div
  bind:this={ref}
  class={cx('ldt-media-player', 'ldt-media-player--audio', className)}
  data-playing={player.playing ? '' : undefined}
  role="group"
  aria-label={title}
  onkeydown={mediaKeydown(player, () => null)}
  {...rest}
>
  {#if artwork}<img class="ldt-media-player__artwork" src={artwork} alt="" />{/if}
  <div class="ldt-media-player__meta">
    <strong class="ldt-media-player__title">{title}</strong>
    {#if artist}<span class="ldt-media-player__artist">{artist}</span>{/if}
  </div>
  <audio
    bind:this={mediaRef}
    {preload}
    {loop}
    {@attach player.attach}
    {@attach stream ? hls.source(stream.src) : undefined}
  >
    {#if !stream}{#each sources as source (source.src)}<source
          src={source.src}
          type={source.type}
        />{/each}{/if}
  </audio>
  {#if player.error || hls.status === 'unsupported' || hls.status === 'error'}<p
      class="ldt-media-player__error"
      role="alert"
    >
      {text.error}
    </p>{/if}
  <MediaControls {player} labels={text} />
</div>
