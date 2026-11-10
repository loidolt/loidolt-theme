import { vi, type Mock } from 'vitest';

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

/* Files: the dialog and fs plugins and the web view's drag and drop event. */

/** `@tauri-apps/plugin-dialog`, answering every open and save with what it is told. */
export function fakeDialog(
  picked: string | string[] | null = null,
  savedTo: string | null = '/Users/sam/Documents/export.pdf'
) {
  return {
    open: vi.fn(async (_options?: Record<string, unknown>) => picked),
    save: vi.fn(async (_options?: Record<string, unknown>) => savedTo),
  };
}

/** `@tauri-apps/plugin-fs` over an in-memory disk of path → text. */
export function fakeFs(disk: Record<string, string> = {}) {
  const written = new Map<string, Uint8Array>();
  return {
    readFile: vi.fn(async (path: string) => {
      if (!(path in disk)) throw new Error(`No such file: ${path}`);
      return new TextEncoder().encode(disk[path]);
    }),
    writeFile: vi.fn(async (path: string, data: Uint8Array) => {
      written.set(path, data);
    }),
    written,
  };
}

/** The web view from `getCurrentWebview()`; `fire` stands in for an OS drag. */
export function fakeWebview() {
  let handler: ((event: { payload: unknown }) => void) | undefined;
  const unlisten = vi.fn();
  return {
    onDragDropEvent: vi.fn(async (next: (event: { payload: never }) => void) => {
      handler = next as (event: { payload: unknown }) => void;
      return unlisten;
    }),
    fire: (payload: unknown) => handler?.({ payload }),
    unlisten,
  };
}

/*
 * The menu bar: `@tauri-apps/api/menu` with `Menu`, `Submenu` and `MenuItem`, and the app and
 * window menu bars they are installed into.
 */

type FakeItem = {
  kind: 'item';
  text: string;
  enabled: boolean;
  accelerator: string | null;
  action?: (id: string) => void;
  setText: Mock<(text: string) => Promise<void>>;
  setEnabled: Mock<(enabled: boolean) => Promise<void>>;
  setAccelerator: Mock<(accelerator: string | null) => Promise<void>>;
  close: Mock<() => Promise<void>>;
};
type FakePredefined = { item: unknown; text?: string };
type FakeSubmenu = {
  kind: 'submenu';
  text: string;
  items: Array<FakeItem | FakePredefined>;
  setText: Mock<(text: string) => Promise<void>>;
  setAsWindowsMenuForNSApp: Mock<() => Promise<void>>;
  setAsHelpMenuForNSApp: Mock<() => Promise<void>>;
  close: Mock<() => Promise<void>>;
};
type FakeMenu = {
  name: string;
  items: FakeSubmenu[];
  setAsAppMenu: Mock<() => Promise<FakeMenu | null>>;
  setAsWindowMenu: Mock<() => Promise<FakeMenu | null>>;
  close: Mock<() => Promise<void>>;
};

/**
 * `@tauri-apps/api/menu` for the menu bar. `bar.app` and `bar.window` are what is installed;
 * `initial` starts as the app menu, as Tauri's default menu does on macOS. `bar.titles()` reads
 * the installed bar as headings and item texts, and `bar.click(text)` chooses an item.
 */
export function fakeMenuBar(options: { initial?: boolean } = {}) {
  const menus: FakeMenu[] = [];
  const items: FakeItem[] = [];
  const submenus: FakeSubmenu[] = [];
  const bar: { app: FakeMenu | null; window: FakeMenu | null } = { app: null, window: null };

  const newMenu = (name: string, list: FakeSubmenu[]): FakeMenu => {
    const menu: FakeMenu = {
      name,
      items: list,
      setAsAppMenu: vi.fn(async () => {
        const replaced = bar.app;
        bar.app = menu;
        return replaced;
      }),
      setAsWindowMenu: vi.fn(async () => {
        const replaced = bar.window;
        bar.window = menu;
        return replaced;
      }),
      close: vi.fn(async () => {}),
    };
    return menu;
  };
  const initial = options.initial ? newMenu('initial', []) : null;
  bar.app = initial;

  const module = {
    Menu: {
      new: vi.fn(async (opts?: { items?: unknown[] }) => {
        const menu = newMenu(`menu-${menus.length}`, (opts?.items ?? []) as FakeSubmenu[]);
        menus.push(menu);
        return menu;
      }),
    },
    Submenu: {
      new: vi.fn(async (opts: { text: string; items?: unknown[] }) => {
        const submenu: FakeSubmenu = {
          kind: 'submenu',
          text: opts.text,
          items: (opts.items ?? []) as FakeSubmenu['items'],
          setText: vi.fn(async (text: string) => {
            submenu.text = text;
          }),
          setAsWindowsMenuForNSApp: vi.fn(async () => {}),
          setAsHelpMenuForNSApp: vi.fn(async () => {}),
          close: vi.fn(async () => {}),
        };
        submenus.push(submenu);
        return submenu;
      }),
    },
    MenuItem: {
      new: vi.fn(
        async (opts: {
          text: string;
          enabled?: boolean;
          accelerator?: string;
          action?: (id: string) => void;
        }) => {
          const item: FakeItem = {
            kind: 'item',
            text: opts.text,
            enabled: opts.enabled ?? true,
            accelerator: opts.accelerator ?? null,
            action: opts.action,
            setText: vi.fn(async (text: string) => {
              item.text = text;
            }),
            setEnabled: vi.fn(async (enabled: boolean) => {
              item.enabled = enabled;
            }),
            setAccelerator: vi.fn(async (accelerator: string | null) => {
              item.accelerator = accelerator;
            }),
            close: vi.fn(async () => {}),
          };
          items.push(item);
          return item;
        }
      ),
    },
  };

  const label = (entry: FakeItem | FakePredefined) =>
    'kind' in entry
      ? entry.text
      : `<${typeof entry.item === 'string' ? entry.item : Object.keys(entry.item as object)[0]}${entry.text ? `:${entry.text}` : ''}>`;

  const installed = (where: 'app' | 'window' = 'app') => bar[where];

  return {
    menu: module,
    bar,
    initial,
    menus,
    items,
    submenus,
    /** The installed bar as `{ heading: [item, …] }`, predefined items as `<Name>`. */
    titles(where: 'app' | 'window' = 'app') {
      const menu = installed(where);
      return menu
        ? Object.fromEntries(menu.items.map((sub) => [sub.text, sub.items.map(label)]))
        : null;
    },
    /** The installed item with this text. */
    item(text: string, where: 'app' | 'window' = 'app') {
      for (const sub of installed(where)?.items ?? []) {
        for (const entry of sub.items) if ('kind' in entry && entry.text === text) return entry;
      }
      return undefined;
    },
    /** Chooses the installed item with this text, as a click or its accelerator would. */
    click(text: string, where: 'app' | 'window' = 'app') {
      const entry = this.item(text, where);
      if (!entry) throw new Error(`no menu item "${text}"`);
      entry.action?.(text);
    },
  };
}
