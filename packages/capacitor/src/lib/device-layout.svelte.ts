import { registerPlugin } from '@capacitor/core';
import { onDestroy } from 'svelte';
import { combine, listen, nativePlatform, quietly } from './platform.js';
import type { PluginListenerHandle } from './types.js';

/** A rectangle in CSS pixels, measured from the top left of the web view. */
export interface DeviceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Part of the display the system keeps for itself. `occlusion` is covered by hardware, such as a
 * front camera and the Dynamic Island around it; `division` is where the display folds, present
 * only while the device is partly open. Taps over either may not register, so keep controls off
 * them. The rectangle includes the system's margins for interactive content.
 */
export interface DeviceRegion extends DeviceRect {
  kind: 'occlusion' | 'division';
  margins: { top: number; right: number; bottom: number; left: number };
}

export type HingeStatus = 'closed' | 'partially-open' | 'fully-open' | 'unknown';

/** What the native side reports. Fields it can't read on this device are left out. */
export interface DeviceLayoutSnapshot {
  /** The web view's size, in CSS pixels. */
  width: number;
  height: number;
  /**
   * The side where the system puts toolbars and tab bars vertically, as on iPhone Duo's cover
   * screen. A physical side: the system keeps it beside the hardware in every writing direction.
   * Absent where bars stay horizontal.
   */
  barEdge?: 'left' | 'right';
  regions: DeviceRegion[];
  /** The hinge, on a device that has one. `angle` is in degrees: 0 closed, 180 flat. */
  hinge?: { status: HingeStatus; angle: number };
}

/** The native plugin bundled with `@loidolt/theme-capacitor` (iOS). */
export interface DeviceLayoutPlugin {
  getLayout(): Promise<DeviceLayoutSnapshot>;
  addListener(
    eventName: 'change',
    listener: (layout: DeviceLayoutSnapshot) => void
  ): Promise<PluginListenerHandle>;
}

export interface DeviceLayoutOptions {
  /** Defaults to the plugin bundled with this package. */
  DeviceLayout?: DeviceLayoutPlugin;
  /** Where the attributes and variables are written. Defaults to `<html>`. */
  element?: HTMLElement;
}

export interface DeviceLayout {
  /** The latest report, or `null` before the first one and outside a native shell. Reactive. */
  readonly current: DeviceLayoutSnapshot | null;
  /** Removes the listener, the attributes and the variables. */
  destroy(): void;
}

/** The fold, when the device is partly open: where it starts and ends along the axis it crosses. */
export function foldOf(
  layout: DeviceLayoutSnapshot
): { axis: 'vertical' | 'horizontal'; start: number; end: number } | null {
  const fold = layout.regions.find((region) => region.kind === 'division');
  if (!fold) return null;
  return fold.height >= fold.width
    ? { axis: 'vertical', start: fold.x, end: fold.x + fold.width }
    : { axis: 'horizontal', start: fold.y, end: fold.y + fold.height };
}

/**
 * How far down the vertical bar's strip the page's own controls should start: below what the
 * system reserves at the top of that strip, the camera with the status bar beside it. 0 when
 * there's no vertical bar.
 */
export function barStartOf(layout: DeviceLayoutSnapshot): number {
  const side = layout.barEdge;
  if (!side) return 0;
  const middle = layout.width / 2;
  const inStrip = (rect: DeviceRect) =>
    side === 'right' ? rect.x + rect.width / 2 > middle : rect.x + rect.width / 2 < middle;
  return layout.regions
    .filter((region) => region.kind === 'occlusion' && inStrip(region))
    .reduce((bottom, rect) => Math.max(bottom, rect.y + rect.height), 0);
}

const px = (value: number) => `${Math.round(value * 100) / 100}px`;

/**
 * Follows the native layout and tells the stylesheet about it, so a page that draws its own bars
 * can follow the system's on devices like iPhone Duo:
 *
 * - `data-bar-edge="left"` or `"right"` on `<html>` while the system puts bars vertically on that
 *   side, with `--ldt-bar-start`, how far down the strip the page's controls can begin.
 * - `data-fold="vertical"` (or `"horizontal"`) while the device is partly open, with
 *   `--ldt-fold-start` and `--ldt-fold-end`, the band to keep controls out of.
 * - `data-hinge`, the hinge status, where the device has one.
 *
 * Needs the iOS plugin bundled with this package (run `cap sync` after installing) and iOS 27.1;
 * elsewhere nothing is written. A no-op in a browser.
 */
export function createDeviceLayout(options: DeviceLayoutOptions = {}): DeviceLayout {
  let current = $state<DeviceLayoutSnapshot | null>(null);
  let teardown = () => {};

  const root =
    options.element ?? (typeof document === 'undefined' ? null : document.documentElement);

  if (nativePlatform() === 'ios' && root) {
    const plugin = options.DeviceLayout ?? registerPlugin<DeviceLayoutPlugin>('DeviceLayout');

    const clear = () => {
      delete root.dataset.barEdge;
      delete root.dataset.fold;
      delete root.dataset.hinge;
      for (const name of ['--ldt-bar-start', '--ldt-fold-start', '--ldt-fold-end']) {
        root.style.removeProperty(name);
      }
    };

    const write = (layout: DeviceLayoutSnapshot) => {
      current = layout;
      clear();
      if (layout.barEdge) {
        root.dataset.barEdge = layout.barEdge;
        root.style.setProperty('--ldt-bar-start', px(barStartOf(layout)));
      }
      const fold = foldOf(layout);
      if (fold) {
        root.dataset.fold = fold.axis;
        root.style.setProperty('--ldt-fold-start', px(fold.start));
        root.style.setProperty('--ldt-fold-end', px(fold.end));
      }
      if (layout.hinge && layout.hinge.status !== 'unknown') {
        root.dataset.hinge = layout.hinge.status;
      }
    };

    let changed = false;
    const remove = listen(
      plugin.addListener('change', (layout) => {
        changed = true;
        write(layout);
      })
    );
    // An app built without the native half rejects here; the page then just keeps its layout.
    const initial = plugin.getLayout().then((layout) => {
      if (!changed) write(layout);
    });
    quietly(initial);

    teardown = combine(remove, clear);
  }

  const destroy = () => teardown();
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get current() {
      return current;
    },
    destroy,
  };
}
