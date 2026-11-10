import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { createCommands, type Commands } from '../src/lib/commands.svelte.js';
import {
  describeShortcut,
  detectPlatform,
  formatShortcut,
  matchesShortcut,
  parseShortcut,
  shortcutKeys,
  toAccelerator,
} from '../src/lib/shortcuts.js';
import CommandsHarness from './fixtures/CommandsHarness.svelte';

type KeyInit = Partial<
  Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>
>;
const keydown = (init: KeyInit & { isComposing?: boolean; keyCode?: number } = {}) =>
  new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });

const instances: Commands[] = [];
const make = (...args: Parameters<typeof createCommands>) => {
  const commands = createCommands(...args);
  instances.push(commands);
  return commands;
};
afterEach(() => {
  for (const commands of instances.splice(0)) commands.destroy();
  document.body.innerHTML = '';
});

describe('parseShortcut', () => {
  it('splits modifiers from the key and lower-cases single characters', () => {
    expect(parseShortcut('Mod+Shift+S')).toMatchObject({
      key: 's',
      mod: true,
      shift: true,
      ctrl: false,
      meta: false,
      alt: false,
      source: 'Mod+Shift+S',
    });
  });

  it('accepts modifier aliases case-insensitively', () => {
    expect(parseShortcut('cmd+option+control+k')).toMatchObject({
      key: 'k',
      meta: true,
      alt: true,
      ctrl: true,
    });
    expect(parseShortcut('CmdOrCtrl+P').mod).toBe(true);
    expect(parseShortcut('Super+P').meta).toBe(true);
  });

  it('normalises named keys and their aliases', () => {
    expect(parseShortcut('Alt+Down').key).toBe('ArrowDown');
    expect(parseShortcut('alt+arrowup').key).toBe('ArrowUp');
    expect(parseShortcut('Esc').key).toBe('Escape');
    expect(parseShortcut('Space').key).toBe(' ');
    expect(parseShortcut('Return').key).toBe('Enter');
    expect(parseShortcut('f8').key).toBe('F8');
    expect(parseShortcut('PgDn').key).toBe('PageDown');
    expect(parseShortcut('MediaPlayPause').key).toBe('MediaPlayPause');
  });

  it('reads the plus key however it is written', () => {
    expect(parseShortcut('+').key).toBe('+');
    expect(parseShortcut('Mod++')).toMatchObject({ key: '+', mod: true });
    expect(parseShortcut('Mod+Plus')).toMatchObject({ key: '+', mod: true });
    expect(parseShortcut('?').key).toBe('?');
  });

  it('rejects malformed shortcuts', () => {
    expect(() => parseShortcut('')).toThrow(/no key/);
    expect(() => parseShortcut('Mod+')).toThrow(/no key/);
    expect(() => parseShortcut('Hyper+S')).toThrow(/unknown modifier/);
    expect(() => parseShortcut('Shift+Shift+S')).toThrow(/repeated/);
  });
});

describe('matchesShortcut', () => {
  it('maps Mod to Meta on mac and Control elsewhere', () => {
    expect(matchesShortcut({ key: 's', metaKey: true } as KeyboardEvent, 'Mod+S', 'mac')).toBe(
      true
    );
    expect(matchesShortcut({ key: 's', ctrlKey: true } as KeyboardEvent, 'Mod+S', 'mac')).toBe(
      false
    );
    expect(matchesShortcut(keydown({ key: 's', ctrlKey: true }), 'Mod+S', 'other')).toBe(true);
    expect(matchesShortcut(keydown({ key: 's', metaKey: true }), 'Mod+S', 'other')).toBe(false);
  });

  it('matches modifiers exactly and letters case-insensitively', () => {
    expect(
      matchesShortcut(keydown({ key: 'S', ctrlKey: true, shiftKey: true }), 'Mod+Shift+S', 'other')
    ).toBe(true);
    expect(
      matchesShortcut(keydown({ key: 'S', ctrlKey: true, shiftKey: true }), 'Mod+S', 'other')
    ).toBe(false);
    expect(
      matchesShortcut(keydown({ key: 's', ctrlKey: true, altKey: true }), 'Mod+S', 'other')
    ).toBe(false);
    expect(matchesShortcut(keydown({ key: 's' }), 'S', 'other')).toBe(true);
    expect(matchesShortcut(keydown({ key: 'S', shiftKey: true }), 'S', 'other')).toBe(false);
  });

  it('ignores Shift for symbol keys unless the shortcut names it', () => {
    expect(matchesShortcut(keydown({ key: '?', shiftKey: true }), '?', 'other')).toBe(true);
    expect(matchesShortcut(keydown({ key: '?' }), '?', 'other')).toBe(true);
    expect(matchesShortcut(keydown({ key: '+', shiftKey: true }), '+', 'other')).toBe(true);
    expect(matchesShortcut(keydown({ key: '?' }), 'Shift+?', 'other')).toBe(false);
  });

  it('falls back to the physical key for non-Latin layouts and mac Option characters', () => {
    // Russian layout: the S key types "ы".
    expect(
      matchesShortcut(keydown({ key: 'ы', code: 'KeyS', ctrlKey: true }), 'Mod+S', 'other')
    ).toBe(true);
    // macOS: Option+= types "≠".
    expect(
      matchesShortcut(keydown({ key: '≠', code: 'Equal', altKey: true }), 'Alt+=', 'mac')
    ).toBe(true);
    expect(
      matchesShortcut(keydown({ key: 'Dead', code: 'KeyN', altKey: true }), 'Alt+N', 'mac')
    ).toBe(true);
    // AZERTY: the physical 1 key types "&" unshifted.
    expect(
      matchesShortcut(keydown({ key: '&', code: 'Digit1', ctrlKey: true }), 'Mod+1', 'other')
    ).toBe(true);
  });

  it('never trusts the physical key over a Latin character', () => {
    // AZERTY: the key physically at Q types "a".
    expect(
      matchesShortcut(keydown({ key: 'a', code: 'KeyQ', ctrlKey: true }), 'Mod+Q', 'other')
    ).toBe(false);
    expect(matchesShortcut(keydown({ key: 'x', code: 'Unknown' }), 'Y', 'other')).toBe(false);
  });

  it('matches named keys', () => {
    expect(matchesShortcut(keydown({ key: 'ArrowDown', altKey: true }), 'Alt+Down', 'other')).toBe(
      true
    );
    expect(matchesShortcut(keydown({ key: 'F8' }), 'F8', 'other')).toBe(true);
    expect(matchesShortcut(keydown({ key: 'Escape' }), 'Esc', 'other')).toBe(true);
  });

  it('defaults to the detected platform', () => {
    const event = keydown({ key: 'k', [detectPlatform() === 'mac' ? 'metaKey' : 'ctrlKey']: true });
    expect(matchesShortcut(event, 'Mod+K')).toBe(true);
  });
});

describe('detectPlatform', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads macOS and iOS as mac, the rest as other', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    expect(detectPlatform()).toBe('mac');
    vi.stubGlobal('navigator', { userAgentData: { platform: 'macOS' } });
    expect(detectPlatform()).toBe('mac');
    vi.stubGlobal('navigator', { platform: '', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS)' });
    expect(detectPlatform()).toBe('mac');
    vi.stubGlobal('navigator', { platform: 'Win32' });
    expect(detectPlatform()).toBe('other');
    vi.stubGlobal('navigator', {});
    expect(detectPlatform()).toBe('other');
  });

  it('is other without a navigator', () => {
    vi.stubGlobal('navigator', undefined);
    expect(detectPlatform()).toBe('other');
  });
});

describe('formatting', () => {
  it('prints Mac glyphs in Apple order, and words joined with + elsewhere', () => {
    expect(formatShortcut('Mod+Shift+S', 'mac')).toBe('⇧⌘S');
    expect(formatShortcut('Mod+Shift+S', 'other')).toBe('Ctrl+Shift+S');
    expect(formatShortcut('Ctrl+Alt+Shift+Meta+K', 'mac')).toBe('⌃⌥⇧⌘K');
    expect(formatShortcut('Ctrl+Alt+Shift+Meta+K', 'other')).toBe('Ctrl+Meta+Alt+Shift+K');
    expect(formatShortcut('Alt+ArrowDown', 'other')).toBe('Alt+↓');
    expect(formatShortcut('Mod+Enter', 'mac')).toBe('⌘↩');
    expect(formatShortcut('Escape', 'other')).toBe('Esc');
    expect(formatShortcut('Space', 'other')).toBe('Space');
    expect(formatShortcut('?', 'other')).toBe('?');
    expect(formatShortcut('F8', 'mac')).toBe('F8');
    expect(formatShortcut(parseShortcut('Mod+K'))).toMatch(/K$/);
  });

  it('splits a chord into its keys for key caps', () => {
    expect(shortcutKeys('Mod+Shift+S', 'mac')).toEqual(['⇧', '⌘', 'S']);
    expect(shortcutKeys('Mod+Shift+S', 'other')).toEqual(['Ctrl', 'Shift', 'S']);
    expect(shortcutKeys('PageUp')).toEqual(['PgUp']);
  });

  it('describes a shortcut in words, translatable', () => {
    expect(describeShortcut('Mod+Shift+S', { platform: 'mac' })).toBe('Shift Command S');
    expect(describeShortcut('Mod+Alt+S', { platform: 'other' })).toBe('Control Alt S');
    expect(describeShortcut('Alt+S', { platform: 'mac' })).toBe('Option S');
    expect(describeShortcut('Meta+ArrowUp', { platform: 'other' })).toBe('Meta Up Arrow');
    expect(describeShortcut('Space', { platform: 'other' })).toBe('Space');
    expect(describeShortcut('Esc', { platform: 'other' })).toBe('Escape');
    expect(describeShortcut('F8')).toBe('F8');
    expect(
      describeShortcut('Mod+ArrowLeft', {
        platform: 'other',
        names: { control: 'Strg', left: 'Links' },
      })
    ).toBe('Strg Links');
  });

  it('writes native-menu accelerators', () => {
    expect(toAccelerator('Mod+Shift+S')).toBe('CmdOrCtrl+Shift+S');
    expect(toAccelerator('Ctrl+Meta+Alt+ArrowDown')).toBe('Ctrl+Super+Alt+Down');
    expect(toAccelerator('Mod++')).toBe('CmdOrCtrl+Plus');
    expect(toAccelerator('Space')).toBe('Space');
    expect(toAccelerator('F8')).toBe('F8');
    expect(toAccelerator('?')).toBe('?');
    expect(toAccelerator(parseShortcut('Escape'))).toBe('Escape');
  });
});

describe('createCommands', () => {
  it('lists commands in registration order and unregisters them', () => {
    const commands = make({ platform: 'other' });
    const offA = commands.register({ id: 'a', label: 'A', handler: () => {} });
    commands.register({ id: 'b', label: 'B', shortcut: 'Mod+B', handler: () => {} });
    expect(commands.list().map((command) => command.id)).toEqual(['a', 'b']);
    expect(commands.get('b')?.shortcuts[0]).toMatchObject({ key: 'b', mod: true });
    offA();
    offA();
    expect(commands.list().map((command) => command.id)).toEqual(['b']);
    commands.unregister('b');
    commands.unregister('missing');
    expect(commands.list()).toEqual([]);
    expect(commands.get('b')).toBeUndefined();
  });

  it('rejects a duplicate id and a bad shortcut at registration', () => {
    const commands = make();
    commands.register({ id: 'a', label: 'A', handler: () => {} });
    expect(() => commands.register({ id: 'a', label: 'Again', handler: () => {} })).toThrow(
      /already registered/
    );
    expect(() =>
      commands.register({ id: 'b', label: 'B', shortcut: 'Hyper+B', handler: () => {} })
    ).toThrow();
  });

  it('registers several at once, and rolls back if one fails', () => {
    const commands = make();
    const off = commands.registerAll([
      { id: 'a', label: 'A', handler: () => {} },
      { id: 'b', label: 'B', handler: () => {} },
    ]);
    expect(commands.list()).toHaveLength(2);
    off();
    expect(commands.list()).toHaveLength(0);

    expect(() =>
      commands.registerAll([
        { id: 'c', label: 'C', handler: () => {} },
        { id: 'c', label: 'C again', handler: () => {} },
      ])
    ).toThrow();
    expect(commands.list()).toHaveLength(0);
  });

  it('does not let a stale unregister remove a newer command with the same id', () => {
    const commands = make();
    const offOld = commands.register({ id: 'a', label: 'Old', handler: () => {} });
    commands.unregister('a');
    commands.register({ id: 'a', label: 'New', handler: () => {} });
    offOld();
    expect(commands.get('a')?.label).toBe('New');
  });

  it('groups commands by first appearance', () => {
    const commands = make();
    commands.registerAll([
      { id: 'next', label: 'Next', group: 'Navigation', handler: () => {} },
      { id: 'save', label: 'Save', handler: () => {} },
      { id: 'prev', label: 'Previous', group: 'Navigation', handler: () => {} },
    ]);
    expect(
      commands.groups().map((group) => [group.group, group.commands.map((command) => command.id)])
    ).toEqual([
      ['Navigation', ['next', 'prev']],
      [undefined, ['save']],
    ]);
  });

  it('executes enabled commands only', () => {
    const commands = make();
    const handler = vi.fn();
    let allowed = false;
    commands.register({ id: 'a', label: 'A', handler, enabled: () => allowed });
    commands.register({ id: 'b', label: 'B', handler, enabled: false });
    expect(commands.isEnabled('a')).toBe(false);
    expect(commands.execute('a')).toBe(false);
    allowed = true;
    expect(commands.isEnabled('a')).toBe(true);
    expect(commands.execute('a')).toBe(true);
    expect(commands.execute('b')).toBe(false);
    expect(commands.execute('missing')).toBe(false);
    expect(commands.isEnabled('missing')).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('updates a command in place and re-parses its shortcut', () => {
    const commands = make({ platform: 'other' });
    commands.register({ id: 'a', label: 'A', shortcut: 'Mod+A', handler: () => {} });
    expect(commands.update('a', { label: 'Renamed', shortcut: ['F2', 'Mod+R'] })).toBe(true);
    expect(commands.get('a')).toMatchObject({ id: 'a', label: 'Renamed' });
    expect(commands.get('a')?.shortcuts.map((shortcut) => shortcut.key)).toEqual(['F2', 'r']);
    expect(commands.update('missing', { label: 'X' })).toBe(false);
  });

  it('bumps version and notifies subscribers on every change', () => {
    const commands = make();
    const listener = vi.fn();
    const unsubscribe = commands.subscribe(listener);
    const start = commands.version;
    const off = commands.register({ id: 'a', label: 'A', handler: () => {} });
    commands.update('a', { label: 'B' });
    off();
    expect(commands.version).toBe(start + 3);
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    commands.register({ id: 'b', label: 'B', handler: () => {} });
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('exposes the platform it resolves Mod with', () => {
    expect(make({ platform: 'mac' }).platform).toBe('mac');
    expect(['mac', 'other']).toContain(make().platform);
  });
});

describe('keyboard handling', () => {
  const setup = (platform: 'mac' | 'other' = 'other') => {
    const commands = make({ platform });
    const save = vi.fn();
    const help = vi.fn();
    commands.registerAll([
      { id: 'save', label: 'Save', shortcut: 'Mod+S', handler: save, allowInInputs: true },
      { id: 'help', label: 'Help', shortcut: '?', handler: help },
    ]);
    commands.listen();
    return { commands, save, help };
  };

  it('runs the command for a shortcut and prevents the default', () => {
    const { save } = setup('mac');
    const event = keydown({ key: 's', metaKey: true });
    window.dispatchEvent(event);
    expect(save).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves unmatched keys alone', () => {
    const { save, help } = setup();
    const event = keydown({ key: 'x' });
    window.dispatchEvent(event);
    expect(save).not.toHaveBeenCalled();
    expect(help).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores keys typed into fields unless the command allows it', () => {
    const { save, help } = setup();
    for (const markup of [
      '<input type="text">',
      '<textarea></textarea>',
      '<select><option>One</option></select>',
      '<div contenteditable="true"><span>Text</span></div>',
    ]) {
      document.body.innerHTML = markup;
      const field = document.body.querySelector('input, textarea, select, span') as HTMLElement;
      // jsdom does not implement isContentEditable; the selector covers it.
      field.dispatchEvent(keydown({ key: '?', shiftKey: true }));
    }
    expect(help).not.toHaveBeenCalled();

    document.body.innerHTML = '<input type="text">';
    document.body.querySelector('input')!.dispatchEvent(keydown({ key: 's', ctrlKey: true }));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('treats checkboxes, buttons and contenteditable="false" as not typing', () => {
    const { help } = setup();
    document.body.innerHTML =
      '<input type="checkbox"><button>Go</button><div contenteditable="false"><span>x</span></div>';
    for (const element of document.body.querySelectorAll('input, button, span')) {
      element.dispatchEvent(keydown({ key: '?' }));
    }
    expect(help).toHaveBeenCalledTimes(3);
  });

  it('ignores IME composition and events already handled', () => {
    const { save } = setup();
    window.dispatchEvent(keydown({ key: 's', ctrlKey: true, isComposing: true }));
    window.dispatchEvent(keydown({ key: 's', ctrlKey: true, keyCode: 229 }));
    const handled = keydown({ key: 's', ctrlKey: true });
    handled.preventDefault();
    window.dispatchEvent(handled);
    expect(save).not.toHaveBeenCalled();
  });

  it('skips disabled commands without swallowing their key', () => {
    const commands = make({ platform: 'other' });
    const handler = vi.fn();
    commands.register({ id: 'a', label: 'A', shortcut: 'F8', handler, enabled: false });
    const event = keydown({ key: 'F8' });
    expect(commands.handle(event)).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('lets the last registered command win a shared shortcut, falling back when it goes', () => {
    const commands = make({ platform: 'other' });
    const global = vi.fn();
    const panel = vi.fn();
    commands.register({ id: 'global', label: 'Close', shortcut: 'Escape', handler: global });
    const off = commands.register({
      id: 'panel',
      label: 'Close panel',
      shortcut: 'Esc',
      handler: panel,
    });
    commands.handle(keydown({ key: 'Escape' }));
    expect(panel).toHaveBeenCalledTimes(1);
    expect(global).not.toHaveBeenCalled();

    commands.update('panel', { enabled: false });
    commands.handle(keydown({ key: 'Escape' }));
    expect(global).toHaveBeenCalledTimes(1);

    off();
    commands.handle(keydown({ key: 'Escape' }));
    expect(global).toHaveBeenCalledTimes(2);
  });

  it('accepts several shortcuts for one command', () => {
    const commands = make({ platform: 'other' });
    const zoom = vi.fn();
    commands.register({ id: 'zoom', label: 'Zoom in', shortcut: ['+', '='], handler: zoom });
    commands.handle(keydown({ key: '+', shiftKey: true }));
    commands.handle(keydown({ key: '=' }));
    expect(zoom).toHaveBeenCalledTimes(2);
  });

  it('scopes a listener to an element, and stops listening', () => {
    const commands = make({ platform: 'other' });
    const handler = vi.fn();
    commands.register({ id: 'a', label: 'A', shortcut: 'F2', handler });
    document.body.innerHTML =
      '<div id="scope"><button>In</button></div><button id="out">Out</button>';
    const stop = commands.listen(document.getElementById('scope')!);
    document.getElementById('out')!.dispatchEvent(keydown({ key: 'F2' }));
    expect(handler).not.toHaveBeenCalled();
    document.querySelector('#scope button')!.dispatchEvent(keydown({ key: 'F2' }));
    expect(handler).toHaveBeenCalledTimes(1);
    stop();
    document.querySelector('#scope button')!.dispatchEvent(keydown({ key: 'F2' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removes every listener and command on destroy', () => {
    const { commands, save } = setup();
    commands.destroy();
    window.dispatchEvent(keydown({ key: 's', ctrlKey: true }));
    expect(save).not.toHaveBeenCalled();
    expect(commands.list()).toEqual([]);
    commands.destroy();
  });

  it('ignores events with no usable target', () => {
    const commands = make({ platform: 'other' });
    const handler = vi.fn();
    commands.register({ id: 'a', label: 'A', shortcut: 'F2', handler });
    const event = keydown({ key: 'F2' });
    Object.defineProperty(event, 'target', { value: null });
    Object.defineProperty(event, 'composedPath', { value: () => [] });
    expect(commands.handle(event)).toBe(true);
  });
});

describe('ShortcutHelp', () => {
  it('opens on ?, lists commands by group with key caps, and closes with focus returned', async () => {
    const user = userEvent.setup();
    render(CommandsHarness);
    const before = screen.getByRole('button', { name: 'Before' });
    before.focus();
    await user.keyboard('?');
    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
    expect(dialog).toHaveTextContent('Navigation');
    expect(dialog).toHaveTextContent('Next item');
    expect(dialog).toHaveTextContent('Control Shift S');
    expect(dialog.querySelectorAll('kbd.ldt-kbd').length).toBeGreaterThan(3);
    expect(dialog).toHaveTextContent('or');
    // The help command lists itself, under the ungrouped heading.
    expect(dialog).toHaveTextContent('General');
    expect(dialog).toHaveTextContent('Show keyboard shortcuts');
    // Commands without a shortcut are left out.
    expect(dialog).not.toHaveTextContent('Unbound');
    expect(
      (await axe(dialog, { rules: { 'color-contrast': { enabled: false } } })).violations
    ).toEqual([]);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(before).toHaveFocus());
  });

  it('runs a registered command from the keyboard', async () => {
    render(CommandsHarness);
    await fireEvent.keyDown(window, { key: 'ArrowDown', altKey: true });
    expect(screen.getByTestId('log')).toHaveTextContent('next');
  });

  it('registers nothing with shortcut={null}, and shows the empty state', async () => {
    const view = render(CommandsHarness, { helpShortcut: null, empty: true, open: true });
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('No keyboard shortcuts.');
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    view.unmount();
  });

  it('drops its command when the shortcut is cleared', async () => {
    const view = render(CommandsHarness, { empty: true });
    flushSync();
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    await view.rerender({ helpShortcut: null });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
