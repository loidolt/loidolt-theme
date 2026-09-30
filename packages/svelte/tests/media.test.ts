import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AspectRatio from '../src/lib/components/AspectRatio.svelte';
import AudioPlayer from '../src/lib/components/AudioPlayer.svelte';
import MediaEmbed from '../src/lib/components/MediaEmbed.svelte';
import Thumbnail from '../src/lib/components/Thumbnail.svelte';
import VideoPlayer from '../src/lib/components/VideoPlayer.svelte';
import { setHlsLoader, type HlsConstructor } from '../src/lib/hls.js';
import { createMediaZoom } from '../src/lib/media-zoom.svelte.js';
import ZoomHarness from './fixtures/ZoomHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

/** Gives a jsdom media element a duration and position, and tells the player. */
function setTimes(media: HTMLMediaElement, duration: number, current = 0) {
  Object.defineProperty(media, 'duration', { configurable: true, value: duration });
  media.currentTime = current;
  media.dispatchEvent(new Event('durationchange'));
  media.dispatchEvent(new Event('timeupdate'));
  flushSync();
}

afterEach(() => {
  setHlsLoader(null);
  vi.restoreAllMocks();
});

describe('VideoPlayer', () => {
  it('plays, seeks and reports its position in words', async () => {
    const user = userEvent.setup();
    const onEnded = vi.fn();
    const onTimeUpdate = vi.fn();
    render(VideoPlayer, {
      src: 'cut.mp4',
      label: 'Cutting demo',
      poster: 'poster.jpg',
      onEnded,
      onTimeUpdate,
    });
    const group = screen.getByRole('group', { name: 'Cutting demo' });
    const video = group.querySelector('video')!;
    expect(video.querySelector('source')).toHaveAttribute('type', 'video/mp4');
    setTimes(video, 240, 65);
    expect(onTimeUpdate).toHaveBeenCalledWith(65);

    const seek = screen.getByRole('slider', { name: 'Seek' });
    expect(seek).toHaveAttribute('aria-valuetext', '1 minute 5 seconds of 4 minutes');
    expect(group).toHaveTextContent('1:05 / 4:00');

    await user.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(group).toHaveAttribute('data-playing');

    await fireEvent.input(seek, { target: { value: '120' } });
    expect(video.currentTime).toBe(120);

    video.dispatchEvent(new Event('ended'));
    expect(onEnded).toHaveBeenCalledOnce();
  });

  it('answers the usual keyboard shortcuts on the player', async () => {
    const user = userEvent.setup();
    render(VideoPlayer, { src: 'cut.mp4', label: 'Demo' });
    const group = screen.getByRole('group', { name: 'Demo' });
    const video = group.querySelector('video')!;
    setTimes(video, 100, 50);
    video.tabIndex = 0;
    video.focus();

    await user.keyboard('k');
    expect(video.paused).toBe(false);
    await user.keyboard('{ArrowRight}');
    expect(video.currentTime).toBe(55);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(video.currentTime).toBe(45);
    await user.keyboard('m');
    expect(video.muted).toBe(true);
    await user.keyboard('{ArrowDown}');
    expect(video.volume).toBeCloseTo(0.9);
    await user.keyboard('{ArrowUp}');
    // Raising the volume unmutes, as every native player does.
    expect(video.muted).toBe(false);
    await user.keyboard('c');
    await user.keyboard('{Control>}k{/Control}');
    expect(video.paused).toBe(false);
    await user.keyboard(' ');
    expect(video.paused).toBe(true);
  });

  it('mutes, changes speed, and goes full screen', async () => {
    const user = userEvent.setup();
    const requestFullscreen = vi.fn(() => Promise.resolve());
    HTMLElement.prototype.requestFullscreen = requestFullscreen;
    render(VideoPlayer, { src: 'cut.mp4', label: 'Demo' });
    const video = document.querySelector('video')!;

    await user.click(screen.getByRole('button', { name: 'Mute' }));
    expect(video.muted).toBe(true);
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Playback speed' }), '1.5');
    expect(video.playbackRate).toBe(1.5);
    await fireEvent.input(screen.getByRole('slider', { name: 'Volume' }), {
      target: { value: '0.4' },
    });
    expect(video.volume).toBeCloseTo(0.4);
    await user.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(requestFullscreen).toHaveBeenCalled();
  });

  it('offers captions when the video has tracks', async () => {
    const user = userEvent.setup();
    render(VideoPlayer, {
      src: 'cut.mp4',
      label: 'Demo',
      tracks: [{ src: 'en.vtt', srclang: 'en', label: 'English', default: true }],
    });
    const video = document.querySelector('video')!;
    expect(video.querySelector('track')).toHaveAttribute('kind', 'captions');
    expect(video).toHaveAttribute('crossorigin', 'anonymous');
    const fakeTrack = { kind: 'captions', label: 'English', language: 'en', mode: 'disabled' };
    Object.defineProperty(video, 'textTracks', {
      configurable: true,
      value: Object.assign([fakeTrack], { addEventListener() {}, removeEventListener() {} }),
    });
    video.dispatchEvent(new Event('loadedmetadata'));
    flushSync();
    const captions = screen.getByRole('button', { name: 'Captions' });
    expect(captions).toHaveAttribute('aria-pressed', 'false');
    await user.click(captions);
    expect(fakeTrack.mode).toBe('showing');
    expect(captions).toHaveAttribute('aria-pressed', 'true');
  });

  it('streams HLS through a registered hls.js, and says so when there is none', async () => {
    const instance = {
      loadSource: vi.fn(),
      attachMedia: vi.fn(),
      startLoad: vi.fn(),
      recoverMediaError: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
    };
    const FakeHls = Object.assign(
      vi.fn(function () {
        return instance;
      }),
      {
        isSupported: () => true,
        Events: { ERROR: 'hlsError' },
        ErrorTypes: { NETWORK_ERROR: 'network', MEDIA_ERROR: 'media' },
      }
    ) as unknown as HlsConstructor;
    const { unmount } = render(VideoPlayer, {
      src: 'live/index.m3u8',
      label: 'Live',
      hlsLoader: () => FakeHls,
    });
    await waitFor(() => expect(instance.loadSource).toHaveBeenCalledWith('live/index.m3u8'));
    expect(document.querySelector('source')).toBeNull();

    const onError = instance.on.mock.calls[0][1];
    onError('hlsError', { fatal: true, type: 'network' });
    expect(instance.startLoad).toHaveBeenCalled();
    onError('hlsError', { fatal: true, type: 'media' });
    expect(instance.recoverMediaError).toHaveBeenCalled();
    onError('hlsError', { fatal: false });
    onError('hlsError', { fatal: true, type: 'other', details: 'boom' });
    flushSync();
    expect(screen.getByRole('alert')).toHaveTextContent('could not be played');
    unmount();
    expect(instance.destroy).toHaveBeenCalled();

    render(VideoPlayer, {
      src: 'live/index.m3u8',
      label: 'Live',
      hlsLoader: () => null as unknown as HlsConstructor,
      labels: { error: 'Streaming needs hls.js.' },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Streaming needs hls.js.');
  });

  it('plays HLS natively where the browser can, and hands over to native controls', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    render(VideoPlayer, {
      src: 'live/index.m3u8',
      label: 'Live',
      controls: 'native',
      autoplay: true,
    });
    const video = document.querySelector('video')!;
    expect(video.src).toContain('live/index.m3u8');
    expect(video.controls).toBe(true);
    expect(video.muted).toBe(true);
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
  });

  it('shows an overlay and reports a media error', () => {
    render(VideoPlayer, { src: 'broken.mp4', label: 'Broken', overlay: text('Proof run') });
    expect(screen.getByText('Proof run')).toBeInTheDocument();
    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'error', { configurable: true, value: { code: 4 } });
    video.dispatchEvent(new Event('error'));
    flushSync();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('AudioPlayer', () => {
  it('names itself by title and shows the artist and artwork', async () => {
    const user = userEvent.setup();
    render(AudioPlayer, {
      src: 'talk.mp3',
      title: 'Shop talk',
      artist: 'Loidolt',
      artwork: 'a.jpg',
    });
    expect(screen.getByRole('group', { name: 'Shop talk' })).toHaveTextContent('Loidolt');
    expect(document.querySelector('.ldt-media-player__artwork')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play' }));
    expect(document.querySelector('audio')!.paused).toBe(false);
  });
});

describe('MediaEmbed', () => {
  it('stands in with a local facade until the user presses play', async () => {
    const user = userEvent.setup();
    render(MediaEmbed, {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
      title: 'Assembly guide',
      poster: 'still.jpg',
    });
    expect(document.querySelector('iframe')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Play Assembly guide' }));
    const frame = document.querySelector('iframe')!;
    expect(frame).toHaveAttribute('title', 'Assembly guide');
    expect(frame.src).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&start=10'
    );
  });

  it('loads eagerly on request, takes a provider and id, and rejects unknown links', () => {
    render(MediaEmbed, { provider: 'vimeo', videoId: '76979871', title: 'Tour', eager: true });
    expect(document.querySelector('iframe')!.src).toBe(
      'https://player.vimeo.com/video/76979871?dnt=1'
    );
    render(MediaEmbed, { url: 'https://example.com/clip', title: 'Elsewhere' });
    expect(screen.getByText('This video link is not supported.')).toBeInTheDocument();
  });
});

describe('AspectRatio and Thumbnail', () => {
  it('holds a named or numeric frame', () => {
    const { container } = render(AspectRatio, { ratio: 'square', children: text('Box') });
    expect(container.querySelector('.ldt-aspect-ratio')).toHaveStyle('--ldt-aspect-ratio: 1');
    render(Thumbnail, { src: 'a.jpg', alt: 'Sheet', ratio: 'portrait' });
    expect(document.querySelector('.ldt-thumbnail')?.getAttribute('style')).toContain('3 / 4');
  });

  it('tracks loading, and falls back when the image fails', async () => {
    const onload = vi.fn();
    const onerror = vi.fn();
    render(Thumbnail, {
      src: 'a.jpg',
      alt: 'Sheet',
      onload,
      onerror,
      overlay: text('4:12'),
      fallback: text('No preview'),
    });
    const figure = document.querySelector('.ldt-thumbnail')!;
    expect(figure).toHaveAttribute('data-status', 'loading');
    await fireEvent.load(screen.getByRole('img', { name: 'Sheet' }));
    expect(figure).toHaveAttribute('data-status', 'loaded');
    expect(onload).toHaveBeenCalled();
    await fireEvent.error(screen.getByRole('img', { name: 'Sheet' }));
    expect(onerror).toHaveBeenCalled();
    expect(screen.getByText('No preview')).toBeInTheDocument();
    expect(screen.getByText('4:12').closest('.ldt-thumbnail__overlay')).not.toBeNull();

    render(Thumbnail, { src: 'b.jpg', alt: 'Other sheet' });
    await fireEvent.error(screen.getByRole('img', { name: 'Other sheet' }));
    expect(screen.getByText('Other sheet')).toHaveClass('ldt-sr-only');
  });
});

describe('createMediaZoom', () => {
  it('zooms in steps within bounds, toggles, and resets', async () => {
    const user = userEvent.setup();
    render(ZoomHarness);
    const readout = () => screen.getByRole('status').textContent;
    await user.click(screen.getByRole('button', { name: 'In' }));
    await user.click(screen.getByRole('button', { name: 'In' }));
    await user.click(screen.getByRole('button', { name: 'In' }));
    expect(readout()).toBe('3×0,0');
    await user.click(screen.getByRole('button', { name: 'Out' }));
    expect(readout()).toBe('2×0,0');
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(readout()).toBe('1×0,0');
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(readout()).toBe('2×0,0');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(readout()).toBe('1×0,0');
  });

  it('pans while zoomed, pinches, and zooms on Ctrl + wheel or double-click', async () => {
    render(ZoomHarness);
    const frame = screen.getByTestId('frame');
    Object.defineProperty(frame, 'clientWidth', { value: 200 });
    Object.defineProperty(frame, 'clientHeight', { value: 100 });
    const readout = () => screen.getByRole('status').textContent;

    await fireEvent.dblClick(frame);
    expect(readout()).toBe('2×0,0');
    await fireEvent.pointerDown(frame, { pointerId: 1, clientX: 100, clientY: 50 });
    await fireEvent.pointerMove(frame, { pointerId: 1, clientX: 400, clientY: 60 });
    // Panning stops at the edge of the scaled image: (2 - 1) × 200 / 2.
    expect(readout()).toBe('2×100,10');
    await fireEvent.pointerUp(frame, { pointerId: 1 });

    await fireEvent.pointerDown(frame, { pointerId: 1, clientX: 0, clientY: 0 });
    await fireEvent.pointerDown(frame, { pointerId: 2, clientX: 10, clientY: 0 });
    await fireEvent.pointerMove(frame, { pointerId: 2, clientX: 20, clientY: 0 });
    expect(readout()?.startsWith('3×')).toBe(true);
    await fireEvent.pointerCancel(frame, { pointerId: 1 });
    await fireEvent.pointerUp(frame, { pointerId: 2 });

    await fireEvent.wheel(frame, { deltaY: 500 });
    expect(readout()?.startsWith('3×')).toBe(true);
    await fireEvent.wheel(frame, { deltaY: 500, ctrlKey: true });
    expect(readout()).toBe('1×0,0');
    await fireEvent.pointerMove(frame, { pointerId: 9, clientX: 1, clientY: 1 });
  });

  it('rejects an impossible range', () => {
    expect(() => createMediaZoom({ minScale: 2, maxScale: 1 })).toThrow(RangeError);
  });
});
