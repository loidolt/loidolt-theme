/*
 * HLS (`.m3u8`) playback. Safari plays HLS natively; everywhere else needs hls.js, which this
 * package never imports itself — it is an optional peer you register once, so apps that never
 * stream do not pay for it:
 *
 *   import { setHlsLoader } from '@loidolt/theme-svelte';
 *   setHlsLoader(() => import('hls.js').then((module) => module.default));
 */

/** The slice of the hls.js API the players use. */
export interface HlsInstance {
  loadSource(url: string): void;
  attachMedia(media: HTMLMediaElement): void;
  startLoad(): void;
  recoverMediaError(): void;
  destroy(): void;
  on(event: string, callback: (event: string, data: HlsErrorData) => void): void;
}

export interface HlsErrorData {
  type?: string;
  details?: string;
  fatal?: boolean;
}

export interface HlsConstructor {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported(): boolean;
  readonly Events: { ERROR: string } & Record<string, string>;
  readonly ErrorTypes: { NETWORK_ERROR: string; MEDIA_ERROR: string } & Record<string, string>;
}

export type HlsLoader = () => Promise<HlsConstructor> | HlsConstructor;

let registered: HlsLoader | null = null;
let cached: Promise<HlsConstructor | null> | null = null;

/** Registers how to load hls.js — typically a dynamic import. `null` unregisters. */
export function setHlsLoader(loader: HlsLoader | null): void {
  registered = loader;
  cached = null;
}

/**
 * Resolves hls.js through `loader`, else the registered loader, else a global `Hls` from a
 * script tag. Resolves `null` rather than rejecting when none is available.
 */
export function loadHls(loader?: HlsLoader): Promise<HlsConstructor | null> {
  const resolve = (source: HlsLoader) =>
    Promise.resolve()
      .then(source)
      .then((constructor) => constructor ?? null)
      .catch(() => null);
  if (loader) return resolve(loader);
  cached ??= resolve(
    registered ?? (() => (globalThis as { Hls?: HlsConstructor }).Hls as HlsConstructor)
  );
  return cached;
}

/** Whether the browser plays HLS without hls.js (Safari, iOS). */
export function canPlayHlsNatively(media?: HTMLMediaElement | null): boolean {
  const probe = media ?? (typeof document === 'undefined' ? null : document.createElement('video'));
  if (!probe) return false;
  return (
    probe.canPlayType('application/vnd.apple.mpegurl') !== '' ||
    probe.canPlayType('application/x-mpegURL') !== ''
  );
}
