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

/* Files: native dialogs, reading and writing, and drops on the window. */

/** A file type filter in a native dialog: a name and the extensions it lets through, no dots. */
export interface DialogFilter {
  name: string;
  extensions: string[];
}

/**
 * `@tauri-apps/plugin-dialog`, for the native open and save dialogs (`dialog:default`, or
 * `dialog:allow-open` and `dialog:allow-save`). The paths it returns are added to the fs scope.
 */
export interface DialogPlugin {
  open(options?: {
    title?: string;
    filters?: DialogFilter[];
    defaultPath?: string;
    multiple?: boolean;
    directory?: boolean;
  }): Promise<string | string[] | null>;
  save(options?: {
    title?: string;
    filters?: DialogFilter[];
    defaultPath?: string;
  }): Promise<string | null>;
}

/**
 * `@tauri-apps/plugin-fs`, for reading picked and dropped files (`fs:allow-read-file`) and writing
 * saved ones (`fs:allow-write-file`).
 */
export interface FsPlugin {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
}

/** A point in the window, in physical pixels. */
export interface PhysicalPoint {
  x: number;
  y: number;
}

/** What the web view's drag and drop event carries: Tauri's `DragDropEvent`. */
export type DragDropPayload =
  | { type: 'enter'; paths: string[]; position: PhysicalPoint }
  | { type: 'over'; position: PhysicalPoint }
  | { type: 'drop'; paths: string[]; position: PhysicalPoint }
  | { type: 'leave' };

/**
 * The web view the page runs in: what `getCurrentWebview()` from `@tauri-apps/api/webview`
 * returns. Its drag and drop event is in `core:default`.
 */
export interface WebviewPlugin {
  onDragDropEvent(handler: (event: { payload: DragDropPayload }) => void): Promise<UnlistenFn>;
}

/*
 * The native menu bar. The same `@tauri-apps/api/menu` module as the tray's, with the pieces the
 * menu bar builds from on top; the real module has them all.
 */

/** A built-in item the OS provides and handles itself: the clipboard, Quit, Hide and the rest. */
export type PredefinedMenuItemName =
  | 'Separator'
  | 'Copy'
  | 'Cut'
  | 'Paste'
  | 'SelectAll'
  | 'Undo'
  | 'Redo'
  | 'Minimize'
  | 'Maximize'
  | 'Fullscreen'
  | 'Hide'
  | 'HideOthers'
  | 'ShowAll'
  | 'CloseWindow'
  | 'Quit'
  | 'Services'
  | 'BringAllToFront'
  | 'About';

/** A menu item from `MenuItem.new`, changed in place. */
export interface MenuItemHandle extends TauriResource {
  setText(text: string): Promise<void>;
  setEnabled(enabled: boolean): Promise<void>;
  setAccelerator(accelerator: string | null): Promise<void>;
}

/** A submenu from `Submenu.new`: one heading of the menu bar. */
export interface SubmenuHandle extends TauriResource {
  setText(text: string): Promise<void>;
  /** macOS: makes it the menu that lists the open windows. */
  setAsWindowsMenuForNSApp?(): Promise<void>;
  /** macOS: makes it the Help menu, with the system's search field. */
  setAsHelpMenuForNSApp?(): Promise<void>;
}

/** A menu from `Menu.new` that can become the menu bar. Each call returns the menu it replaced. */
export interface AppMenuHandle extends TauriResource {
  setAsAppMenu(): Promise<AppMenuHandle | null>;
  setAsWindowMenu(): Promise<AppMenuHandle | null>;
}

/**
 * `@tauri-apps/api/menu`, for the menu bar. Items go in as Tauri builds them (an item from
 * `MenuItem.new`, or the options of a predefined one), so they are typed loosely here.
 */
export interface MenuBarModule extends MenuModule {
  Menu: { 'new'(options?: { items?: unknown[] }): Promise<AppMenuHandle> };
  Submenu: { 'new'(options: { text: string; items?: unknown[] }): Promise<SubmenuHandle> };
  MenuItem: {
    'new'(options: {
      text: string;
      enabled?: boolean;
      accelerator?: string;
      action?: (id: string) => void;
    }): Promise<MenuItemHandle>;
  };
}
