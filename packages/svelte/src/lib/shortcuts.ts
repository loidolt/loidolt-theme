/*
 * Keyboard shortcut strings — parsing, matching, and the three ways of writing one out: for the
 * eye (`⌘⇧S`, `Ctrl+Shift+S`), for the ear (`Command Shift S`), and for a native menu
 * (`CmdOrCtrl+Shift+S`). Pure functions, no DOM access, safe anywhere.
 */

/** `mac` covers macOS and iOS/iPadOS, where `Mod` means Command; `other` maps `Mod` to Control. */
export type Platform = 'mac' | 'other';

/** A shortcut string parsed once, platform-independent: `Mod` stays `mod` until matched. */
export interface ParsedShortcut {
  /**
   * The key, as `KeyboardEvent.key` reports it: a single character in lower case (`s`, `?`,
   * `=`, `' '` for Space) or a named key (`ArrowDown`, `Escape`, `F8`).
   */
  key: string;
  /** Command on `mac`, Control elsewhere. */
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  /** The string it was parsed from. */
  source: string;
}

const MODIFIERS: Record<string, 'mod' | 'ctrl' | 'meta' | 'alt' | 'shift'> = {
  mod: 'mod',
  cmdorctrl: 'mod',
  commandorcontrol: 'mod',
  ctrl: 'ctrl',
  control: 'ctrl',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
};

/** Spellings people write, mapped to what `KeyboardEvent.key` reports. */
const KEY_ALIASES: Record<string, string> = {
  esc: 'Escape',
  escape: 'Escape',
  space: ' ',
  spacebar: ' ',
  plus: '+',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  enter: 'Enter',
  return: 'Enter',
  tab: 'Tab',
  backspace: 'Backspace',
  del: 'Delete',
  delete: 'Delete',
  insert: 'Insert',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pgup: 'PageUp',
  pagedown: 'PageDown',
  pgdn: 'PageDown',
};

/**
 * Parses `'Mod+Shift+S'`, `'Alt+ArrowDown'`, `'?'`, `'F8'`. Tokens are joined with `+` and are
 * case-insensitive; the last one is the key (`'Mod++'` or `'Mod+Plus'` for the plus key).
 * Modifiers: `Mod` (Command on mac, Control elsewhere), `Ctrl`, `Meta`/`Cmd`, `Alt`/`Option`,
 * `Shift`. Throws on an empty key, an unknown modifier, or a repeated one.
 */
export function parseShortcut(shortcut: string): ParsedShortcut {
  const source = shortcut;
  const trimmed = shortcut.trim();
  let tokens: string[];
  if (trimmed === '+') tokens = ['+'];
  else if (trimmed.endsWith('++')) tokens = [...trimmed.slice(0, -2).split('+'), '+'];
  else tokens = trimmed.split('+');
  tokens = tokens.map((token) => token.trim());

  const keyToken = tokens.pop() ?? '';
  if (!keyToken) throw new Error(`parseShortcut: "${source}" has no key`);

  const parsed: ParsedShortcut = {
    key: '',
    mod: false,
    ctrl: false,
    meta: false,
    alt: false,
    shift: false,
    source,
  };
  for (const token of tokens) {
    const modifier = MODIFIERS[token.toLowerCase()];
    if (!modifier) throw new Error(`parseShortcut: unknown modifier "${token}" in "${source}"`);
    if (parsed[modifier]) throw new Error(`parseShortcut: "${token}" repeated in "${source}"`);
    parsed[modifier] = true;
  }

  const alias = KEY_ALIASES[keyToken.toLowerCase()];
  if (alias) parsed.key = alias;
  else if (keyToken.length === 1) parsed.key = keyToken.toLowerCase();
  else if (/^f\d{1,2}$/i.test(keyToken)) parsed.key = keyToken.toUpperCase();
  // Any other name is taken as a `KeyboardEvent.key` value (`MediaPlayPause`, `ContextMenu`).
  else parsed.key = keyToken;
  return parsed;
}

const toParsed = (shortcut: string | ParsedShortcut) =>
  typeof shortcut === 'string' ? parseShortcut(shortcut) : shortcut;

/**
 * The platform the page runs on. `'other'` on the server, where nothing can be read; pass an
 * explicit `platform` wherever server-rendered text has to match the client.
 */
export function detectPlatform(): Platform {
  // Node has a `navigator` too, describing the server's OS, not the reader's.
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'other';
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const name = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
  return /mac|iphone|ipad|ipod/i.test(name) ? 'mac' : 'other';
}

/** A single printable character that is neither a letter nor a digit: `?`, `=`, `/`, `+`. */
const isSymbol = (key: string) => key.length === 1 && key !== ' ' && !/[\p{L}\p{N}]/u.test(key);

/** Physical keys, for layouts whose `event.key` is not Latin (or a macOS Option character). */
const CODE_KEYS: Record<string, string> = {
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backslash: '\\',
  Backquote: '`',
};

function keyFromCode(code: string): string | undefined {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1].toLowerCase();
  const digit = /^Digit(\d)$/.exec(code);
  if (digit) return digit[1];
  return CODE_KEYS[code];
}

type KeyEventLike = Pick<
  KeyboardEvent,
  'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'
>;

/**
 * Whether a keydown is this shortcut. Modifiers match exactly — `Mod+S` does not fire for
 * `Mod+Shift+S` — with one exception: a symbol key (`?`, `+`, `=`) ignores Shift unless the
 * shortcut names it, because Shift is how most layouts type the symbol in the first place.
 *
 * Letters compare case-insensitively on `event.key`. Where `event.key` is not ASCII — a
 * Cyrillic or Greek layout, or macOS turning Option+S into `ß` — and for digits, the physical
 * `event.code` is used instead, so `Mod+S` still works on a Russian layout and `Alt+=` on a Mac.
 */
export function matchesShortcut(
  event: KeyEventLike,
  shortcut: string | ParsedShortcut,
  platform: Platform = detectPlatform()
): boolean {
  const parsed = toParsed(shortcut);
  const mac = platform === 'mac';
  const ctrl = parsed.ctrl || (parsed.mod && !mac);
  const meta = parsed.meta || (parsed.mod && mac);
  if (!!event.ctrlKey !== ctrl || !!event.metaKey !== meta || !!event.altKey !== parsed.alt) {
    return false;
  }
  if (!(isSymbol(parsed.key) && !parsed.shift) && !!event.shiftKey !== parsed.shift) return false;

  const key = event.key ?? '';
  const wanted = parsed.key.toLowerCase();
  if (key.toLowerCase() === wanted) return true;

  // Fall back to the physical key only where `event.key` cannot be trusted to be Latin, so an
  // AZERTY `a` (physically Q) never fires a `Mod+Q`.
  const unreliable = key === 'Dead' || (key.length === 1 && key.charCodeAt(0) > 127);
  const fromCode = keyFromCode(event.code ?? '');
  if (!fromCode || fromCode !== wanted) return false;
  return unreliable || /^\d$/.test(wanted);
}

const MAC_MODIFIERS = { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' } as const;
const OTHER_MODIFIERS = { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' } as const;

const MAC_KEYS: Record<string, string> = {
  Enter: '↩',
  Backspace: '⌫',
  Delete: '⌦',
  Tab: '⇥',
  Escape: 'Esc',
};

const DISPLAY_KEYS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'Esc',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  ' ': 'Space',
};

const displayKey = (key: string, mac: boolean) =>
  (mac && MAC_KEYS[key]) || DISPLAY_KEYS[key] || (key.length === 1 ? key.toUpperCase() : key);

/** The modifiers in force on `platform`, in that platform's conventional order. */
function resolvedModifiers(parsed: ParsedShortcut, mac: boolean) {
  const ctrl = parsed.ctrl || (parsed.mod && !mac);
  const meta = parsed.meta || (parsed.mod && mac);
  // macOS lists Control, Option, Shift, Command; Windows and Linux Ctrl, Alt, Shift.
  const order: Array<'ctrl' | 'alt' | 'shift' | 'meta'> = mac
    ? ['ctrl', 'alt', 'shift', 'meta']
    : ['ctrl', 'meta', 'alt', 'shift'];
  const held = { ctrl, meta, alt: parsed.alt, shift: parsed.shift };
  return order.filter((name) => held[name]);
}

/**
 * Each key of the chord as it should be printed: `['⌘', '⇧', 'S']` on a Mac,
 * `['Ctrl', 'Shift', 'S']` elsewhere. Render each in its own `<kbd>`.
 */
export function shortcutKeys(
  shortcut: string | ParsedShortcut,
  platform: Platform = detectPlatform()
): string[] {
  const parsed = toParsed(shortcut);
  const mac = platform === 'mac';
  const names = mac ? MAC_MODIFIERS : OTHER_MODIFIERS;
  return [
    ...resolvedModifiers(parsed, mac).map((name) => names[name]),
    displayKey(parsed.key, mac),
  ];
}

/** A shortcut for display: `⌘⇧S` on a Mac, `Ctrl+Shift+S` elsewhere. */
export function formatShortcut(
  shortcut: string | ParsedShortcut,
  platform: Platform = detectPlatform()
): string {
  return shortcutKeys(shortcut, platform).join(platform === 'mac' ? '' : '+');
}

/** Words for {@link describeShortcut}, overridable for translation. */
export interface ShortcutNames {
  command: string;
  control: string;
  option: string;
  alt: string;
  shift: string;
  meta: string;
  up: string;
  down: string;
  left: string;
  right: string;
  space: string;
  escape: string;
}

const ENGLISH: ShortcutNames = {
  command: 'Command',
  control: 'Control',
  option: 'Option',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
  up: 'Up Arrow',
  down: 'Down Arrow',
  left: 'Left Arrow',
  right: 'Right Arrow',
  space: 'Space',
  escape: 'Escape',
};

/**
 * A shortcut as words, for screen readers: `Command Shift S`, `Control Shift S`. The Mac
 * glyphs (`⌘⇧`) are not reliably spoken, so pair them with this as visually hidden text.
 */
export function describeShortcut(
  shortcut: string | ParsedShortcut,
  options: { platform?: Platform; names?: Partial<ShortcutNames> } = {}
): string {
  const parsed = toParsed(shortcut);
  const mac = (options.platform ?? detectPlatform()) === 'mac';
  const names = { ...ENGLISH, ...options.names };
  const modifierWord = {
    ctrl: names.control,
    alt: mac ? names.option : names.alt,
    shift: names.shift,
    meta: mac ? names.command : names.meta,
  };
  const keyWord: Record<string, string> = {
    ArrowUp: names.up,
    ArrowDown: names.down,
    ArrowLeft: names.left,
    ArrowRight: names.right,
    ' ': names.space,
    Escape: names.escape,
  };
  const key =
    keyWord[parsed.key] ?? (parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key);
  return [...resolvedModifiers(parsed, mac).map((name) => modifierWord[name]), key].join(' ');
}

const ACCELERATOR_KEYS: Record<string, string> = {
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ' ': 'Space',
  '+': 'Plus',
};

/**
 * The shortcut as a native-menu accelerator, the format Tauri and Electron take:
 * `Mod+Shift+S` becomes `CmdOrCtrl+Shift+S`, `Alt+ArrowDown` becomes `Alt+Down`. Platform-
 * independent: the shell resolves `CmdOrCtrl` itself. An explicit `Meta` becomes `Super`.
 */
export function toAccelerator(shortcut: string | ParsedShortcut): string {
  const parsed = toParsed(shortcut);
  const parts: string[] = [];
  if (parsed.mod) parts.push('CmdOrCtrl');
  if (parsed.ctrl) parts.push('Ctrl');
  if (parsed.meta) parts.push('Super');
  if (parsed.alt) parts.push('Alt');
  if (parsed.shift) parts.push('Shift');
  parts.push(
    ACCELERATOR_KEYS[parsed.key] ??
      (parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key)
  );
  return parts.join('+');
}
