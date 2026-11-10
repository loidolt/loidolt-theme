/*
 * The slices of the Tauri APIs these adapters call. This package never imports `@tauri-apps/api`
 * or a plugin itself: you pass the module you installed (`import * as os from
 * '@tauri-apps/plugin-os'`), so an app pays only for what it uses, the browser and server builds
 * never load the Tauri runtime, and a missing piece is a type error rather than a runtime crash.
 * The real modules satisfy these shapes; so does a test double.
 */

/** Undoes whatever the adapter installed. Safe to call twice. */
export type Teardown = () => void;

/** What every Tauri `listen`, `onOpenUrl` or `on…Event` resolves to. */
export type UnlistenFn = () => void;

/** `@tauri-apps/plugin-os`, for telling macOS from the rest without sniffing the user agent. */
export interface OsPlugin {
  type(): 'linux' | 'windows' | 'macos' | 'ios' | 'android';
}

/** A window appearance as Tauri names it; `null` hands it back to the OS. */
export type WindowTheme = 'light' | 'dark';

/**
 * The window the page runs in: what `getCurrentWindow()` from `@tauri-apps/api/window` returns.
 * `setupTauri` also takes the function itself, `plugins: { window: getCurrentWindow }`. Each call needs its permission in the
 * capability file: `core:window:allow-set-background-color`, `core:window:allow-set-theme` and
 * `core:window:allow-show` (`isFullscreen` and `onResized` are in `core:window:default`).
 */
export interface WindowPlugin {
  /** The colour the window shows before the page paints and behind a transparent one. */
  setBackgroundColor(color: string): Promise<void>;
  /** The window's light or dark appearance; `null` follows the OS. */
  setTheme(theme?: WindowTheme | null): Promise<void>;
  isFullscreen(): Promise<boolean>;
  /** Fires on every resize, entering and leaving full screen included. */
  onResized(handler: () => void): Promise<UnlistenFn>;
  show(): Promise<void>;
}

/** `@tauri-apps/plugin-notification`, for OS notifications sent from Rust. */
export interface NotificationPlugin {
  isPermissionGranted(): Promise<boolean>;
  requestPermission(): Promise<'granted' | 'denied' | 'default'>;
  sendNotification(options: {
    title: string;
    body?: string;
    icon?: string;
    silent?: boolean;
  }): void;
}
