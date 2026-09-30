import { aspectRatio } from '@loidolt/theme-tokens';

/** One source for a `<video>` or `<audio>`: the browser plays the first it supports. */
export interface MediaSourceEntry {
  src: string;
  /** MIME type. Guessed from the extension when missing. */
  type?: string;
}

/** Captions, subtitles or chapters for a video. */
export interface MediaTextTrack {
  src: string;
  kind?: 'captions' | 'subtitles' | 'descriptions' | 'chapters';
  /** BCP 47 language tag, e.g. `en`. */
  srclang: string;
  label: string;
  default?: boolean;
}

export type MediaKind = 'image' | 'video' | 'audio' | 'embed';
export type AspectRatioName = keyof typeof aspectRatio;
export type EmbedProvider = 'youtube' | 'vimeo';

interface MediaItemBase {
  /** Stable key. Defaults to the source. */
  id?: string;
  /** Shown under the item in a lightbox or carousel. */
  caption?: string;
  /** A small preview for grids and filmstrips. Images fall back to their own `src`. */
  thumbnail?: string;
}

export interface ImageMediaItem extends MediaItemBase {
  kind: 'image';
  src: string;
  /** Required; `''` for a purely decorative image. */
  alt: string;
  srcset?: string;
  /** Link to the full-size file, for a lightbox's download button. */
  download?: string;
}

export interface VideoMediaItem extends MediaItemBase {
  kind: 'video';
  src: string | MediaSourceEntry[];
  /** Names the video for assistive tech and in a grid. */
  title: string;
  poster?: string;
  tracks?: MediaTextTrack[];
}

export interface AudioMediaItem extends MediaItemBase {
  kind: 'audio';
  src: string | MediaSourceEntry[];
  title: string;
  artist?: string;
  artwork?: string;
}

export interface EmbedMediaItem extends MediaItemBase {
  kind: 'embed';
  /** A YouTube or Vimeo page or share URL. */
  url: string;
  title: string;
  poster?: string;
}

export type MediaItem = ImageMediaItem | VideoMediaItem | AudioMediaItem | EmbedMediaItem;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** A named frame (`'video'`) or any number or `'4 / 3'` string, as a width-over-height number. */
export function resolveAspectRatio(ratio: AspectRatioName | number | string): number {
  if (typeof ratio === 'number') return ratio;
  const value = ratio in aspectRatio ? aspectRatio[ratio as AspectRatioName] : ratio;
  const [width, height = '1'] = value.split('/').map((part) => part.trim());
  const result = Number(width) / Number(height);
  return Number.isFinite(result) && result > 0 ? result : 16 / 9;
}

/** `75` → `1:15`; `3725` → `1:02:05`. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const [hours, minutes, secs] = [
    Math.floor(total / 3600),
    Math.floor(total / 60) % 60,
    total % 60,
  ];
  const tail = `${String(secs).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${tail}` : `${minutes}:${tail}`;
}

/** `75` → `1 minute 15 seconds` — for `aria-valuetext`, where `1:15` is read as a ratio. */
export function formatDurationSpoken(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0 seconds';
  const total = Math.floor(seconds);
  const units: Array<[number, string]> = [
    [Math.floor(total / 3600), 'hour'],
    [Math.floor(total / 60) % 60, 'minute'],
    [total % 60, 'second'],
  ];
  const parts = units
    .filter(([amount], index) => amount > 0 || (index === 2 && total === 0))
    .map(([amount, unit]) => `${amount} ${unit}${amount === 1 ? '' : 's'}`);
  return parts.join(' ');
}

const EXTENSIONS: Record<Exclude<MediaKind, 'embed'>, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp'],
  video: ['mp4', 'webm', 'ogv', 'mov', 'm4v', 'm3u8'],
  audio: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus'],
};

const MIME: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  opus: 'audio/opus',
};

/** The lower-cased extension of a URL's last path segment, ignoring query and hash. */
export function fileExtension(url: string): string {
  const segment = url.split(/[?#]/)[0].split('/').pop() ?? '';
  const dot = segment.lastIndexOf('.');
  return dot <= 0 || dot === segment.length - 1 ? '' : segment.slice(dot + 1).toLowerCase();
}

/** A MIME type for a file extension, when it is a media type this library knows. */
export function guessMimeType(extension: string): string | undefined {
  return MIME[extension.toLowerCase()];
}

/** What a URL most likely points at, from its MIME type, embed host or extension. */
export function inferMediaKind(url: string, mimeType?: string): MediaKind | null {
  const family = mimeType?.split('/')[0];
  if (family === 'image' || family === 'video' || family === 'audio') return family;
  if (mimeType && /mpegurl/i.test(mimeType)) return 'video';
  if (parseEmbedUrl(url)) return 'embed';
  const extension = fileExtension(url);
  for (const [kind, list] of Object.entries(EXTENSIONS)) {
    if (list.includes(extension)) return kind as MediaKind;
  }
  return null;
}

/** Whether a source is an HLS playlist (`.m3u8` or an HLS MIME type). */
export function isHlsSource(source: string | MediaSourceEntry): boolean {
  const { src, type } = typeof source === 'string' ? { src: source, type: undefined } : source;
  if (type) return /mpegurl/i.test(type);
  return fileExtension(src) === 'm3u8';
}

/** Normalises a `src` prop to a list of typed sources. */
export function toMediaSources(src: string | MediaSourceEntry[]): MediaSourceEntry[] {
  if (Array.isArray(src)) return src;
  return [{ src, type: guessMimeType(fileExtension(src)) }];
}

/** A `TimeRanges` object (e.g. `media.buffered`) as plain `[start, end]` pairs. */
export function timeRangesToArray(ranges: TimeRanges | null | undefined): Array<[number, number]> {
  if (!ranges) return [];
  return Array.from({ length: ranges.length }, (_, index) => [
    ranges.start(index),
    ranges.end(index),
  ]);
}

export interface ParsedEmbed {
  provider: EmbedProvider;
  videoId: string;
  /** Start offset in seconds, from a `t=` / `start=` parameter or a `#t=` fragment. */
  start?: number;
}

const YOUTUBE_ID = /^[\w-]{11}$/;

function parseStart(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw);
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  if (!match || !match.slice(1).some(Boolean)) return undefined;
  const [, hours = '0', minutes = '0', seconds = '0'] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

/**
 * Reads a YouTube or Vimeo page, share or embed URL. Returns `null` for anything else, so an
 * arbitrary string can be tested safely.
 */
export function parseEmbedUrl(url: string): ParsedEmbed | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www|m)\./, '');
  const segments = parsed.pathname.split('/').filter(Boolean);
  const fragment = new URLSearchParams(parsed.hash.slice(1));
  const start = parseStart(
    parsed.searchParams.get('t') ?? parsed.searchParams.get('start') ?? fragment.get('t')
  );
  const found = (provider: EmbedProvider, videoId: string | undefined): ParsedEmbed | null =>
    videoId ? { provider, videoId, ...(start === undefined ? {} : { start }) } : null;

  if (host === 'youtu.be') {
    return found('youtube', YOUTUBE_ID.test(segments[0] ?? '') ? segments[0] : undefined);
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery && YOUTUBE_ID.test(fromQuery)) return found('youtube', fromQuery);
    if (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) {
      return found('youtube', YOUTUBE_ID.test(segments[1] ?? '') ? segments[1] : undefined);
    }
    return null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    return found(
      'vimeo',
      [...segments].reverse().find((segment) => /^\d+$/.test(segment))
    );
  }
  return null;
}

export interface EmbedSrcOptions {
  /**
   * Use the provider's no-tracking mode — `youtube-nocookie.com`, Vimeo's `dnt=1`. Defaults to
   * `true`.
   */
  privacy?: boolean;
  autoplay?: boolean;
  start?: number;
}

/** The iframe `src` for a provider's player. */
export function buildEmbedSrc(
  provider: EmbedProvider,
  videoId: string,
  { privacy = true, autoplay = false, start }: EmbedSrcOptions = {}
): string {
  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', '1');
  if (provider === 'youtube') {
    // Keep the end screen to this channel's videos rather than the whole site's.
    params.set('rel', '0');
    if (start !== undefined) params.set('start', String(Math.floor(start)));
    const host = privacy ? 'www.youtube-nocookie.com' : 'www.youtube.com';
    return `https://${host}/embed/${encodeURIComponent(videoId)}?${params}`;
  }
  if (privacy) params.set('dnt', '1');
  const query = params.toString() ? `?${params}` : '';
  // Vimeo reads the start time from the fragment, not the query.
  const hash = start !== undefined ? `#t=${Math.floor(start)}s` : '';
  return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}${query}${hash}`;
}

/**
 * YouTube's own still for a video. Loading it contacts Google before the user presses play, so
 * `MediaEmbed` never fetches it by itself — pass it as `poster` only if that is acceptable.
 */
export function embedThumbnail(provider: EmbedProvider, videoId: string): string | null {
  return provider === 'youtube'
    ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
    : null;
}

/** The preview image for a media item, if it has one. */
export function mediaThumbnail(item: MediaItem): string | undefined {
  if (item.thumbnail) return item.thumbnail;
  if (item.kind === 'image') return item.src;
  if (item.kind === 'video' || item.kind === 'embed') return item.poster;
  return item.artwork;
}

/** A human name for a media item: its title, alt text or caption. */
export function mediaLabel(item: MediaItem, index?: number): string {
  const name =
    item.kind === 'image' ? item.alt || item.caption : (item.title ?? item.caption ?? undefined);
  return name || `Item ${index === undefined ? '' : index + 1}`.trim();
}

/** A stable key for a media item. */
export function mediaKey(item: MediaItem, index: number): string {
  if (item.id) return item.id;
  const source = item.kind === 'embed' ? item.url : item.src;
  return `${typeof source === 'string' ? source : (source[0]?.src ?? '')}#${index}`;
}
