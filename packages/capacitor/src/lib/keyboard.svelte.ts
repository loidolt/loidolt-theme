import { onDestroy } from 'svelte';
import { combine, listen, nativePlatform } from './platform.js';
import type { KeyboardPlugin } from './types.js';

export interface NativeKeyboardOptions {
  /** `Keyboard` from `@capacitor/keyboard`. */
  Keyboard: KeyboardPlugin;
  /**
   * Whether the keyboard draws over the page rather than shrinking it — the `none` resize mode.
   * Then its height becomes the bottom safe area, so the last row, toasts, floating bars and
   * drawers lift above it. `auto` (the default) asks the plugin for its resize mode.
   */
  overlays?: boolean | 'auto';
  /** Scroll the focused field into view once the keyboard is up. Defaults to `true`. */
  revealFocused?: boolean;
  /** Where the attribute and variables are written. Defaults to `<html>`. */
  element?: HTMLElement;
}

export interface NativeKeyboard {
  /** Whether the software keyboard is up (or on its way). Reactive. */
  readonly visible: boolean;
  /** Its height in CSS pixels; 0 while hidden. Reactive. */
  readonly height: number;
  /** Removes the listeners and clears the attribute. Automatic for a component-scoped instance. */
  destroy(): void;
}

/**
 * Tracks the software keyboard and tells the stylesheet about it:
 *
 * - `data-keyboard="open"` on `<html>` while it is up — `@loidolt/theme-capacitor/styles.css`
 *   hides the `TabBar` then, as native apps do, so it does not ride up on top of the keys.
 * - `--ldt-keyboard-height`, its height, for anything of your own that should sit above it.
 * - `--ldt-keyboard-inset`, the part of that height the page has to clear itself: the full
 *   height when the keyboard overlays the page, 0 when the web view shrinks for it.
 *
 * The keyboard events fire before the animation, so layout moves with the keys rather than after.
 * A no-op outside a native shell: `visible` stays `false`.
 */
export function createNativeKeyboard(options: NativeKeyboardOptions): NativeKeyboard {
  const { Keyboard, overlays = 'auto', revealFocused = true } = options;
  let visible = $state(false);
  let height = $state(0);
  let teardown = () => {};

  const root =
    options.element ?? (typeof document === 'undefined' ? null : document.documentElement);

  if (nativePlatform() && root) {
    let overlaid = overlays === true;
    const write = () => {
      if (visible) root.dataset.keyboard = 'open';
      else delete root.dataset.keyboard;
      root.style.setProperty('--ldt-keyboard-height', `${height}px`);
      root.style.setProperty('--ldt-keyboard-inset', `${overlaid ? height : 0}px`);
    };

    if (overlays === 'auto') {
      Keyboard.getResizeMode().then(
        ({ mode }) => {
          overlaid = mode === 'none';
          if (visible) write();
        },
        () => {}
      );
    }

    teardown = combine(
      listen(
        Keyboard.addListener('keyboardWillShow', (info) => {
          visible = true;
          height = Math.max(0, info.keyboardHeight);
          write();
        })
      ),
      listen(
        Keyboard.addListener('keyboardDidShow', () => {
          if (!revealFocused) return;
          const focused = root.ownerDocument.activeElement;
          if (focused instanceof HTMLElement && focused !== root.ownerDocument.body) {
            focused.scrollIntoView({ block: 'nearest' });
          }
        })
      ),
      listen(
        Keyboard.addListener('keyboardWillHide', () => {
          visible = false;
          height = 0;
          write();
        })
      ),
      () => {
        delete root.dataset.keyboard;
        root.style.removeProperty('--ldt-keyboard-height');
        root.style.removeProperty('--ldt-keyboard-inset');
      }
    );
  }

  const destroy = () => teardown();
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get visible() {
      return visible;
    },
    get height() {
      return height;
    },
    destroy,
  };
}
