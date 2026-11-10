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

/** `@tauri-apps/api/event`, for events the Rust side emits. */
export interface EventModule {
  listen<T>(event: string, handler: (event: { payload: T }) => void): Promise<UnlistenFn>;
}

/** `@tauri-apps/plugin-deep-link`, for URLs that open the app. */
export interface DeepLinkPlugin {
  getCurrent(): Promise<string[] | null>;
  onOpenUrl(handler: (urls: string[]) => void): Promise<UnlistenFn>;
}

/** A path, PNG or ICO bytes, or an `Image` from `@tauri-apps/api/image`. */
export type TrayImage = string | Uint8Array | ArrayBuffer | number[] | object;

/** A menu or tray icon living on the Rust side; `close()` frees it. */
export interface TauriResource {
  close(): Promise<void>;
}

/** What the tray adapter puts in a menu: plain items and separators. */
export type TrayMenuEntry =
  | { id: string; text: string; enabled?: boolean; action?: (id: string) => void }
  | { item: 'Separator' | 'Quit' };

/** `@tauri-apps/api/menu`, for the tray's menu. */
export interface MenuModule {
  Menu: { 'new'(options?: { items?: TrayMenuEntry[] }): Promise<TauriResource> };
}

/** A tray icon from `@tauri-apps/api/tray`. */
export interface TrayIconHandle extends TauriResource {
  setIcon(icon: TrayImage | null): Promise<void>;
  setTooltip(tooltip: string | null): Promise<void>;
  setTitle(title: string | null): Promise<void>;
  setMenu(menu: TauriResource | null): Promise<void>;
}

/** `@tauri-apps/api/tray`. */
export interface TrayModule {
  TrayIcon: {
    'new'(options?: {
      id?: string;
      icon?: TrayImage;
      tooltip?: string;
      title?: string;
      menu?: TauriResource;
      iconAsTemplate?: boolean;
      showMenuOnLeftClick?: boolean;
      action?(event: { type: string; button?: string; buttonState?: string }): void;
    }): Promise<TrayIconHandle>;
  };
}
