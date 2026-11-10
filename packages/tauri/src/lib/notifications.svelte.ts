import { onDestroy } from 'svelte';
import { isTauri } from './platform.js';
import type { NotificationPlugin } from './types.js';

/**
 * Whether the app may notify: `'granted'`, `'denied'`, `'default'` (not asked yet), or
 * `'unsupported'` where there is no way to notify at all (the server, an old browser, a web view
 * without the API).
 */
export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/** Where notifications go: the OS through the Tauri plugin, the Web Notifications API, or nowhere. */
export type NotificationBackend = 'tauri' | 'web' | 'none';

export interface NotifyOptions {
  title: string;
  body?: string;
  /** An icon URL or path. The OS may ignore it and show the app's own icon. */
  icon?: string;
  /** No sound. */
  silent?: boolean;
}

/** The slice of the theme's `Toaster` the fallback calls. `createToaster()` fits it. */
export interface NotificationToaster {
  info(title: string, options?: { description?: string }): unknown;
}

export interface NotificationsOptions {
  /** `@tauri-apps/plugin-notification`, for OS notifications from Rust inside a Tauri window. */
  plugin?: NotificationPlugin;
  /**
   * Shows a notification as an in-app toast when it cannot reach the OS: permission denied or not
   * yet given, or no notification API at all. `notify()` still resolves `false` then.
   */
  toaster?: NotificationToaster;
}

export interface Notifications {
  /** Where notifications go. Fixed once created. */
  readonly backend: NotificationBackend;
  /** Reactive. Starts as the best synchronous guess and settles by {@link ready}. */
  readonly permission: NotificationPermissionState;
  /** Settles once the permission has been read (one round trip to Rust inside Tauri). */
  readonly ready: Promise<void>;
  /**
   * Asks the user, if they have not answered yet, and resolves the resulting state. Never
   * throws. In a browser call it from a click or key handler: browsers ignore or block a prompt
   * that no user gesture asked for.
   */
  requestPermission(): Promise<NotificationPermissionState>;
  /**
   * Shows a notification when permission is granted and resolves whether it reached the OS. It
   * never prompts, so it is safe to call from background work; ask first with
   * {@link requestPermission}. With a `toaster`, anything it cannot show becomes a toast.
   */
  notify(options: NotifyOptions): Promise<boolean>;
  destroy(): void;
}

type WebPermission = 'granted' | 'denied' | 'default';

interface WebNotificationConstructor {
  readonly permission: WebPermission;
  requestPermission(): Promise<WebPermission>;
  new (title: string, options?: { body?: string; icon?: string; silent?: boolean }): unknown;
}

/** The Web Notifications API, when this page has it. */
function webNotification(): WebNotificationConstructor | null {
  if (typeof window === 'undefined') return null;
  const api = (window as { Notification?: WebNotificationConstructor }).Notification;
  return typeof api === 'function' ? api : null;
}

const asState = (value: unknown): NotificationPermissionState =>
  value === 'granted' || value === 'denied' ? value : 'default';

/**
 * OS notifications with the permission flow handled. Inside a Tauri window with
 * `@tauri-apps/plugin-notification` they come from Rust; in a browser, or a window without the
 * plugin, from the Web Notifications API; with neither, `notify()` resolves `false` (or shows a
 * toast, given a `toaster`). A denied permission never throws.
 *
 * ```ts
 * const notifications = createNotifications({ plugin: notification, toaster });
 * // on a button: await notifications.requestPermission();
 * // later, from anywhere:
 * notifications.notify({ title: 'Export finished', body: 'The file is in Downloads.' });
 * ```
 */
export function createNotifications(options: NotificationsOptions = {}): Notifications {
  const { plugin, toaster } = options;
  const web = webNotification();
  const backend: NotificationBackend = plugin && isTauri() ? 'tauri' : web ? 'web' : 'none';

  let permission = $state<NotificationPermissionState>(
    backend === 'none' ? 'unsupported' : asState(web?.permission)
  );
  let destroyed = false;
  const settle = (next: NotificationPermissionState) => {
    if (!destroyed) permission = next;
    return next;
  };

  let ready = Promise.resolve();
  if (backend === 'tauri') {
    ready = plugin!.isPermissionGranted().then(
      (granted) => {
        // `false` means denied or not asked; the web view's own state tells them apart.
        settle(granted ? 'granted' : asState(web?.permission));
      },
      () => {
        /* the plugin is installed in JS but not registered in Rust */
      }
    );
  }

  async function requestPermission(): Promise<NotificationPermissionState> {
    if (backend === 'none') return permission;
    await ready;
    if (permission !== 'default') return permission;
    try {
      const answer = backend === 'tauri' ? plugin!.requestPermission() : web!.requestPermission();
      return settle(asState(await answer));
    } catch {
      return permission;
    }
  }

  function show({ title, body, icon, silent }: NotifyOptions): boolean {
    try {
      if (backend === 'tauri') plugin!.sendNotification({ title, body, icon, silent });
      else if (backend === 'web') new web!(title, { body, icon, silent });
      else return false;
      return true;
    } catch {
      // Android Chrome, for one, only notifies through a service worker.
      return false;
    }
  }

  async function notify(notification: NotifyOptions): Promise<boolean> {
    await ready;
    const shown = !destroyed && permission === 'granted' && show(notification);
    if (!shown && !destroyed && toaster) {
      toaster.info(notification.title, { description: notification.body });
    }
    return shown;
  }

  const destroy = () => {
    destroyed = true;
  };
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    backend,
    get permission() {
      return permission;
    },
    ready,
    requestPermission,
    notify,
    destroy,
  };
}
