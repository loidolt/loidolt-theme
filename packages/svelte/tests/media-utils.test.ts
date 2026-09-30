import { afterEach, describe, expect, it, vi } from 'vitest';
import { canPlayHlsNatively, loadHls, setHlsLoader, type HlsConstructor } from '../src/lib/hls.js';
import {
  buildEmbedSrc,
  embedThumbnail,
  fileExtension,
  formatDuration,
  formatDurationSpoken,
  inferMediaKind,
  isHlsSource,
  mediaKey,
  mediaLabel,
  mediaThumbnail,
  parseEmbedUrl,
  resolveAspectRatio,
  timeRangesToArray,
  toMediaSources,
} from '../src/lib/media-utils.js';

afterEach(() => {
  setHlsLoader(null);
  vi.unstubAllGlobals();
});

describe('media utilities', () => {
  it('formats durations for display and for speech', () => {
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDurationSpoken(75)).toBe('1 minute 15 seconds');
    expect(formatDurationSpoken(3601)).toBe('1 hour 1 second');
    expect(formatDurationSpoken(0)).toBe('0 seconds');
    expect(formatDurationSpoken(-1)).toBe('0 seconds');
  });

  it('resolves named, numeric and written ratios', () => {
    expect(resolveAspectRatio('video')).toBeCloseTo(16 / 9);
    expect(resolveAspectRatio('square')).toBe(1);
    expect(resolveAspectRatio(2)).toBe(2);
    expect(resolveAspectRatio('4 / 3')).toBeCloseTo(4 / 3);
    expect(resolveAspectRatio('1.5')).toBe(1.5);
    expect(resolveAspectRatio('nonsense')).toBeCloseTo(16 / 9);
  });

  it('reads kinds, extensions and sources', () => {
    expect(fileExtension('https://x.test/a/clip.MP4?v=2#t')).toBe('mp4');
    expect(fileExtension('https://x.test/readme')).toBe('');
    expect(inferMediaKind('photo.webp')).toBe('image');
    expect(inferMediaKind('talk.m4a')).toBe('audio');
    expect(inferMediaKind('stream.m3u8')).toBe('video');
    expect(inferMediaKind('file', 'video/webm')).toBe('video');
    expect(inferMediaKind('file', 'application/x-mpegURL')).toBe('video');
    expect(inferMediaKind('https://youtu.be/dQw4w9WgXcQ')).toBe('embed');
    expect(inferMediaKind('notes.txt')).toBeNull();
    expect(isHlsSource('live/index.m3u8')).toBe(true);
    expect(isHlsSource({ src: 'live', type: 'application/vnd.apple.mpegurl' })).toBe(true);
    expect(isHlsSource({ src: 'clip.mp4', type: 'video/mp4' })).toBe(false);
    expect(toMediaSources('clip.webm')).toEqual([{ src: 'clip.webm', type: 'video/webm' }]);
    const list = [{ src: 'a.mp4' }];
    expect(toMediaSources(list)).toBe(list);
  });

  it('turns buffered ranges into pairs', () => {
    expect(timeRangesToArray(null)).toEqual([]);
    const ranges = { length: 2, start: (i: number) => i * 10, end: (i: number) => i * 10 + 5 };
    expect(timeRangesToArray(ranges as TimeRanges)).toEqual([
      [0, 5],
      [10, 15],
    ]);
  });

  it('parses YouTube and Vimeo links, with start times', () => {
    expect(parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      start: 90,
    });
    expect(parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ?t=42')?.start).toBe(42);
    expect(parseEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.videoId).toBe(
      'dQw4w9WgXcQ'
    );
    expect(parseEmbedUrl('https://www.youtube.com/channel/abc')).toBeNull();
    expect(parseEmbedUrl('https://youtu.be/short')).toBeNull();
    expect(parseEmbedUrl('https://vimeo.com/channels/staff/76979871#t=30s')).toEqual({
      provider: 'vimeo',
      videoId: '76979871',
      start: 30,
    });
    expect(parseEmbedUrl('https://example.com/video')).toBeNull();
    expect(parseEmbedUrl('not a url')).toBeNull();
    expect(parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ?t=soon')?.start).toBeUndefined();
  });

  it('builds privacy-first embed URLs', () => {
    expect(buildEmbedSrc('youtube', 'dQw4w9WgXcQ', { start: 90.4, autoplay: true })).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&start=90'
    );
    expect(buildEmbedSrc('youtube', 'dQw4w9WgXcQ', { privacy: false })).toContain(
      'https://www.youtube.com/embed/'
    );
    // Vimeo reads the start from the fragment.
    expect(buildEmbedSrc('vimeo', '76979871', { start: 30 })).toBe(
      'https://player.vimeo.com/video/76979871?dnt=1#t=30s'
    );
    expect(buildEmbedSrc('vimeo', '76979871', { privacy: false })).toBe(
      'https://player.vimeo.com/video/76979871'
    );
    expect(embedThumbnail('youtube', 'dQw4w9WgXcQ')).toContain('i.ytimg.com');
    expect(embedThumbnail('vimeo', '1')).toBeNull();
  });

  it('names, keys and previews media items', () => {
    const image = { kind: 'image' as const, src: 'a.jpg', alt: 'Bracket' };
    const video = {
      kind: 'video' as const,
      src: [{ src: 'b.mp4' }],
      title: 'Cut',
      poster: 'p.jpg',
    };
    const audio = { kind: 'audio' as const, src: 'c.mp3', title: 'Talk', artwork: 'art.jpg' };
    const embed = { kind: 'embed' as const, url: 'https://youtu.be/x', title: 'Demo' };
    expect(mediaThumbnail(image)).toBe('a.jpg');
    expect(mediaThumbnail(video)).toBe('p.jpg');
    expect(mediaThumbnail(audio)).toBe('art.jpg');
    expect(mediaThumbnail({ ...embed, thumbnail: 't.jpg' })).toBe('t.jpg');
    expect(mediaLabel(image)).toBe('Bracket');
    expect(mediaLabel({ ...image, alt: '' }, 2)).toBe('Item 3');
    expect(mediaLabel(audio)).toBe('Talk');
    expect(mediaKey(video, 1)).toBe('b.mp4#1');
    expect(mediaKey({ ...embed, id: 'demo' }, 0)).toBe('demo');
  });
});

describe('hls loader', () => {
  const FakeHls = { isSupported: () => true } as unknown as HlsConstructor;

  it('resolves a registered loader once, a per-call loader each time, or null', async () => {
    const loader = vi.fn(() => FakeHls);
    setHlsLoader(loader);
    expect(await loadHls()).toBe(FakeHls);
    expect(await loadHls()).toBe(FakeHls);
    expect(loader).toHaveBeenCalledOnce();
    expect(await loadHls(() => Promise.reject(new Error('offline')))).toBeNull();

    setHlsLoader(null);
    vi.stubGlobal('Hls', FakeHls);
    expect(await loadHls()).toBe(FakeHls);
  });

  it('detects native HLS playback', () => {
    const video = document.createElement('video');
    expect(canPlayHlsNatively(video)).toBe(false);
    video.canPlayType = () => 'maybe';
    expect(canPlayHlsNatively(video)).toBe(true);
    expect(canPlayHlsNatively()).toBe(false);
  });
});
