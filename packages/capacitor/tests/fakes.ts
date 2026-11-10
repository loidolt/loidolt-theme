import { vi } from 'vitest';
import type { PickedNativeFile } from '../src/lib/types.js';

/**
 * Stand-ins for `@capacitor/core` and the plugins. `@capacitor/core` is mocked for every suite
 * (see setup.ts) so a test can pick the platform; plugins are plain objects with `vi.fn` methods
 * and an `emit` that fires their listeners the way the native bridge would.
 */

export const platform = { current: 'web' as 'web' | 'ios' | 'android' };

export const systemBars = {
  setStyle: vi.fn(async (_options: { style: string; bar?: string }) => {}),
};

export const core = {
  Capacitor: {
    isNativePlatform: () => platform.current !== 'web',
    getPlatform: () => platform.current,
    convertFileSrc: (path: string) => `capacitor://localhost/_capacitor_file_${path}`,
  },
  SystemBars: systemBars,
};

type Listener = (event?: any) => void;

/** An `addListener` that resolves a removable handle, plus `emit` and a live listener count. */
export function emitter() {
  const listeners = new Map<string, Set<Listener>>();
  const addListener = vi.fn(async (eventName: string, listener: Listener) => {
    const set = listeners.get(eventName) ?? new Set();
    set.add(listener);
    listeners.set(eventName, set);
    return {
      remove: vi.fn(async () => {
        set.delete(listener);
      }),
    };
  });
  return {
    addListener,
    emit(eventName: string, event?: unknown) {
      for (const listener of [...(listeners.get(eventName) ?? [])]) listener(event);
    },
    count(eventName: string) {
      return listeners.get(eventName)?.size ?? 0;
    },
  };
}

/** Lets pending promise callbacks — listener handles, plugin results — run. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export function fakeApp() {
  return {
    ...emitter(),
    exitApp: vi.fn(async () => {}),
    minimizeApp: vi.fn(async () => {}),
  };
}

export function fakeKeyboard(mode = 'native') {
  return {
    ...emitter(),
    getResizeMode: vi.fn(async () => ({ mode })),
    setStyle: vi.fn(async (_options: { style: string }) => {}),
  };
}

export function fakeHaptics() {
  return {
    impact: vi.fn(async (_options?: { style: string }) => {}),
    notification: vi.fn(async (_options?: { type: string }) => {}),
    selectionStart: vi.fn(async () => {}),
    selectionChanged: vi.fn(async () => {}),
    selectionEnd: vi.fn(async () => {}),
  };
}

export function fakePreferences(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    get: vi.fn(async ({ key }: { key: string }) => ({ value: store.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    }),
  };
}

export function fakeNetwork(connected = true) {
  return {
    ...emitter(),
    getStatus: vi.fn(async () => ({ connected, connectionType: connected ? 'wifi' : 'none' })),
  };
}

export function fakeToaster() {
  let counter = 0;
  return {
    warning: vi.fn((_title: string, _options?: unknown) => `toast-${++counter}`),
    success: vi.fn((_title: string, _options?: unknown) => `toast-${++counter}`),
    dismiss: vi.fn((_id: string) => {}),
  };
}

export function fakeShare(result: { activityType?: string } = {}) {
  return {
    canShare: vi.fn(async () => ({ value: true })),
    share: vi.fn(async (_options: Record<string, unknown>) => result),
  };
}

export function fakeFilePicker(files: PickedNativeFile[] = []) {
  return {
    pickFiles: vi.fn(async (_options?: { types?: string[]; limit?: number }) => ({ files })),
  };
}

/** A Filesystem that keeps what it is given, keyed `DIRECTORY/path`. */
export function fakeFilesystem(publicStorage = 'granted', afterRequest = publicStorage) {
  const files = new Map<string, string | Blob>();
  return {
    files,
    writeFile: vi.fn(async (options: { path: string; data: string | Blob; directory?: string }) => {
      const key = `${options.directory}/${options.path}`;
      files.set(key, options.data);
      return { uri: `file:///${key}` };
    }),
    rmdir: vi.fn(async ({ path, directory }: { path: string; directory?: string }) => {
      for (const key of [...files.keys()]) {
        if (key.startsWith(`${directory}/${path}/`)) files.delete(key);
      }
    }),
    stat: vi.fn(async ({ path, directory }: { path: string; directory?: string }) => {
      const key = `${directory}/${path}`;
      if (!files.has(key)) throw new Error('File does not exist');
      return { uri: `file:///${key}` };
    }),
    checkPermissions: vi.fn(async () => ({ publicStorage })),
    requestPermissions: vi.fn(async () => ({ publicStorage: afterRequest })),
  };
}
