import { vi } from 'vitest';

/**
 * Stand-ins for what a Tauri window injects. Nothing is mocked at the module level: the package
 * reads globals, so a test enters a window by setting them and `setup.ts` clears them after.
 */

type Agent = 'mac' | 'ipad' | 'iphone' | 'windows' | 'linux' | 'android';

const agents: Record<Agent, { userAgent: string; touch: number }> = {
  mac: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML)',
    touch: 0,
  },
  ipad: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML)',
    touch: 5,
  },
  iphone: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
    touch: 5,
  },
  windows: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Edg/140.0',
    touch: 0,
  },
  linux: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML)', touch: 0 },
  android: {
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0',
    touch: 5,
  },
};

/** Pretends the page runs in a Tauri window on the given OS. */
export function enterTauri(
  agent: Agent = 'mac',
  globals: 'internals' | 'flag' | 'both' = 'both'
): void {
  const scope = globalThis as Record<string, unknown>;
  if (globals !== 'flag') scope.__TAURI_INTERNALS__ = { invoke: vi.fn() };
  if (globals !== 'internals') scope.isTauri = true;
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(agents[agent].userAgent);
  // jsdom has no `maxTouchPoints` to spy on.
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    get: () => agents[agent].touch,
  });
}

/** Back to a plain browser. */
export function leaveTauri(): void {
  const scope = globalThis as Record<string, unknown>;
  delete scope.__TAURI_INTERNALS__;
  delete scope.isTauri;
  delete (navigator as { maxTouchPoints?: number }).maxTouchPoints;
  delete (window as { Notification?: unknown }).Notification;
  vi.restoreAllMocks();
}

/** `@tauri-apps/plugin-os`, reporting the given OS type. */
export function fakeOs(type: 'linux' | 'windows' | 'macos' | 'ios' | 'android' = 'macos') {
  return { type: vi.fn(() => type) };
}

/** `@tauri-apps/plugin-notification`, answering the permission question as told. */
export function fakeNotification(
  granted = true,
  answer: 'granted' | 'denied' | 'default' = 'granted'
) {
  return {
    isPermissionGranted: vi.fn(async () => granted),
    requestPermission: vi.fn(async () => answer),
    sendNotification: vi.fn(),
  };
}

/** Installs a Web Notifications API in the given state; `leaveTauri` removes it. */
export function fakeWebNotification(
  permission: 'granted' | 'denied' | 'default' = 'default',
  answer: 'granted' | 'denied' | 'default' = 'granted'
) {
  const shown: Array<{ title: string; options?: object }> = [];
  const api = vi.fn(function (this: unknown, title: string, options?: object) {
    shown.push({ title, options });
  }) as unknown as { permission: string; requestPermission: ReturnType<typeof vi.fn> };
  api.permission = permission;
  api.requestPermission = vi.fn(async () => {
    api.permission = answer;
    return answer;
  });
  (window as unknown as Record<string, unknown>).Notification = api;
  return { api, shown };
}

/** Lets pending promise callbacks run. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * The window from `getCurrentWindow()`. `resize()` fires the `onResized` handlers, after setting
 * what `isFullscreen()` reports.
 */
export function fakeWindow(options: { fullscreen?: boolean } = {}) {
  let fullscreen = options.fullscreen ?? false;
  const handlers = new Set<() => void>();
  const unlisten = vi.fn();
  return {
    setBackgroundColor: vi.fn(async (_color: string) => {}),
    setTheme: vi.fn(async (_theme?: 'light' | 'dark' | null) => {}),
    isFullscreen: vi.fn(async () => fullscreen),
    onResized: vi.fn(async (handler: () => void) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
        unlisten();
      };
    }),
    show: vi.fn(async () => {}),
    unlisten,
    resize(next: { fullscreen: boolean }) {
      fullscreen = next.fullscreen;
      for (const handler of handlers) handler();
    },
  };
}
