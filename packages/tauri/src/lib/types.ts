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
