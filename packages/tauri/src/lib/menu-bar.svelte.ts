import {
  matchesShortcut,
  toAccelerator,
  type Commands,
  type ParsedShortcut,
  type RegisteredCommand,
} from '@loidolt/theme-svelte';
import { untrack } from 'svelte';
import { isTauri, quietly, tauriPlatform } from './platform.js';
import type {
  AppMenuHandle,
  MenuBarModule,
  MenuItemHandle,
  MenuModule,
  OsPlugin,
  PredefinedMenuItemName,
  SubmenuHandle,
  TauriResource,
} from './types.js';

/** The desktop systems with a menu bar. */
export type MenuBarPlatform = 'macos' | 'windows' | 'linux';

/** One line of a menu: a registry command by id, an item the OS provides, or a rule. */
export type MenuBarEntry =
  { command: string } | { predefined: PredefinedMenuItemName; label?: string } | 'separator';

/** One heading of the menu bar and what drops down from it. */
export interface MenuBarMenu {
  /**
   * `'app'`, `'edit'`, `'window'` and `'help'` for the standard menus, `'commands'` for commands
   * registered without a group, and `group:<name>` for every other group.
   */
  id: string;
  label: string;
  items: MenuBarEntry[];
}

/** Every string the menu bar shows that is not a command label, for translation. */
export interface MenuBarLabels {
  /** The standard Edit menu, and the registry group it takes in. Default `'Edit'`. */
  edit?: string;
  /** The standard Window menu, and the registry group it takes in. Default `'Window'`. */
  window?: string;
  /** The registry group placed before Edit on macOS. Default `'File'`. */
  file?: string;
  /** The registry group placed last on macOS, as the system Help menu. Default `'Help'`. */
  help?: string;
  /** The menu for commands registered without a group. Default `'Commands'`. */
  commands?: string;
  /**
   * The built-in items. Unset, each keeps the text Tauri gives it ("About", "Hide Others",
   * "Select All", …).
   */
  about?: string;
  services?: string;
  hide?: string;
  hideOthers?: string;
  showAll?: string;
  quit?: string;
  undo?: string;
  redo?: string;
  cut?: string;
  copy?: string;
  paste?: string;
  selectAll?: string;
  minimize?: string;
  maximize?: string;
  fullscreen?: string;
  closeWindow?: string;
  bringAllToFront?: string;
}

export interface MenuBarLayoutContext {
  platform: MenuBarPlatform;
  commands: Commands;
}

export interface MenuBarOptions {
  /** `@tauri-apps/api/menu`. */
  menu: MenuBarModule;
  /** The registry the menus are built from: one menu per group, in order. */
  commands: Commands;
  /** macOS: the name in the app menu's About item. */
  appName?: string;
  /** macOS: the app menu (About, Services, Hide, Quit) first. On by default. */
  appMenu?: boolean;
  /**
   * macOS: an Edit menu with Undo, Redo, Cut, Copy, Paste and Select All. On by default: without
   * it the clipboard shortcuts do nothing in a macOS web view. A registry group named Edit joins
   * it.
   */
  editMenu?: boolean;
  /** macOS: a Window menu with Minimize, Zoom and Close Window. On by default. */
  windowMenu?: boolean;
  /**
   * Rearranges the menus before they are built: moves a command into the app menu, drops a
   * group, adds a predefined item. Receives a fresh copy each time, which it may change and
   * return. Reactive state it reads is tracked.
   */
  layout?: (menus: MenuBarMenu[], context: MenuBarLayoutContext) => MenuBarMenu[];
  labels?: MenuBarLabels;
  /**
   * Windows and Linux, where a menu bar belongs to a window: `'window'` (the default) puts it on
   * the window this page runs in, `'app'` on every window that has no menu of its own. macOS has
   * one menu bar for the app and always takes `'app'`.
   */
  target?: 'app' | 'window';
  /** Where to build a menu bar. Default all three; `['macos']` keeps Windows and Linux bare. */
  platforms?: readonly MenuBarPlatform[];
  /** How long changes are gathered before the menu is touched, in ms. Default 16. */
  debounce?: number;
}

export interface MenuBar {
  /** Settles once the first menu bar is in place (or failed to get there). Never rejects. */
  readonly ready: Promise<void>;
  /**
   * Re-reads the registry now: for an `enabled` that depends on something other than Svelte
   * state. Changes to the registry and to `$state` are picked up on their own.
   */
  refresh(): Promise<void>;
  /** Puts back the menu bar that was there before, and frees this one. Safe to call twice. */
  destroy(): void;
}

const inert: MenuBar = { ready: Promise.resolve(), refresh: async () => {}, destroy() {} };

/** Whether the module passed as `plugins.menu` can build a menu bar, not just a tray menu. */
export function isMenuBarModule(menu: MenuModule): menu is MenuBarModule {
  const pieces = menu as Partial<MenuBarModule>;
  return typeof pieces.Submenu?.new === 'function' && typeof pieces.MenuItem?.new === 'function';
}

/**
 * The accelerator a native menu shows for a command: its first shortcut, if it is a chord or a
 * function key. A plain key (`?`, `J`, `Shift+N`, an arrow) is left to the page: as an
 * accelerator it would fire while the user types.
 */
export function menuAccelerator(command: Pick<RegisteredCommand, 'shortcuts'>): string | null {
  const first: ParsedShortcut | undefined = command.shortcuts[0];
  if (!first) return null;
  const chord = first.mod || first.ctrl || first.meta || first.alt || /^F\d{1,2}$/.test(first.key);
  return chord ? toAccelerator(first) : null;
}

const LABEL_KEYS: Partial<Record<PredefinedMenuItemName, keyof MenuBarLabels>> = {
  About: 'about',
  Services: 'services',
  Hide: 'hide',
  HideOthers: 'hideOthers',
  ShowAll: 'showAll',
  Quit: 'quit',
  Undo: 'undo',
  Redo: 'redo',
  Cut: 'cut',
  Copy: 'copy',
  Paste: 'paste',
  SelectAll: 'selectAll',
  Minimize: 'minimize',
  Maximize: 'maximize',
  Fullscreen: 'fullscreen',
  CloseWindow: 'closeWindow',
  BringAllToFront: 'bringAllToFront',
};

const predefined = (names: Array<PredefinedMenuItemName | '-'>): MenuBarEntry[] =>
  names.map((name) => (name === '-' ? 'separator' : { predefined: name }));

/** The menus a registry makes before `layout` sees them. */
function defaultMenus(
  commands: Commands,
  platform: MenuBarPlatform,
  options: Pick<MenuBarOptions, 'appName' | 'appMenu' | 'editMenu' | 'windowMenu'>,
  labels: Required<Pick<MenuBarLabels, 'edit' | 'window' | 'file' | 'help' | 'commands'>>
): MenuBarMenu[] {
  const groups: MenuBarMenu[] = commands.groups().map(({ group, commands: list }) => ({
    id: group === undefined ? 'commands' : `group:${group}`,
    label: group ?? labels.commands,
    items: list.map((command) => ({ command: command.id })),
  }));
  if (platform !== 'macos') return groups;

  // The macOS order: app, File, Edit, the rest, Window, Help.
  const take = (label: string) => {
    const index = groups.findIndex((menu) => menu.id === `group:${label}`);
    return index === -1 ? undefined : groups.splice(index, 1)[0];
  };
  const file = take(labels.file);
  const edit = take(labels.edit);
  const window = take(labels.window);
  const help = take(labels.help);
  const joined = (
    id: string,
    label: string,
    standard: MenuBarEntry[] | false,
    group: MenuBarMenu | undefined
  ): MenuBarMenu[] =>
    standard || group
      ? [
          {
            id,
            label,
            items: [
              ...(standard || []),
              ...(standard && group ? ['separator' as const] : []),
              ...(group?.items ?? []),
            ],
          },
        ]
      : [];

  return [
    ...(options.appMenu !== false
      ? [
          {
            id: 'app',
            label: options.appName ?? '',
            items: predefined([
              'About',
              '-',
              'Services',
              '-',
              'Hide',
              'HideOthers',
              'ShowAll',
              '-',
              'Quit',
            ]),
          },
        ]
      : []),
    ...(file ? [file] : []),
    ...joined(
      'edit',
      labels.edit,
      options.editMenu !== false &&
        predefined(['Undo', 'Redo', '-', 'Cut', 'Copy', 'Paste', 'SelectAll']),
      edit
    ),
    ...groups,
    ...joined(
      'window',
      labels.window,
      options.windowMenu !== false && predefined(['Minimize', 'Maximize', '-', 'CloseWindow']),
      window
    ),
    ...(help ? [{ ...help, id: 'help' }] : []),
  ];
}

type PlannedItem =
  | { kind: 'command'; id: string; text: string; enabled: boolean; accelerator: string | null }
  | { kind: 'predefined'; item: PredefinedMenuItemName; text: string | undefined }
  | { kind: 'separator' };

interface PlannedMenu {
  id: string;
  text: string;
  items: PlannedItem[];
}

interface Plan {
  /** What forces a rebuild: the menus, and which item sits where. */
  structure: string;
  menus: PlannedMenu[];
}

/** `&` marks a mnemonic in every native menu; `&&` is a literal one. */
const escape = (text: string) => text.replaceAll('&', '&&');

/** Separators only between items: none leading, trailing or doubled. */
function tidy(items: PlannedItem[]): PlannedItem[] {
  const result: PlannedItem[] = [];
  for (const item of items) {
    if (item.kind === 'separator' && (!result.length || result.at(-1)!.kind === 'separator')) {
      continue;
    }
    result.push(item);
  }
  if (result.at(-1)?.kind === 'separator') result.pop();
  return result;
}

function plan(menus: MenuBarMenu[], commands: Commands, labels: MenuBarLabels): Plan {
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping, never rendered
  const seen = new Set<string>();
  const planned: PlannedMenu[] = [];
  for (const menu of menus) {
    const items = tidy(
      menu.items.flatMap((entry): PlannedItem[] => {
        if (entry === 'separator') return [{ kind: 'separator' }];
        if ('predefined' in entry) {
          const key = LABEL_KEYS[entry.predefined];
          return [
            {
              kind: 'predefined',
              item: entry.predefined,
              text: entry.label ?? (key ? labels[key] : undefined),
            },
          ];
        }
        const command = commands.get(entry.command);
        // A command placed twice is built once: one native item has one place.
        if (!command || seen.has(command.id)) return [];
        seen.add(command.id);
        return [
          {
            kind: 'command',
            id: command.id,
            text: escape(command.label),
            enabled: commands.isEnabled(command.id),
            accelerator: menuAccelerator(command),
          },
        ];
      })
    );
    if (items.length) planned.push({ id: menu.id, text: escape(menu.label), items });
  }
  const structure = JSON.stringify(
    planned.map((menu) => [
      menu.id,
      menu.items.map((item) =>
        item.kind === 'command'
          ? `c:${item.id}`
          : item.kind === 'predefined'
            ? `p:${item.item}:${item.text ?? ''}`
            : '-'
      ),
    ])
  );
  return { structure, menus: planned };
}

interface Built {
  plan: Plan;
  menu: AppMenuHandle;
  submenus: Array<{ id: string; text: string; handle: SubmenuHandle }>;
  items: Map<string, { state: Extract<PlannedItem, { kind: 'command' }>; handle: MenuItemHandle }>;
}

/**
 * How long a keystroke the page handled and a menu action for the same command count as one:
 * well past the round trip a menu action takes to reach the page.
 */
const SAME_KEYSTROKE_MS = 500;
/**
 * The other way round, a menu action and then the keydown, is kept short: a second press of the
 * same chord a moment later is a press of its own.
 */
const MENU_THEN_KEY_MS = 100;

/**
 * The native menu bar, built from a command registry: one menu per group, in registration order,
 * each command an item with its label, its first shortcut as the accelerator, and its enabled
 * state, all kept in step with the registry. Choosing an item runs the command. On macOS the
 * standard app, Edit and Window menus are added around them, so About, Hide, Quit and the
 * clipboard shortcuts work as in any Mac app.
 *
 * ```ts
 * import * as menu from '@tauri-apps/api/menu';
 * const bar = createMenuBar({ menu, commands, appName: 'Notes' });
 * ```
 *
 * A keystroke runs its command once: the page's shortcut listener and the menu accelerator never
 * both act on the same key. A no-op outside a Tauri desktop window.
 */
export function createMenuBar(options: MenuBarOptions, os?: OsPlugin): MenuBar {
  if (!isTauri()) return inert;
  const platform = tauriPlatform(os);
  const allowed = options.platforms ?? ['macos', 'windows', 'linux'];
  if (platform !== 'macos' && platform !== 'windows' && platform !== 'linux') return inert;
  if (!allowed.includes(platform)) return inert;

  const { menu: module, commands, layout, debounce = 16 } = options;
  const labels: MenuBarLabels = options.labels ?? {};
  const names = {
    edit: labels.edit ?? 'Edit',
    window: labels.window ?? 'Window',
    file: labels.file ?? 'File',
    help: labels.help ?? 'Help',
    commands: labels.commands ?? 'Commands',
  };
  const mac = platform === 'macos';
  const asApp = mac || options.target === 'app';
  const install = (target: AppMenuHandle) =>
    asApp ? target.setAsAppMenu() : target.setAsWindowMenu();

  const resolve = (): Plan => {
    const menus = defaultMenus(commands, platform, options, names);
    return plan(layout ? layout(menus, { platform, commands }) : menus, commands, labels);
  };

  let destroyed = false;
  let built: Built | null = null;
  /** The menu bar before ours: `undefined` until ours went in, `null` if there was none. */
  let previous: AppMenuHandle | null | undefined;
  let latest: Plan | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | null = null;
  let again = false;

  // --- One keystroke, one run ---------------------------------------------------------------
  // On macOS the web view sees a key first and hands the menu only what the page left alone, so
  // the registry's `preventDefault` already keeps the accelerator from firing. Other web views
  // may deliver both, in either order; these two records catch whichever comes second.
  let lastKey: { event: KeyboardEvent; at: number } | null = null;
  let lastMenuRun: { id: string; at: number } | null = null;

  const sameKey = (event: KeyboardEvent, id: string) => {
    const shortcut = commands.get(id)?.shortcuts[0];
    return Boolean(shortcut && matchesShortcut(event, shortcut, commands.platform));
  };

  const onKeydown = (event: KeyboardEvent) => {
    const now = Date.now();
    if (lastMenuRun && now - lastMenuRun.at < MENU_THEN_KEY_MS && sameKey(event, lastMenuRun.id)) {
      // The menu already ran this keystroke's command: keep the registry's listener off it.
      lastMenuRun = null;
      event.preventDefault();
      return;
    }
    lastKey = { event, at: now };
  };
  // Capture, so this runs before the registry's own listener on `window` or anything inside.
  window.addEventListener('keydown', onKeydown, true);

  const run = (id: string) => {
    if (destroyed) return;
    const now = Date.now();
    if (
      lastKey &&
      now - lastKey.at < SAME_KEYSTROKE_MS &&
      lastKey.event.defaultPrevented &&
      sameKey(lastKey.event, id)
    ) {
      // The page's listener already ran it for this keystroke.
      lastKey = null;
      return;
    }
    lastMenuRun = { id, at: now };
    commands.execute(id);
  };

  // --- Building and updating ---------------------------------------------------------------
  const release = (resource: TauriResource | null | undefined) => {
    if (resource) quietly(resource.close());
  };
  const releaseBuilt = (target: Built | null) => {
    if (!target) return;
    for (const { handle } of target.items.values()) release(handle);
    for (const { handle } of target.submenus) release(handle);
    release(target.menu);
  };

  async function build(next: Plan): Promise<Built> {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- native handles, never rendered
    const items: Built['items'] = new Map();
    const submenus: Built['submenus'] = [];
    for (const planned of next.menus) {
      const children: unknown[] = [];
      for (const item of planned.items) {
        if (item.kind === 'separator') children.push({ item: 'Separator' });
        else if (item.kind === 'predefined') {
          const kind =
            item.item === 'About'
              ? { About: options.appName ? { name: options.appName } : null }
              : item.item;
          children.push(item.text === undefined ? { item: kind } : { item: kind, text: item.text });
        } else {
          const handle = await module.MenuItem.new({
            text: item.text,
            enabled: item.enabled,
            ...(item.accelerator ? { accelerator: item.accelerator } : {}),
            action: () => run(item.id),
          });
          items.set(item.id, { state: item, handle });
          children.push(handle);
        }
      }
      const handle = await module.Submenu.new({ text: planned.text, items: children });
      submenus.push({ id: planned.id, text: planned.text, handle });
      if (mac && planned.id === 'window') quietly(handle.setAsWindowsMenuForNSApp?.());
      if (mac && planned.id === 'help') quietly(handle.setAsHelpMenuForNSApp?.());
    }
    const menu = await module.Menu.new({ items: submenus.map(({ handle }) => handle) });
    return { plan: next, menu, submenus, items };
  }

  /** Changes labels, enabled states and accelerators of the menu in place. */
  async function patch(target: Built, next: Plan) {
    const calls: Array<Promise<void>> = [];
    next.menus.forEach((planned, index) => {
      const submenu = target.submenus[index];
      if (submenu.text !== planned.text) {
        submenu.text = planned.text;
        calls.push(submenu.handle.setText(planned.text));
      }
      for (const item of planned.items) {
        if (item.kind !== 'command') continue;
        const entry = target.items.get(item.id)!;
        const { state, handle } = entry;
        if (state.text !== item.text) calls.push(handle.setText(item.text));
        if (state.enabled !== item.enabled) calls.push(handle.setEnabled(item.enabled));
        if (state.accelerator !== item.accelerator) {
          calls.push(handle.setAccelerator(item.accelerator));
        }
        entry.state = item;
      }
    });
    target.plan = next;
    await Promise.all(calls.map((call) => call.catch(() => {})));
  }

  async function sync() {
    const next = latest ?? untrack(resolve);
    if (built && built.plan.structure === next.structure) return patch(built, next);
    const fresh = await build(next);
    if (destroyed) return releaseBuilt(fresh);
    let replaced: AppMenuHandle | null;
    try {
      replaced = await install(fresh.menu);
    } catch (error) {
      releaseBuilt(fresh);
      throw error;
    }
    if (previous === undefined) previous = replaced;
    // The menu it replaced is ours from the last build, handed back under a new handle.
    else release(replaced);
    releaseBuilt(built);
    built = fresh;
  }

  const kick = (): Promise<void> => {
    if (destroyed) return Promise.resolve();
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        try {
          await sync();
        } catch {
          /* a call the capability does not allow, or no menu bar on this desktop */
        }
      } while (again && !destroyed);
    })().finally(() => {
      running = null;
    });
    return running;
  };

  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => (resolveReady = resolve));

  const schedule = () => {
    if (destroyed) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      kick().then(resolveReady);
    }, debounce);
  };

  // Reading the registry inside an effect tracks every list change and every `enabled` function
  // that reads `$state`; the effect batches a burst of changes into one run.
  const stopTracking = $effect.root(() => {
    $effect(() => {
      latest = resolve();
      schedule();
    });
  });

  async function restore() {
    await running;
    const target = built;
    built = null;
    if (!target) return;
    try {
      if (previous) await install(previous);
      else {
        // Nothing to give back (a window with no menu of its own): leave an empty one.
        const empty = await module.Menu.new({ items: [] });
        release(await install(empty));
        release(empty);
      }
    } catch {
      /* not allowed by the capability */
    }
    release(previous);
    releaseBuilt(target);
  }

  return {
    ready,
    async refresh() {
      if (destroyed) return;
      latest = untrack(resolve);
      clearTimeout(timer);
      await kick().then(resolveReady);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(timer);
      stopTracking();
      window.removeEventListener('keydown', onKeydown, true);
      resolveReady();
      quietly(restore());
    },
  };
}
