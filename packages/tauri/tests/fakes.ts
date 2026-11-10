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
  vi.restoreAllMocks();
}

/** `@tauri-apps/plugin-os`, reporting the given OS type. */
export function fakeOs(type: 'linux' | 'windows' | 'macos' | 'ios' | 'android' = 'macos') {
  return { type: vi.fn(() => type) };
}

/** `@tauri-apps/api/event`, with `emit` standing in for Rust. */
export function fakeEvent() {
  const handlers = new Map<string, Array<(event: { payload: unknown }) => void>>();
  const unlisten = vi.fn();
  const listen = vi.fn(async (name: string, handler: (event: { payload: unknown }) => void) => {
    handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    return () => {
      unlisten(name);
      handlers.set(
        name,
        (handlers.get(name) ?? []).filter((h) => h !== handler)
      );
    };
  });
  const emit = (name: string, payload: unknown) => {
    for (const handler of handlers.get(name) ?? []) handler({ payload });
  };
  return { listen, emit, unlisten };
}

/** `@tauri-apps/plugin-deep-link`, launched by `current`; `open` delivers a link while running. */
export function fakeDeepLink(current: string[] | null = null) {
  let handler: ((urls: string[]) => void) | undefined;
  const unlisten = vi.fn();
  return {
    getCurrent: vi.fn(async () => current),
    onOpenUrl: vi.fn(async (next: (urls: string[]) => void) => {
      handler = next;
      return unlisten;
    }),
    open: (...urls: string[]) => handler?.(urls),
    unlisten,
  };
}

/** `@tauri-apps/api/tray` and `@tauri-apps/api/menu`, keeping what was created. */
export function fakeTrayModules() {
  const menus: Array<{ items: unknown[]; close: ReturnType<typeof vi.fn> }> = [];
  const icons: Array<{
    options: Record<string, unknown>;
    close: ReturnType<typeof vi.fn>;
    setIcon: ReturnType<typeof vi.fn>;
    setTooltip: ReturnType<typeof vi.fn>;
    setTitle: ReturnType<typeof vi.fn>;
    setMenu: ReturnType<typeof vi.fn>;
  }> = [];
  const menu = {
    Menu: {
      new: vi.fn(async (options?: { items?: unknown[] }) => {
        const created = { items: options?.items ?? [], close: vi.fn(async () => {}) };
        menus.push(created);
        return created;
      }),
    },
  };
  const tray = {
    TrayIcon: {
      new: vi.fn(async (options: Record<string, unknown> = {}) => {
        const created = {
          options,
          close: vi.fn(async () => {}),
          setIcon: vi.fn(async () => {}),
          setTooltip: vi.fn(async () => {}),
          setTitle: vi.fn(async () => {}),
          setMenu: vi.fn(async () => {}),
        };
        icons.push(created);
        return created;
      }),
    },
  };
  return { tray, menu, menus, icons };
}

/** Lets pending promise callbacks run. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
