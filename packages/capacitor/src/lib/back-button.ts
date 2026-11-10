import { nativePlatform, listen, noop, quietly } from './platform.js';
import type { BackButtonPlugin, Teardown } from './types.js';

// Bits UI keeps every open dismissible layer here (dialogs, drawers, menus, popovers, selects).
const openLayers = () =>
  (globalThis as { bitsEscapeLayers?: Map<unknown, unknown> }).bitsEscapeLayers?.size ?? 0;

/**
 * Closes the innermost open layer — a dialog, drawer, lightbox, menu, popover or listbox — the
 * way Escape would, because that is exactly what it does: it sends Escape from the focused
 * element, where every overlay in `@loidolt/theme-svelte` (and any Bits UI layer, and any
 * `escapeKey(…, { preventDefault: true })` surface) already listens. Returns whether something
 * took it.
 */
export function closeTopLayer(doc: Document = document): boolean {
  const layered = openLayers() > 0;
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  (doc.activeElement ?? doc.body ?? doc.documentElement).dispatchEvent(event);
  // An open Bits layer counts even if it ignored the key: one that refuses Escape (a required
  // confirmation) must not be skipped past to the page behind it.
  return layered || event.defaultPrevented;
}

export interface BackButtonEvent {
  /** Whether the web view has history to go back through. */
  canGoBack: boolean;
}

export interface BackButtonOptions {
  /** `App` from `@capacitor/app`. */
  App: BackButtonPlugin;
  /**
   * Runs when no overlay took the press, before history. Return `true` once you have handled it
   * — a wizard stepping back, an editor asking to discard — and nothing else happens.
   */
  onBack?: (event: BackButtonEvent) => boolean | void;
  /**
   * What the back press does at the start of history. `minimize` (the default) backgrounds the
   * app with its state intact, as Android's own apps do; `exit` finishes it; `none` ignores it.
   */
  atRoot?: 'minimize' | 'exit' | 'none';
}

/**
 * The Android back button (and back gesture), handled the way a native app does: it closes the
 * open dialog, drawer or menu first, then goes back through history, then leaves the app.
 *
 * Without this, Capacitor's default navigates the web view back even with a dialog open, which
 * strands the overlay over the previous page. iOS has no back button, so it is a no-op there and
 * on the web.
 *
 * ```ts
 * import { App } from '@capacitor/app';
 * handleBackButton({ App });
 * ```
 */
export function handleBackButton(options: BackButtonOptions): Teardown {
  if (nativePlatform() !== 'android') return noop;
  const { App, onBack, atRoot = 'minimize' } = options;

  return listen(
    App.addListener('backButton', (event) => {
      if (closeTopLayer()) return;
      if (onBack?.(event) === true) return;
      if (event.canGoBack) {
        history.back();
        return;
      }
      if (atRoot === 'minimize') quietly(App.minimizeApp());
      else if (atRoot === 'exit') quietly(App.exitApp());
    })
  );
}
