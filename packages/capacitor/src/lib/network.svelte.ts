import type { Toaster } from '@loidolt/theme-svelte';
import { onDestroy } from 'svelte';
import { listen, nativePlatform } from './platform.js';
import type { NetworkPlugin, Teardown } from './types.js';

export interface NetworkStatusOptions {
  /** `Network` from `@capacitor/network`. */
  Network: NetworkPlugin;
  /**
   * Announce going offline and coming back through this toaster. The offline toast stays until
   * the connection returns, then gives way to a brief "back online".
   */
  toaster?: Pick<Toaster, 'warning' | 'success' | 'dismiss'>;
  /** Toast wording. */
  labels?: { offline?: string; offlineDescription?: string; online?: string };
}

export interface NetworkStatus {
  /** Whether any connection is up. Reactive. */
  readonly connected: boolean;
  /** `wifi`, `cellular`, `none` or `unknown`. Reactive. */
  readonly type: string;
  destroy(): void;
}

/**
 * Connectivity as reactive state. The native plugin knows sooner and better than
 * `navigator.onLine`, which in a web view often reports `true` with no route out at all. Outside
 * a native shell it follows `navigator.onLine` and the `online`/`offline` events instead.
 */
export function createNetworkStatus(options: NetworkStatusOptions): NetworkStatus {
  const { Network, toaster, labels = {} } = options;
  const {
    offline: offlineTitle = 'You are offline',
    offlineDescription = 'Changes will sync when the connection returns.',
    online: onlineTitle = 'Back online',
  } = labels;

  const browser = typeof navigator !== 'undefined';
  let connected = $state(browser ? navigator.onLine !== false : true);
  let type = $state('unknown');
  let offlineToast: string | null = null;
  let teardown: Teardown = () => {};

  const update = (next: boolean, nextType: string) => {
    type = nextType;
    if (next === connected) return;
    connected = next;
    if (!toaster) return;
    if (!next) {
      offlineToast = toaster.warning(offlineTitle, {
        description: offlineDescription,
        duration: 0,
      });
    } else {
      if (offlineToast !== null) toaster.dismiss(offlineToast);
      offlineToast = null;
      toaster.success(onlineTitle, { duration: 4000 });
    }
  };

  if (nativePlatform()) {
    Network.getStatus().then(
      (status) => update(status.connected, status.connectionType),
      () => {}
    );
    teardown = listen(
      Network.addListener('networkStatusChange', (status) =>
        update(status.connected, status.connectionType)
      )
    );
  } else if (typeof window !== 'undefined') {
    const online = () => update(true, 'unknown');
    const offline = () => update(false, 'none');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    teardown = () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }

  const destroy = () => teardown();
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get connected() {
      return connected;
    },
    get type() {
      return type;
    },
    destroy,
  };
}
