/*
 * The slices of the Capacitor plugin APIs these adapters call. This package never imports a
 * plugin itself: you pass the one you installed (`import { App } from '@capacitor/app'`), so an
 * app pays only for the plugins it uses and a missing one is a type error rather than a runtime
 * crash. The real plugin objects satisfy these shapes; so does a test double.
 */

/** What `addListener` resolves to. */
export interface PluginListenerHandle {
  remove(): Promise<void>;
}

/** `@capacitor/app`, for the Android back button. */
export interface BackButtonPlugin {
  addListener(
    eventName: 'backButton',
    listener: (event: { canGoBack: boolean }) => void
  ): Promise<PluginListenerHandle>;
  exitApp(): Promise<void>;
  minimizeApp(): Promise<void>;
}

/** `@capacitor/app`, for foreground and background. */
export interface AppStatePlugin {
  addListener(
    eventName: 'appStateChange',
    listener: (state: { isActive: boolean }) => void
  ): Promise<PluginListenerHandle>;
}

/** `@capacitor/app`, for links that open the app. */
export interface AppUrlPlugin {
  addListener(
    eventName: 'appUrlOpen',
    listener: (event: { url: string }) => void
  ): Promise<PluginListenerHandle>;
}

/** `@capacitor/app`, for re-reading settings when the app comes back. */
export interface AppResumePlugin {
  addListener(eventName: 'resume', listener: () => void): Promise<PluginListenerHandle>;
}

/** `@capacitor/keyboard`. */
export interface KeyboardPlugin {
  addListener(
    eventName: 'keyboardWillShow',
    listener: (info: { keyboardHeight: number }) => void
  ): Promise<PluginListenerHandle>;
  addListener(eventName: 'keyboardDidShow', listener: () => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'keyboardWillHide', listener: () => void): Promise<PluginListenerHandle>;
  getResizeMode(): Promise<{ mode: string }>;
}

/** `@capacitor/keyboard`, for matching the keyboard to the colour scheme (iOS). */
export interface KeyboardStylePlugin {
  setStyle(options: { style: 'DARK' | 'LIGHT' | 'DEFAULT' }): Promise<void>;
}

/** `@capacitor/haptics`. */
export interface HapticsPlugin {
  impact(options?: { style: 'HEAVY' | 'MEDIUM' | 'LIGHT' }): Promise<void>;
  notification(options?: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }): Promise<void>;
  selectionStart(): Promise<void>;
  selectionChanged(): Promise<void>;
  selectionEnd(): Promise<void>;
}

/** `@capacitor/preferences`. */
export interface PreferencesPlugin {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
}

/** `@capacitor/splash-screen`. */
export interface SplashScreenPlugin {
  hide(options?: { fadeOutDuration?: number }): Promise<void>;
}

/** `@capacitor/network`. */
export interface NetworkPlugin {
  getStatus(): Promise<{ connected: boolean; connectionType: string }>;
  addListener(
    eventName: 'networkStatusChange',
    listener: (status: { connected: boolean; connectionType: string }) => void
  ): Promise<PluginListenerHandle>;
}

/** `@capacitor/browser`. */
export interface BrowserPlugin {
  open(options: {
    url: string;
    toolbarColor?: string;
    presentationStyle?: 'fullscreen' | 'popover';
  }): Promise<void>;
}

/** `@capacitor/status-bar` — only for Android without edge-to-edge, where it paints the bar. */
export interface StatusBarPlugin {
  setStyle(options: { style: 'DARK' | 'LIGHT' | 'DEFAULT' }): Promise<void>;
  setBackgroundColor(options: { color: string }): Promise<void>;
}

/** The `SystemBars` plugin bundled with `@capacitor/core` 8. */
export interface SystemBarsPlugin {
  setStyle(options: {
    style: 'DARK' | 'LIGHT' | 'DEFAULT';
    bar?: 'StatusBar' | 'NavigationBar';
  }): Promise<void>;
}

/** `@capacitor/text-zoom`. */
export interface TextZoomPlugin {
  getPreferred(): Promise<{ value: number }>;
  set(options: { value: number }): Promise<void>;
}

/** `@capacitor/clipboard`. */
export interface ClipboardPlugin {
  write(options: { string?: string }): Promise<void>;
}

/** Undoes whatever the adapter installed. Safe to call twice. */
export type Teardown = () => void;
