import { onDestroy } from 'svelte';
import { listen, nativePlatform } from './platform.js';
import type { AppStatePlugin, Teardown } from './types.js';

export interface AppLifecycleOptions {
  /** `App` from `@capacitor/app`. */
  App: AppStatePlugin;
  /**
   * Pause every playing `<video>` and `<audio>` when the app goes to the background — the player
   * components included. Native players stop there too; nothing restarts on its own when the app
   * returns. Defaults to `true`.
   */
  pauseMedia?: boolean;
  onPause?: () => void;
  onResume?: () => void;
}

export interface AppLifecycle {
  /** Whether the app is in the foreground. Reactive; always `true` in a browser. */
  readonly active: boolean;
  destroy(): void;
}

/** Pauses every playing media element in the document. Returns how many it stopped. */
export function pauseAllMedia(doc: Document = document): number {
  let paused = 0;
  for (const media of doc.querySelectorAll<HTMLMediaElement>('video, audio')) {
    if (media.paused) continue;
    media.pause();
    paused += 1;
  }
  return paused;
}

/**
 * Foreground and background, as reactive state — so a dashboard can stop polling while nobody is
 * looking — and the native rule that media stops when the app leaves the screen.
 */
export function createAppLifecycle(options: AppLifecycleOptions): AppLifecycle {
  const { App, pauseMedia = true, onPause, onResume } = options;
  let active = $state(true);
  let teardown: Teardown = () => {};

  if (nativePlatform()) {
    teardown = listen(
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive === active) return;
        active = isActive;
        if (isActive) onResume?.();
        else {
          if (pauseMedia) pauseAllMedia();
          onPause?.();
        }
      })
    );
  }

  const destroy = () => teardown();
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get active() {
      return active;
    },
    destroy,
  };
}
