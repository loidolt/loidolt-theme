import type { Attachment } from 'svelte/attachments';
import { canPlayHlsNatively, loadHls, type HlsErrorData, type HlsLoader } from './hls.js';

export type HlsStatus = 'idle' | 'loading' | 'native' | 'attached' | 'unsupported' | 'error';

export interface HlsSourceOptions {
  /** Loader for this player only. Defaults to the one given to `setHlsLoader()`. */
  loader?: HlsLoader;
  /** Passed to the hls.js constructor. */
  config?: Record<string, unknown>;
  onError?: (error: Error) => void;
}

export interface HlsSource {
  /** Attach a playlist to a media element: `{@attach hls.source(url)}`. */
  source(src: string): Attachment<HTMLMediaElement>;
  readonly status: HlsStatus;
  readonly error: Error | null;
}

/**
 * Plays an HLS playlist in a media element — natively where the browser can, through hls.js
 * where it cannot. Fatal network errors retry and media errors attempt recovery before the
 * status turns to `error`.
 */
export function createHlsSource(options: HlsSourceOptions = {}): HlsSource {
  let status = $state<HlsStatus>('idle');
  let error = $state<Error | null>(null);

  const fail = (next: HlsStatus, message: string) => {
    status = next;
    error = new Error(message);
    options.onError?.(error);
  };

  const source =
    (src: string): Attachment<HTMLMediaElement> =>
    (media) => {
      error = null;
      if (canPlayHlsNatively(media)) {
        media.src = src;
        status = 'native';
        return () => {
          media.removeAttribute('src');
          media.load();
        };
      }

      status = 'loading';
      let cancelled = false;
      let destroy: (() => void) | undefined;

      void loadHls(options.loader).then((Hls) => {
        if (cancelled) return;
        if (!Hls?.isSupported()) {
          fail(
            'unsupported',
            'This browser needs hls.js to play the stream. Register it once: setHlsLoader(() => import("hls.js").then((module) => module.default)).'
          );
          return;
        }
        const instance = new Hls(options.config);
        instance.on(Hls.Events.ERROR, (_event, data: HlsErrorData) => {
          if (!data?.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) instance.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) instance.recoverMediaError();
          else fail('error', `HLS playback failed: ${data.details ?? 'unknown error'}`);
        });
        instance.loadSource(src);
        instance.attachMedia(media);
        destroy = () => instance.destroy();
        status = 'attached';
      });

      return () => {
        cancelled = true;
        destroy?.();
        status = 'idle';
      };
    };

  return {
    source,
    get status() {
      return status;
    },
    get error() {
      return error;
    },
  };
}
