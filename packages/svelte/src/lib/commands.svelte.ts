import { onDestroy, untrack } from 'svelte';
import {
  detectPlatform,
  matchesShortcut,
  parseShortcut,
  type ParsedShortcut,
  type Platform,
} from './shortcuts.js';

export interface Command {
  /** Unique within the registry. The key for `execute`, `get` and a native menu item. */
  id: string;
  /** What the command does, as a menu item or help row would say it: "Save", "Zoom in". */
  label: string;
  /**
   * `'Mod+S'`, `'Alt+ArrowDown'`, `'?'` — or several, the first being the one menus show.
   * `Mod` is Command on macOS and iOS, Control elsewhere. See `parseShortcut`.
   */
  shortcut?: string | readonly string[];
  /** Runs on the shortcut or `execute(id)`. Receives the keydown when a key triggered it. */
  handler: (event?: KeyboardEvent) => void;
  /**
   * `false`, or a function returning `false`, keeps the command from running and lets its key
   * do whatever it would otherwise do. A function that reads `$state` is tracked wherever
   * `isEnabled` is called inside an effect.
   */
  enabled?: boolean | (() => boolean);
  /** Heading the command is listed under in help and menus: "Navigation", "View". */
  group?: string;
  /** Longer explanation, for a help dialog or a tooltip. */
  description?: string;
  /**
   * Fire while focus is in a text field, select or contenteditable. Off by default, so typing
   * never triggers a command; turn it on for chords a field has no use for, such as `Mod+S`.
   */
  allowInInputs?: boolean;
}

/** A registered command, with its shortcuts parsed. */
export interface RegisteredCommand extends Command {
  readonly shortcuts: readonly ParsedShortcut[];
}

export interface CommandGroup {
  /** `undefined` for commands registered without a `group`. */
  group: string | undefined;
  commands: RegisteredCommand[];
}

export interface CommandsOptions {
  /**
   * Which meaning `Mod` takes. Detected from the browser by default (`'other'` on the server);
   * set it in tests, or in a native shell that knows better.
   */
  platform?: Platform;
}

export interface Commands {
  readonly platform: Platform;
  /**
   * Bumps on every register, unregister and `update`. Read it in an `$effect` (or use
   * `subscribe`) to rebuild a native menu when the list changes.
   */
  readonly version: number;
  /** Adds a command and returns a function that removes it. Throws on a duplicate id. */
  register(command: Command): () => void;
  /** Adds several, and returns one function that removes them all. */
  registerAll(commands: readonly Command[]): () => void;
  /** Changes a command in place — a new label, shortcut or `enabled`. `false` if it is gone. */
  update(id: string, patch: Partial<Omit<Command, 'id'>>): boolean;
  unregister(id: string): void;
  /** Runs the command if it exists and is enabled. Returns whether it ran. */
  execute(id: string, event?: KeyboardEvent): boolean;
  get(id: string): RegisteredCommand | undefined;
  /** Whether the command exists and is enabled now. */
  isEnabled(id: string): boolean;
  /** Every command, in registration order. Reactive. */
  list(): RegisteredCommand[];
  /** `list()` grouped by `group`, groups in order of first appearance. Reactive. */
  groups(): CommandGroup[];
  /**
   * Runs the command a keydown is for, if any, and calls `preventDefault` when it does.
   * Returns whether it handled the event. Wire it yourself (`<svelte:window onkeydown>`) or use
   * `listen`.
   */
  handle(event: KeyboardEvent): boolean;
  /**
   * Listens for keydown on `target` (default: `window`) and returns a function that stops.
   * It is also an attachment: `{@attach commands.listen}` scopes shortcuts to an element and
   * whatever has focus inside it.
   */
  listen(target?: EventTarget): () => void;
  /** Subscribes to changes outside Svelte; the listener runs after each change. */
  subscribe(listener: () => void): () => void;
  /** Removes every command and listener. Automatic for a component-scoped instance. */
  destroy(): void;
}

const TEXT_ENTRY = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
/** Inputs that take no typing, so a shortcut pressed on them is not mistaken for text. */
const NON_TEXT_INPUTS = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
  'image',
  'file',
  'color',
]);

/** Whether the keydown came from somewhere the user types. */
function isTyping(event: Event): boolean {
  const origin = (event.composedPath?.()[0] ?? event.target) as Element | null;
  if (!origin || typeof (origin as Element).closest !== 'function') return false;
  if ((origin as HTMLElement).isContentEditable) return true;
  const field = origin.closest(TEXT_ENTRY);
  if (!field) return false;
  if (field instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(field.type);
  return true;
}

const toList = (shortcut: Command['shortcut']): readonly string[] =>
  shortcut === undefined ? [] : typeof shortcut === 'string' ? [shortcut] : shortcut;

/**
 * A registry of commands — id, label, shortcut, handler — that runs them from the keyboard and
 * lists them for a help dialog or a native menu bar.
 *
 * ```svelte
 * <script lang="ts">
 *   const commands = createCommands();
 *   commands.registerAll([
 *     { id: 'save', label: 'Save', shortcut: 'Mod+S', allowInInputs: true, handler: save },
 *     { id: 'next', label: 'Next item', shortcut: 'Alt+ArrowDown', group: 'Navigation', handler: next },
 *   ]);
 *   $effect(() => commands.listen()); // window-wide; or {@attach commands.listen} on an element
 * </script>
 *
 * <ShortcutHelp {commands} />
 * ```
 *
 * Keys typed into a text field, select or contenteditable are left alone unless the command
 * sets `allowInInputs`; keys pressed during IME composition, and events another handler has
 * already `preventDefault`ed, are always left alone.
 *
 * When two commands share a shortcut, the one registered **last** wins — so a panel can
 * register a shortcut over a global one for as long as it is open, and the global one comes
 * back when the panel unregisters. A disabled command passes the key on to the next match.
 */
export function createCommands(options: CommandsOptions = {}): Commands {
  const platform = options.platform ?? detectPlatform();

  let commands = $state.raw<RegisteredCommand[]>([]);
  let version = $state(0);
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- callbacks, never rendered
  const listeners = new Set<() => void>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- listener teardowns
  const stops = new Set<() => void>();
  // Which registration owns each id, so a stale unregister cannot remove a later one.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping, never rendered
  const owners = new Map<string, symbol>();

  const changed = () => {
    version += 1;
    for (const listener of [...listeners]) listener();
  };

  const prepare = (command: Command): RegisteredCommand => ({
    ...command,
    shortcuts: toList(command.shortcut).map(parseShortcut),
  });

  const enabled = (command: Command) =>
    typeof command.enabled === 'function' ? command.enabled() : command.enabled !== false;

  const get = (id: string) => commands.find((command) => command.id === id);

  // Mutations run untracked: registering from inside an `$effect` must not make that effect
  // depend on the list it is changing.
  const unregister = (id: string) =>
    untrack(() => {
      const next = commands.filter((command) => command.id !== id);
      if (next.length === commands.length) return;
      owners.delete(id);
      commands = next;
      changed();
    });

  const register = (command: Command) =>
    untrack(() => {
      if (get(command.id)) {
        throw new Error(`createCommands: a command with id "${command.id}" is already registered`);
      }
      const owner = Symbol(command.id);
      commands = [...commands, prepare(command)];
      owners.set(command.id, owner);
      changed();
      return () => {
        if (owners.get(command.id) === owner) unregister(command.id);
      };
    });

  const handle = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return false;
    const typing = isTyping(event);
    for (let index = commands.length - 1; index >= 0; index -= 1) {
      const command = commands[index];
      if (typing && !command.allowInInputs) continue;
      if (!command.shortcuts.some((shortcut) => matchesShortcut(event, shortcut, platform))) {
        continue;
      }
      if (!enabled(command)) continue;
      event.preventDefault();
      command.handler(event);
      return true;
    }
    return false;
  };

  const listen = (target?: EventTarget) => {
    const host = target ?? (typeof window === 'undefined' ? undefined : window);
    if (!host) return () => {};
    const onKeydown = (event: Event) => handle(event as KeyboardEvent);
    host.addEventListener('keydown', onKeydown);
    const stop = () => {
      host.removeEventListener('keydown', onKeydown);
      stops.delete(stop);
    };
    stops.add(stop);
    return stop;
  };

  const destroy = () => {
    for (const stop of [...stops]) stop();
    listeners.clear();
    owners.clear();
    untrack(() => {
      if (commands.length) {
        commands = [];
        version += 1;
      }
    });
  };

  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    platform,
    get version() {
      return version;
    },
    register,
    registerAll(list) {
      const removers: Array<() => void> = [];
      try {
        for (const command of list) removers.push(register(command));
      } catch (error) {
        for (const remove of removers) remove();
        throw error;
      }
      return () => {
        for (const remove of removers) remove();
      };
    },
    update(id, patch) {
      return untrack(() => {
        const index = commands.findIndex((command) => command.id === id);
        if (index === -1) return false;
        const next = [...commands];
        next[index] = prepare({ ...commands[index], ...patch, id });
        commands = next;
        changed();
        return true;
      });
    },
    unregister,
    execute(id, event) {
      const command = get(id);
      if (!command || !enabled(command)) return false;
      command.handler(event);
      return true;
    },
    get,
    isEnabled(id) {
      const command = get(id);
      return command ? enabled(command) : false;
    },
    list: () => commands,
    groups() {
      const groups: CommandGroup[] = [];
      for (const command of commands) {
        let entry = groups.find((group) => group.group === command.group);
        if (!entry) groups.push((entry = { group: command.group, commands: [] }));
        entry.commands.push(command);
      }
      return groups;
    },
    handle,
    listen,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy,
  };
}
