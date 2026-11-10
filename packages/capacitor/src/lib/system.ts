import { listen, nativePlatform, quietly } from './platform.js';
import type {
  AppResumePlugin,
  ClipboardPlugin,
  SplashScreenPlugin,
  Teardown,
  TextZoomPlugin,
} from './types.js';

export interface HideSplashOptions {
  /** `SplashScreen` from `@capacitor/splash-screen`, with `launchAutoHide: false` in its config. */
  SplashScreen: SplashScreenPlugin;
  /**
   * Waited for before the splash lifts — the stored theme being restored, the first data. It
   * cannot hold the splash past `timeout`.
   */
  until?: Promise<unknown>;
  /** Wait for the bundled faces to load, so no fallback text flashes. Defaults to `true`. */
  waitForFonts?: boolean;
  /** Longest wait in milliseconds before lifting anyway. Defaults to 3000. */
  timeout?: number;
  /** Fade in milliseconds. Defaults to 200; 0 when the user prefers reduced motion. */
  fadeOutDuration?: number;
}

const frame = () =>
  new Promise<void>((resolve) =>
    typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => resolve()) : resolve()
  );

/**
 * Lifts the native splash screen once the page is ready to be seen: the theme applied, the fonts
 * in, and a frame painted — so the splash gives way to the app rather than to a flash of
 * unstyled or wrong-theme content. Never rejects.
 */
export async function hideSplashScreen(options: HideSplashOptions): Promise<void> {
  if (!nativePlatform()) return;
  const { SplashScreen, until, waitForFonts = true, timeout = 3000 } = options;
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fadeOutDuration = reduced ? 0 : (options.fadeOutDuration ?? 200);

  const waits: Array<Promise<unknown>> = [];
  if (until) waits.push(until.catch(() => {}));
  if (waitForFonts && typeof document !== 'undefined' && document.fonts) {
    waits.push(document.fonts.ready.catch(() => {}));
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.all(waits),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeout);
    }),
  ]);
  clearTimeout(timer);
  // Two frames: the first is where the restored theme is laid out, the second is on screen.
  await frame();
  await frame();
  try {
    await SplashScreen.hide({ fadeOutDuration });
  } catch {
    /* a splash that is already gone is fine */
  }
}

export interface SystemTextSizeOptions {
  /** `TextZoom` from `@capacitor/text-zoom`. */
  TextZoom: TextZoomPlugin;
  /** `App` from `@capacitor/app`, to pick up a size changed in Settings while the app was away. */
  App?: AppResumePlugin;
}

/**
 * Makes the page's text follow the system text size — iOS Dynamic Type and Android's font scale —
 * which a web view otherwise ignores, so people who need larger text get it in the app as they
 * do everywhere else (WCAG 1.4.4). Re-reads on resume when given `App`. Returns the teardown.
 */
export function followSystemTextSize(options: SystemTextSizeOptions): Teardown {
  if (!nativePlatform()) return () => {};
  const { TextZoom, App } = options;
  let last: number | undefined;
  const apply = () =>
    quietly(
      TextZoom.getPreferred().then(({ value }) => {
        if (!Number.isFinite(value) || value <= 0 || value === last) return;
        last = value;
        return TextZoom.set({ value });
      })
    );
  apply();
  return App ? listen(App.addListener('resume', apply)) : () => {};
}

/**
 * Routes `navigator.clipboard.writeText` through `@capacitor/clipboard`. Android's web view
 * refuses the web Clipboard API without a permission prompt it cannot show, so every copy button
 * — `CodeBlock`'s included — would fail silently there. Returns the teardown, which restores the
 * original.
 */
export function bridgeClipboard(options: { Clipboard: ClipboardPlugin }): Teardown {
  if (!nativePlatform() || typeof navigator === 'undefined') return () => {};
  const { Clipboard } = options;
  const writeText = (text: string) => Clipboard.write({ string: text });

  const existing = navigator.clipboard as Clipboard | undefined;
  if (existing) {
    const own = Object.getOwnPropertyDescriptor(existing, 'writeText');
    Object.defineProperty(existing, 'writeText', {
      configurable: true,
      writable: true,
      value: writeText,
    });
    return () => {
      if (own) Object.defineProperty(existing, 'writeText', own);
      else delete (existing as { writeText?: unknown }).writeText;
    };
  }

  // No Clipboard API at all (an insecure origin): provide just enough of one.
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return () => {
    delete (navigator as { clipboard?: unknown }).clipboard;
  };
}
