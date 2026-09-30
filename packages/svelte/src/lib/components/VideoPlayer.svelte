<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HlsLoader } from '../hls.js';
  import { createHlsSource } from '../hls.svelte.js';
  import { defaultMediaLabels, type MediaPlayerLabels } from '../internal/media/labels.js';
  import { mediaKeydown } from '../internal/media/keys.js';
  import MediaControls from '../internal/media/MediaControls.svelte';
  import { createMediaPlayer } from '../media-player.svelte.js';
  import {
    isHlsSource,
    resolveAspectRatio,
    toMediaSources,
    type AspectRatioName,
    type MediaSourceEntry,
    type MediaTextTrack,
  } from '../media-utils.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** A URL, or several sources for the browser to choose from. `.m3u8` plays as HLS. */
    src: string | MediaSourceEntry[];
    /** Names the player for assistive tech. */
    label: string;
    poster?: string;
    /** Captions and subtitles. Provide captions for any video with speech (WCAG 1.2.2). */
    tracks?: MediaTextTrack[];
    ratio?: AspectRatioName | number | string;
    fit?: 'contain' | 'cover';
    /** Browsers only autoplay muted media; `autoplay` implies `muted`. */
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
    /** `custom` draws this library's controls; `native` uses the browser's; `none` hides both. */
    controls?: 'custom' | 'native' | 'none';
    /** hls.js loader for this player, in place of the one given to `setHlsLoader()`. */
    hlsLoader?: HlsLoader;
    hlsConfig?: Record<string, unknown>;
    /** Content layered over the video, e.g. a title card. */
    overlay?: Snippet;
    labels?: Partial<MediaPlayerLabels>;
    onEnded?: () => void;
    onTimeUpdate?: (seconds: number) => void;
    class?: string;
    ref?: HTMLDivElement | null;
    /** The `<video>` element. */
    mediaRef?: HTMLVideoElement | null;
  }

  let {
    src,
    label,
    poster,
    tracks = [],
    ratio = 'video',
    fit = 'contain',
    autoplay = false,
    muted = false,
    loop = false,
    preload = 'metadata',
    controls = 'custom',
    hlsLoader,
    hlsConfig,
    overlay,
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
    get config() {
      return hlsConfig;
    },
  });
  const failed = $derived(
    Boolean(player.error) || hls.status === 'unsupported' || hls.status === 'error'
  );
</script>

<div
  bind:this={ref}
  class={cx('ldt-media-player', 'ldt-media-player--video', className)}
  style:--ldt-aspect-ratio={resolveAspectRatio(ratio)}
  data-playing={player.playing ? '' : undefined}
  role="group"
  aria-label={label}
  onkeydown={controls === 'custom' ? mediaKeydown(player, () => ref) : undefined}
  {...rest}
>
  <video
    bind:this={mediaRef}
    class="ldt-media-player__media"
    style:object-fit={fit}
    {poster}
    {preload}
    {autoplay}
    muted={muted || autoplay}
    {loop}
    playsinline
    controls={controls === 'native'}
    crossorigin={tracks.length ? 'anonymous' : undefined}
    {@attach player.attach}
    {@attach stream ? hls.source(stream.src) : undefined}
    onclick={controls === 'custom' ? () => player.toggle() : undefined}
  >
    {#if !stream}{#each sources as source (source.src)}<source
          src={source.src}
          type={source.type}
        />{/each}{/if}
    {#each tracks as track (track.src)}<track
        src={track.src}
        kind={track.kind ?? 'captions'}
        srclang={track.srclang}
        label={track.label}
        default={track.default}
      />{/each}
  </video>
  {#if overlay}<div class="ldt-media-player__overlay">{@render overlay()}</div>{/if}
  {#if failed}<p class="ldt-media-player__error" role="alert">{text.error}</p>{/if}
  {#if controls === 'custom'}<MediaControls {player} labels={text} video container={ref} />{/if}
</div>
