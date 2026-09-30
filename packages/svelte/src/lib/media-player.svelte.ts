import type { Attachment } from 'svelte/attachments';
import { onDestroy } from 'svelte';
import { clamp, timeRangesToArray } from './media-utils.js';

export interface MediaPlayerOptions {
  onEnded?: () => void;
  onError?: (error: MediaError | null) => void;
  onTimeUpdate?: (seconds: number) => void;
}

export interface MediaTrackInfo {
  label: string;
  language: string;
  kind: string;
}

export interface MediaPlayer {
  /** Put on the `<video>` or `<audio>` element: `{@attach player.attach}`. */
  readonly attach: Attachment<HTMLMediaElement>;
  readonly playing: boolean;
  readonly ended: boolean;
  /** Stalled waiting for data. */
  readonly waiting: boolean;
  readonly currentTime: number;
  /** `NaN` until metadata loads; `Infinity` for a live stream. */
  readonly duration: number;
  /** Buffered time ranges, in seconds. */
  readonly buffered: Array<[number, number]>;
  readonly volume: number;
  readonly muted: boolean;
  readonly rate: number;
  readonly error: MediaError | null;
  readonly fullscreen: boolean;
  readonly pictureInPicture: boolean;
  /** Captions and subtitles, in document order. */
  readonly tracks: MediaTrackInfo[];
  /** Index into `tracks` of the one showing, or `null`. */
  readonly activeTrack: number | null;
  /** Whether this browser offers picture-in-picture for the attached element. */
  readonly canPictureInPicture: boolean;
  play(): Promise<void>;
  pause(): void;
  toggle(): Promise<void>;
  seek(seconds: number): void;
  seekBy(delta: number): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  setRate(rate: number): void;
  /** Show one text track (by index into `tracks`) or none. */
  selectTrack(index: number | null): void;
  /** Fullscreen the given container (so custom controls come along), else the media itself. */
  toggleFullscreen(container?: HTMLElement | null): Promise<void>;
  togglePictureInPicture(): Promise<void>;
  destroy(): void;
}

type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/**
 * Reactive state and commands over a native `<video>` or `<audio>` element. `VideoPlayer` and
 * `AudioPlayer` are built on it; use it directly to put your own controls on a media element.
 *
 * ```svelte
 * const player = createMediaPlayer();
 * <video src={url} {@attach player.attach}></video>
 * <button onclick={player.toggle}>{player.playing ? 'Pause' : 'Play'}</button>
 * ```
 */
export function createMediaPlayer(options: MediaPlayerOptions = {}): MediaPlayer {
  // Not reactive on purpose: the attachment reads it, and an attachment that reads state it
  // also writes re-runs itself forever.
  let media: HTMLMediaElement | null = null;
  let pipSupported = $state(false);
  let playing = $state(false);
  let ended = $state(false);
  let waiting = $state(false);
  let currentTime = $state(0);
  let duration = $state(Number.NaN);
  let buffered = $state<Array<[number, number]>>([]);
  let volume = $state(1);
  let muted = $state(false);
  let rate = $state(1);
  let error = $state<MediaError | null>(null);
  let fullscreen = $state(false);
  let pictureInPicture = $state(false);
  let tracks = $state<MediaTrackInfo[]>([]);
  let activeTrack = $state<number | null>(null);

  const textTracks = () =>
    [...(media?.textTracks ?? [])].filter(
      (track) => track.kind === 'captions' || track.kind === 'subtitles'
    );

  let detach: (() => void) | undefined;

  const attach: Attachment<HTMLMediaElement> = (node) => {
    media = node;
    pipSupported =
      node instanceof HTMLVideoElement &&
      node.ownerDocument.pictureInPictureEnabled === true &&
      typeof node.requestPictureInPicture === 'function';
    const doc = node.ownerDocument;
    const syncTracks = () => {
      const list = textTracks();
      tracks = list.map((track) => ({
        label: track.label,
        language: track.language,
        kind: track.kind,
      }));
      const showing = list.findIndex((track) => track.mode === 'showing');
      activeTrack = showing === -1 ? null : showing;
    };
    const sync = () => {
      playing = !node.paused;
      ended = node.ended;
      currentTime = node.currentTime;
      duration = node.duration;
      buffered = timeRangesToArray(node.buffered);
      volume = node.volume;
      muted = node.muted;
      rate = node.playbackRate;
    };
    const handlers: Record<string, () => void> = {
      play: () => {
        playing = true;
        ended = false;
      },
      pause: () => (playing = false),
      playing: () => (waiting = false),
      waiting: () => (waiting = true),
      ended: () => {
        playing = false;
        ended = true;
        options.onEnded?.();
      },
      timeupdate: () => {
        currentTime = node.currentTime;
        options.onTimeUpdate?.(node.currentTime);
      },
      durationchange: () => (duration = node.duration),
      loadedmetadata: () => {
        sync();
        syncTracks();
      },
      progress: () => (buffered = timeRangesToArray(node.buffered)),
      volumechange: () => {
        volume = node.volume;
        muted = node.muted;
      },
      ratechange: () => (rate = node.playbackRate),
      seeked: () => (currentTime = node.currentTime),
      error: () => {
        error = node.error;
        options.onError?.(node.error);
      },
      enterpictureinpicture: () => (pictureInPicture = true),
      leavepictureinpicture: () => (pictureInPicture = false),
    };
    const onFullscreen = () => {
      const element = doc.fullscreenElement;
      fullscreen = Boolean(element && (element === node || element.contains(node)));
    };

    sync();
    syncTracks();
    for (const [type, handler] of Object.entries(handlers)) node.addEventListener(type, handler);
    node.textTracks?.addEventListener?.('change', syncTracks);
    node.textTracks?.addEventListener?.('addtrack', syncTracks);
    doc.addEventListener('fullscreenchange', onFullscreen);

    detach = () => {
      for (const [type, handler] of Object.entries(handlers)) {
        node.removeEventListener(type, handler);
      }
      node.textTracks?.removeEventListener?.('change', syncTracks);
      node.textTracks?.removeEventListener?.('addtrack', syncTracks);
      doc.removeEventListener('fullscreenchange', onFullscreen);
      if (media === node) media = null;
      detach = undefined;
    };
    return () => detach?.();
  };

  async function play() {
    if (!media) return;
    try {
      await media.play();
    } catch {
      // Autoplay policy or an unplayable source; `error` and `playing` already say what happened.
    }
  }

  function seek(seconds: number) {
    if (!media) return;
    const end = Number.isFinite(media.duration) ? media.duration : Number.MAX_SAFE_INTEGER;
    media.currentTime = clamp(seconds, 0, end);
    currentTime = media.currentTime;
  }

  const destroy = () => {
    detach?.();
  };

  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    attach,
    get playing() {
      return playing;
    },
    get ended() {
      return ended;
    },
    get waiting() {
      return waiting;
    },
    get currentTime() {
      return currentTime;
    },
    get duration() {
      return duration;
    },
    get buffered() {
      return buffered;
    },
    get volume() {
      return volume;
    },
    get muted() {
      return muted;
    },
    get rate() {
      return rate;
    },
    get error() {
      return error;
    },
    get fullscreen() {
      return fullscreen;
    },
    get pictureInPicture() {
      return pictureInPicture;
    },
    get tracks() {
      return tracks;
    },
    get activeTrack() {
      return activeTrack;
    },
    get canPictureInPicture() {
      return pipSupported;
    },
    play,
    pause: () => media?.pause(),
    toggle: () => (media && !media.paused ? Promise.resolve(media.pause()) : play()),
    seek,
    seekBy: (delta) => seek((media?.currentTime ?? 0) + delta),
    setVolume(next) {
      if (!media) return;
      media.volume = clamp(next, 0, 1);
      if (media.volume > 0 && media.muted) media.muted = false;
    },
    toggleMute() {
      if (media) media.muted = !media.muted;
    },
    setRate(next) {
      if (media) media.playbackRate = clamp(next, 0.25, 4);
    },
    selectTrack(index) {
      textTracks().forEach((track, position) => {
        track.mode = position === index ? 'showing' : 'disabled';
      });
      activeTrack = index;
    },
    async toggleFullscreen(container) {
      if (!media) return;
      const doc = media.ownerDocument;
      if (doc.fullscreenElement) {
        await doc.exitFullscreen?.();
        return;
      }
      const target = container ?? media;
      if (typeof target.requestFullscreen === 'function') await target.requestFullscreen();
      // iOS Safari only fullscreens the video element itself.
      else (media as WebkitVideo).webkitEnterFullscreen?.();
    },
    async togglePictureInPicture() {
      if (!(media instanceof HTMLVideoElement)) return;
      const doc = media.ownerDocument;
      if (doc.pictureInPictureElement) await doc.exitPictureInPicture();
      else await media.requestPictureInPicture?.();
    },
    destroy,
  };
}
