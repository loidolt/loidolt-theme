import { createCommands, type Command } from '@loidolt/theme-svelte';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import {
  createMenuBar,
  isMenuBarModule,
  menuAccelerator,
  setupTauri,
  type MenuBarOptions,
} from '../src/lib/index.js';
import { enterTauri, fakeMenuBar, fakeOs, flush } from './fakes.js';
import { flag } from './flag.svelte.js';

/** Lets the registry's effect run, the debounce pass and the menu calls settle. */
const settle = async () => {
  flushSync();
  await new Promise((resolve) => setTimeout(resolve, 5));
  await flush();
};

function registry(list: Command[] = sample()) {
  const commands = createCommands({ platform: 'mac' });
  commands.registerAll(list);
  return commands;
}

function sample(handlers: Record<string, () => void> = {}): Command[] {
  const run = (id: string) => handlers[id] ?? (() => {});
  return [
    { id: 'new', label: 'New note', shortcut: 'Mod+N', group: 'File', handler: run('new') },
    { id: 'save', label: 'Save', shortcut: 'Mod+S', group: 'File', handler: run('save') },
    { id: 'find', label: 'Find', shortcut: 'Mod+F', group: 'Edit', handler: run('find') },
    {
      id: 'zoom',
      label: 'Zoom in',
      shortcut: ['Mod+=', 'Mod++'],
      group: 'View',
      handler: run('zoom'),
    },
    { id: 'next', label: 'Next item', shortcut: 'J', group: 'View', handler: run('next') },
    { id: 'docs', label: 'Documentation', shortcut: 'F1', group: 'Help', handler: run('docs') },
    { id: 'sync', label: 'Sync now', handler: run('sync') },
  ];
}

function start(
  options: Partial<MenuBarOptions> = {},
  agent: 'mac' | 'windows' | 'linux' = 'mac',
  fake = fakeMenuBar({ initial: agent === 'mac' })
) {
  enterTauri(agent);
  const commands = options.commands ?? registry();
  const bar = createMenuBar({ menu: fake.menu, commands, debounce: 0, ...options });
  return { fake, commands, bar };
}

describe('createMenuBar', () => {
  it('does nothing in a browser', async () => {
    const fake = fakeMenuBar();
    const bar = createMenuBar({ menu: fake.menu, commands: registry() });
    await bar.ready;
    await bar.refresh();
    expect(fake.menu.Menu.new).not.toHaveBeenCalled();
    bar.destroy();
  });

  it('does nothing on a mobile target', async () => {
    enterTauri('iphone' as 'mac');
    const fake = fakeMenuBar();
    const bar = createMenuBar({ menu: fake.menu, commands: registry() });
    await bar.ready;
    expect(fake.menu.Menu.new).not.toHaveBeenCalled();
  });

  it('builds the macOS menu bar from the groups, around the standard menus', async () => {
    const { fake, bar } = start({ appName: 'Notes' });
    await bar.ready;
    expect(fake.titles()).toEqual({
      Notes: [
        '<About>',
        '<Separator>',
        '<Services>',
        '<Separator>',
        '<Hide>',
        '<HideOthers>',
        '<ShowAll>',
        '<Separator>',
        '<Quit>',
      ],
      File: ['New note', 'Save'],
      Edit: [
        '<Undo>',
        '<Redo>',
        '<Separator>',
        '<Cut>',
        '<Copy>',
        '<Paste>',
        '<SelectAll>',
        '<Separator>',
        'Find',
      ],
      View: ['Zoom in', 'Next item'],
      Commands: ['Sync now'],
      Window: ['<Minimize>', '<Maximize>', '<Separator>', '<CloseWindow>'],
      Help: ['Documentation'],
    });
    const about = fake.bar.app!.items[0].items[0] as { item: unknown };
    expect(about.item).toEqual({ About: { name: 'Notes' } });
    expect(
      fake.submenus.find((sub) => sub.text === 'Window')!.setAsWindowsMenuForNSApp
    ).toHaveBeenCalled();
    expect(
      fake.submenus.find((sub) => sub.text === 'Help')!.setAsHelpMenuForNSApp
    ).toHaveBeenCalled();
    expect(fake.bar.app!.setAsAppMenu).toHaveBeenCalledOnce();
    bar.destroy();
  });

  it('gives each command its first chord as the accelerator, and leaves plain keys to the page', async () => {
    const { fake, bar } = start();
    await bar.ready;
    expect(fake.item('Save')!.accelerator).toBe('CmdOrCtrl+S');
    expect(fake.item('Zoom in')!.accelerator).toBe('CmdOrCtrl+=');
    expect(fake.item('Documentation')!.accelerator).toBe('F1');
    expect(fake.item('Next item')!.accelerator).toBeNull();
    expect(fake.item('Sync now')!.accelerator).toBeNull();
    bar.destroy();
  });

  it('keeps enabled states in step, in place', async () => {
    const commands = registry();
    commands.update('save', { enabled: false });
    const { fake, bar } = start({ commands });
    await bar.ready;
    expect(fake.item('Save')!.enabled).toBe(false);
    commands.update('save', { enabled: true });
    await settle();
    expect(fake.item('Save')!.enabled).toBe(true);
    expect(fake.item('Save')!.setEnabled).toHaveBeenCalledWith(true);
    expect(fake.menu.Menu.new).toHaveBeenCalledOnce();
    bar.destroy();
  });

  it('follows an enabled function that reads $state', async () => {
    const dirty = flag(false);
    const commands = registry([
      {
        id: 'save',
        label: 'Save',
        shortcut: 'Mod+S',
        group: 'File',
        enabled: () => dirty.value,
        handler: () => {},
      },
    ]);
    const { fake, bar } = start({ commands });
    await bar.ready;
    expect(fake.item('Save')!.enabled).toBe(false);
    dirty.value = true;
    await settle();
    expect(fake.item('Save')!.enabled).toBe(true);
    expect(fake.menu.Menu.new).toHaveBeenCalledOnce();
    bar.destroy();
  });

  it('renames items, headings and accelerators in place', async () => {
    const { fake, bar, commands } = start({
      layout: (menus) =>
        menus.map((menu) => (menu.id === 'group:View' ? { ...menu, label: 'Look & feel' } : menu)),
    });
    await bar.ready;
    expect(fake.titles()!['Look && feel']).toEqual(['Zoom in', 'Next item']);
    commands.update('save', { label: 'Save & close', shortcut: 'Mod+Shift+S' });
    await settle();
    const save = fake.item('Save && close')!;
    expect(save.setText).toHaveBeenCalledWith('Save && close');
    expect(save.setAccelerator).toHaveBeenCalledWith('CmdOrCtrl+Shift+S');
    commands.update('save', { shortcut: undefined });
    await settle();
    expect(save.setAccelerator).toHaveBeenLastCalledWith(null);
    expect(fake.menu.Menu.new).toHaveBeenCalledOnce();
    bar.destroy();
  });

  it('renames a heading a reactive layout changes', async () => {
    const german = flag(false);
    const { fake, bar } = start({
      layout: (menus) =>
        menus.map((menu) =>
          menu.id === 'group:View' ? { ...menu, label: german.value ? 'Ansicht' : 'View' } : menu
        ),
    });
    await bar.ready;
    const view = fake.submenus.find((sub) => sub.text === 'View')!;
    german.value = true;
    await settle();
    expect(view.setText).toHaveBeenCalledWith('Ansicht');
    expect(fake.titles()!.Ansicht).toEqual(['Zoom in', 'Next item']);
    expect(fake.menu.Menu.new).toHaveBeenCalledOnce();
    bar.destroy();
  });

  it('rebuilds when a command comes or goes, and frees the old menu', async () => {
    const { fake, bar, commands } = start();
    await bar.ready;
    const first = fake.bar.app!;
    const remove = commands.register({
      id: 'print',
      label: 'Print',
      shortcut: 'Mod+P',
      group: 'File',
      handler: () => {},
    });
    await settle();
    expect(fake.titles()!.File).toEqual(['New note', 'Save', 'Print']);
    expect(fake.bar.app).not.toBe(first);
    expect(first.close).toHaveBeenCalled();
    expect(first.items[1].close).toHaveBeenCalled();
    remove();
    commands.unregister('sync');
    await settle();
    expect(fake.titles()!.File).toEqual(['New note', 'Save']);
    expect(fake.titles()!.Commands).toBeUndefined();
    bar.destroy();
  });

  it('gathers a burst of changes into one rebuild', async () => {
    const { fake, bar, commands } = start();
    await bar.ready;
    commands.registerAll([
      { id: 'a', label: 'A', group: 'Extra', handler: () => {} },
      { id: 'b', label: 'B', group: 'Extra', handler: () => {} },
      { id: 'c', label: 'C', group: 'Extra', handler: () => {} },
    ]);
    await settle();
    expect(fake.menu.Menu.new).toHaveBeenCalledTimes(2);
    bar.destroy();
  });

  it('runs a command when its item is chosen, unless it is disabled', async () => {
    const save = vi.fn();
    const commands = registry(sample({ save }));
    const { fake, bar } = start({ commands });
    await bar.ready;
    fake.click('Save');
    expect(save).toHaveBeenCalledOnce();
    commands.update('save', { enabled: false });
    fake.click('Save');
    expect(save).toHaveBeenCalledOnce();
    bar.destroy();
    commands.update('save', { enabled: true });
    fake.click('Save');
    expect(save).toHaveBeenCalledOnce();
  });

  it('runs a keystroke once when the page handled it and the menu fires too', async () => {
    const save = vi.fn();
    const commands = registry(sample({ save }));
    const stop = commands.listen();
    const { fake, bar } = start({ commands });
    await bar.ready;
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', code: 'KeyS', metaKey: true, cancelable: true })
    );
    expect(save).toHaveBeenCalledOnce();
    fake.click('Save');
    expect(save).toHaveBeenCalledOnce();
    // A later click is a click of its own.
    fake.click('Save');
    expect(save).toHaveBeenCalledTimes(2);
    stop();
    bar.destroy();
  });

  it('runs a keystroke once when the menu fires first and the page sees the key after', async () => {
    const save = vi.fn();
    const commands = registry(sample({ save }));
    const stop = commands.listen();
    const { fake, bar } = start({ commands });
    await bar.ready;
    fake.click('Save');
    const event = new KeyboardEvent('keydown', {
      key: 's',
      code: 'KeyS',
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    expect(save).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', code: 'KeyS', metaKey: true, cancelable: true })
    );
    expect(save).toHaveBeenCalledTimes(2);
    stop();
    bar.destroy();
  });

  it('lets the menu run a key the page left alone, and other keys pass', async () => {
    const save = vi.fn();
    const find = vi.fn();
    const commands = registry(sample({ save, find }));
    const stop = commands.listen();
    const { fake, bar } = start({ commands });
    await bar.ready;
    // Typing in a field: `find` does not allow inputs, so the page leaves Mod+F to the menu.
    const field = document.body.appendChild(document.createElement('input'));
    field.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'f',
        code: 'KeyF',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
    expect(find).not.toHaveBeenCalled();
    fake.click('Find');
    expect(find).toHaveBeenCalledOnce();
    // The menu ran Find; an unrelated key right after is not swallowed.
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', code: 'KeyS', metaKey: true, cancelable: true })
    );
    expect(save).toHaveBeenCalledOnce();
    stop();
    bar.destroy();
  });

  it('forgets a keystroke after a moment', async () => {
    const save = vi.fn();
    const commands = registry(sample({ save }));
    const stop = commands.listen();
    const { fake, bar } = start({ commands });
    await bar.ready;
    const now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 's', code: 'KeyS', metaKey: true, cancelable: true })
    );
    clock.mockReturnValue(now + 2000);
    fake.click('Save');
    expect(save).toHaveBeenCalledTimes(2);
    fake.click('New note');
    clock.mockReturnValue(now + 4000);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'n', code: 'KeyN', metaKey: true, cancelable: true })
    );
    stop();
    bar.destroy();
  });

  it('puts the previous menu bar back on destroy', async () => {
    const { fake, bar } = start();
    await bar.ready;
    const ours = fake.bar.app!;
    bar.destroy();
    bar.destroy();
    await settle();
    expect(fake.bar.app).toBe(fake.initial);
    expect(ours.close).toHaveBeenCalled();
    expect(fake.items.every((item) => item.close.mock.calls.length > 0)).toBe(true);
  });

  it('builds nothing when destroyed before the first pass', async () => {
    const { fake, bar } = start();
    bar.destroy();
    await bar.ready;
    await settle();
    expect(fake.menu.Menu.new).not.toHaveBeenCalled();
    expect(fake.bar.app).toBe(fake.initial);
  });

  it('frees a menu that finished building after destroy', async () => {
    const fake = fakeMenuBar({ initial: true });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const create = fake.menu.Submenu.new.getMockImplementation()!;
    fake.menu.Submenu.new.mockImplementation(async (opts) => {
      await gate;
      return create(opts);
    });
    const { bar } = start({}, 'mac', fake);
    await settle();
    bar.destroy();
    release();
    await settle();
    expect(fake.bar.app).toBe(fake.initial);
    expect(fake.menus.every((menu) => menu.close.mock.calls.length > 0)).toBe(true);
  });

  it('builds only the registry groups on Windows, on the window', async () => {
    const { fake, bar } = start({}, 'windows', fakeMenuBar());
    await bar.ready;
    expect(fake.titles('window')).toEqual({
      File: ['New note', 'Save'],
      Edit: ['Find'],
      View: ['Zoom in', 'Next item'],
      Help: ['Documentation'],
      Commands: ['Sync now'],
    });
    expect(fake.bar.app).toBeNull();
    expect(fake.submenus.some((sub) => sub.setAsHelpMenuForNSApp.mock.calls.length)).toBe(false);
    bar.destroy();
    await settle();
    // There was no menu before: an empty one replaces ours.
    expect(fake.titles('window')).toEqual({});
  });

  it('puts the bar on every window on Linux with target app', async () => {
    const { fake, bar } = start({ target: 'app' }, 'linux', fakeMenuBar());
    await bar.ready;
    expect(fake.titles()!.File).toEqual(['New note', 'Save']);
    expect(fake.bar.window).toBeNull();
    bar.destroy();
  });

  it('stays off a platform it is not meant for', async () => {
    const { fake, bar } = start({ platforms: ['macos'] }, 'windows', fakeMenuBar());
    await bar.ready;
    expect(fake.menu.Menu.new).not.toHaveBeenCalled();
    bar.destroy();
  });

  it('asks the os plugin for the platform', async () => {
    enterTauri('mac');
    const fake = fakeMenuBar();
    const bar = createMenuBar(
      { menu: fake.menu, commands: registry(), debounce: 0 },
      fakeOs('linux')
    );
    await bar.ready;
    expect(fake.titles('window')).not.toBeNull();
    expect(fake.titles('window')!['']).toBeUndefined();
    bar.destroy();
  });

  it('leaves out the standard menus on request', async () => {
    const { fake, bar } = start({ appMenu: false, editMenu: false, windowMenu: false });
    await bar.ready;
    expect(Object.keys(fake.titles()!)).toEqual(['File', 'Edit', 'View', 'Commands', 'Help']);
    expect(fake.titles()!.Edit).toEqual(['Find']);
    bar.destroy();
  });

  it('keeps a standard menu without a group to join', async () => {
    const commands = registry([{ id: 'a', label: 'A', group: 'Tools', handler: () => {} }]);
    const { fake, bar } = start({ commands, appMenu: false, windowMenu: false });
    await bar.ready;
    expect(Object.keys(fake.titles()!)).toEqual(['Edit', 'Tools']);
    bar.destroy();
  });

  it('translates headings and built-in items', async () => {
    const commands = registry([
      { id: 'find', label: 'Suchen', group: 'Bearbeiten', handler: () => {} },
      { id: 'sync', label: 'Abgleichen', handler: () => {} },
    ]);
    const { fake, bar } = start({
      commands,
      appMenu: false,
      windowMenu: false,
      labels: { edit: 'Bearbeiten', commands: 'Befehle', copy: 'Kopieren', undo: 'Widerrufen' },
    });
    await bar.ready;
    expect(fake.titles()).toEqual({
      Bearbeiten: [
        '<Undo:Widerrufen>',
        '<Redo>',
        '<Separator>',
        '<Cut>',
        '<Copy:Kopieren>',
        '<Paste>',
        '<SelectAll>',
        '<Separator>',
        'Suchen',
      ],
      Befehle: ['Abgleichen'],
    });
    bar.destroy();
  });

  it('lets a layout move commands, add built-in items and drop menus', async () => {
    const layout = vi.fn<NonNullable<MenuBarOptions['layout']>>((menus, { platform }) => {
      expect(platform).toBe('macos');
      const app = menus.find((menu) => menu.id === 'app')!;
      app.items.splice(1, 0, 'separator', { command: 'sync' }, { command: 'missing' }, 'separator');
      return [
        ...menus.filter((menu) => menu.id !== 'commands' && menu.id !== 'help'),
        {
          id: 'view-extra',
          label: 'Extra',
          items: [
            'separator',
            { predefined: 'Fullscreen', label: 'Full screen' },
            { command: 'sync' },
            'separator',
            'separator',
          ],
        },
        { id: 'empty', label: 'Empty', items: ['separator'] },
      ];
    });
    const { fake, bar } = start({ layout });
    await bar.ready;
    const titles = fake.titles()!;
    expect(titles[''].slice(0, 4)).toEqual(['<About>', '<Separator>', 'Sync now', '<Separator>']);
    expect(titles.Extra).toEqual(['<Fullscreen:Full screen>']);
    expect(titles.Empty).toBeUndefined();
    expect(titles.Help).toBeUndefined();
    bar.destroy();
  });

  it('gives About no name without an appName', async () => {
    const { fake, bar } = start();
    await bar.ready;
    expect((fake.bar.app!.items[0].items[0] as { item: unknown }).item).toEqual({ About: null });
    bar.destroy();
  });

  it('re-reads the registry on refresh', async () => {
    let ok = false;
    const commands = registry([
      { id: 'go', label: 'Go', group: 'Run', enabled: () => ok, handler: () => {} },
    ]);
    const { fake, bar } = start({ commands, debounce: 1000 });
    await bar.refresh();
    expect(fake.item('Go')!.enabled).toBe(false);
    ok = true;
    await bar.refresh();
    expect(fake.item('Go')!.enabled).toBe(true);
    await bar.ready;
    bar.destroy();
    await bar.refresh();
  });

  it('survives a capability that refuses the menu bar', async () => {
    const fake = fakeMenuBar({ initial: true });
    fake.menu.Menu.new.mockImplementation(async () => {
      const menu = {
        setAsAppMenu: vi.fn(async () => Promise.reject(new Error('denied'))),
        setAsWindowMenu: vi.fn(),
        close: vi.fn(async () => {}),
        items: [],
        name: 'x',
      };
      fake.menus.push(menu as never);
      return menu as never;
    });
    const { bar } = start({}, 'mac', fake);
    await bar.ready;
    expect(fake.bar.app).toBe(fake.initial);
    expect(fake.menus[0].close).toHaveBeenCalled();
    bar.destroy();
    await settle();
  });

  it('survives a refused item update', async () => {
    const { fake, bar, commands } = start();
    await bar.ready;
    fake.item('Save')!.setEnabled.mockRejectedValue(new Error('denied'));
    commands.update('save', { enabled: false });
    await settle();
    commands.update('save', { label: 'Store' });
    await settle();
    expect(fake.item('Store')).toBeDefined();
    bar.destroy();
  });

  it('survives a restore the capability refuses', async () => {
    const { fake, bar } = start();
    await bar.ready;
    fake.initial!.setAsAppMenu.mockRejectedValue(new Error('denied'));
    bar.destroy();
    await settle();
    expect(fake.initial!.close).toHaveBeenCalled();
  });
});

describe('menu bar helpers', () => {
  it('tells a menu-bar-capable module from a tray-only one', () => {
    expect(isMenuBarModule(fakeMenuBar().menu)).toBe(true);
    expect(isMenuBarModule({ Menu: { new: vi.fn() } })).toBe(false);
  });

  it('turns chords and function keys into accelerators', () => {
    const commands = registry([
      { id: 'a', label: 'A', shortcut: 'Alt+ArrowDown', handler: () => {} },
      { id: 'b', label: 'B', shortcut: 'Shift+N', handler: () => {} },
      { id: 'c', label: 'C', shortcut: 'Ctrl+Space', handler: () => {} },
      { id: 'd', label: 'D', shortcut: 'F12', handler: () => {} },
      { id: 'e', label: 'E', handler: () => {} },
    ]);
    expect(commands.list().map(menuAccelerator)).toEqual([
      'Alt+Down',
      null,
      'Ctrl+Space',
      'F12',
      null,
    ]);
  });
});

describe('setupTauri with a menu bar', () => {
  it('builds it with the menu module, and tears it down', async () => {
    enterTauri('mac');
    const fake = fakeMenuBar({ initial: true });
    const commands = registry();
    const desktop = setupTauri({
      plugins: { menu: fake.menu },
      menuBar: { commands, debounce: 0 },
    });
    await desktop.ready;
    expect(desktop.menuBar).toBeDefined();
    expect(fake.titles()!.File).toEqual(['New note', 'Save']);
    desktop.destroy();
    await settle();
    expect(fake.bar.app).toBe(fake.initial);
  });

  it('leaves it out with a tray-only module or without options', async () => {
    enterTauri('mac');
    const menu = { Menu: { new: vi.fn() } };
    const desktop = setupTauri({ plugins: { menu }, menuBar: { commands: registry() } });
    expect(desktop.menuBar).toBeUndefined();
    desktop.destroy();
    const fake = fakeMenuBar();
    const bare = setupTauri({ plugins: { menu: fake.menu } });
    expect(bare.menuBar).toBeUndefined();
    bare.destroy();
  });
});
