import { describe, expect, it, vi } from 'vitest';
import {
  createTray,
  deepLinkPath,
  filesFromArgs,
  handleDeepLinks,
  handleSecondInstance,
  setupTauri,
} from '../src/lib/index.js';
import { enterTauri, fakeDeepLink, fakeEvent, fakeTrayModules, flush } from './fakes.js';

describe('filesFromArgs', () => {
  it('skips the executable, flags and URLs, and resolves relative paths', () => {
    expect(
      filesFromArgs(
        [
          '/Applications/App.app/Contents/MacOS/app',
          '--minimized',
          '-v',
          'notes/today.md',
          './draft.txt',
          '/tmp/report.pdf',
          'myapp://open/42',
          'https://example.com/file',
          '',
        ],
        '/Users/sam'
      )
    ).toEqual(['/Users/sam/notes/today.md', '/Users/sam/draft.txt', '/tmp/report.pdf']);
  });

  it('handles Windows paths, file URLs and a literal --', () => {
    expect(
      filesFromArgs(
        [
          'C:\\Program Files\\App\\app.exe',
          'report.docx',
          'D:\\Data\\sheet.csv',
          'file:///C:/Users/Sam/My%20File.txt',
          'file:///home/sam/a%20b.txt',
          'file://%zz',
          '--',
          '--strange-name.txt',
        ],
        'C:\\Users\\Sam\\'
      )
    ).toEqual([
      'C:\\Users\\Sam\\report.docx',
      'D:\\Data\\sheet.csv',
      'C:/Users/Sam/My File.txt',
      '/home/sam/a b.txt',
      'C:\\Users\\Sam\\--strange-name.txt',
    ]);
  });

  it('leaves relative paths alone without a working directory', () => {
    expect(filesFromArgs(['app', 'a.txt'])).toEqual(['a.txt']);
    expect(filesFromArgs([])).toEqual([]);
  });
});

describe('handleSecondInstance', () => {
  it('passes each second launch on, with its files', async () => {
    enterTauri('linux');
    const event = fakeEvent();
    const onSecondInstance = vi.fn();
    const stop = handleSecondInstance({ event, onSecondInstance });
    expect(event.listen).toHaveBeenCalledWith('single-instance', expect.any(Function));

    event.emit('single-instance', { args: ['app', 'notes.md', '--new-window'], cwd: '/home/sam' });
    expect(onSecondInstance).toHaveBeenLastCalledWith({
      args: ['app', 'notes.md', '--new-window'],
      cwd: '/home/sam',
      files: ['/home/sam/notes.md'],
    });

    event.emit('single-instance', { files: ['/Users/sam/a.txt'] });
    expect(onSecondInstance).toHaveBeenLastCalledWith({
      args: [],
      cwd: '',
      files: ['/Users/sam/a.txt'],
    });

    event.emit('single-instance', null);
    expect(onSecondInstance).toHaveBeenLastCalledWith({ args: [], cwd: '', files: [] });

    await flush();
    stop();
    event.emit('single-instance', { args: ['app', 'late.md'], cwd: '/' });
    expect(onSecondInstance).toHaveBeenCalledTimes(3);
    expect(event.unlisten).toHaveBeenCalledWith('single-instance');
  });

  it('listens for a custom event name', () => {
    enterTauri('windows');
    const event = fakeEvent();
    handleSecondInstance({ event, onSecondInstance: () => {}, eventName: 'app:launch' });
    expect(event.listen).toHaveBeenCalledWith('app:launch', expect.any(Function));
  });

  it('is a no-op in a browser and survives a listen that throws', () => {
    const event = fakeEvent();
    expect(handleSecondInstance({ event, onSecondInstance: () => {} })).toBeTypeOf('function');
    expect(event.listen).not.toHaveBeenCalled();

    enterTauri('mac');
    event.listen.mockImplementation(() => {
      throw new Error('event module unavailable');
    });
    expect(() => handleSecondInstance({ event, onSecondInstance: () => {} })()).not.toThrow();
  });
});

describe('deepLinkPath', () => {
  it('turns custom schemes and web links into in-app paths', () => {
    expect(deepLinkPath('myapp://projects/42?tab=files#top')).toBe('/projects/42?tab=files#top');
    expect(deepLinkPath('myapp://')).toBe('/');
    expect(deepLinkPath('https://example.com/a/b')).toBe('/a/b');
    expect(deepLinkPath('not a url')).toBeNull();
    expect(deepLinkPath('file:///Users/sam/notes.md')).toBeNull();
  });
});

describe('handleDeepLinks', () => {
  it('routes the link that launched the app', async () => {
    enterTauri('mac');
    const deepLink = fakeDeepLink(['myapp://projects/42']);
    const navigate = vi.fn();
    const onUrl = vi.fn();
    handleDeepLinks({ deepLink, navigate, onUrl });
    await flush();
    expect(onUrl).toHaveBeenCalledWith('myapp://projects/42');
    expect(navigate).toHaveBeenCalledWith('/projects/42');
  });

  it('routes links that arrive while running, and stops on teardown', async () => {
    enterTauri('mac');
    const deepLink = fakeDeepLink(null);
    const navigate = vi.fn();
    const stop = handleDeepLinks({
      deepLink,
      navigate,
      resolve: (url) => (url.includes('skip') ? null : deepLinkPath(url)),
    });
    await flush();
    expect(navigate).not.toHaveBeenCalled();
    deepLink.open('myapp://settings', 'myapp://skip');
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/settings');
    stop();
    deepLink.open('myapp://late');
    expect(navigate).toHaveBeenCalledOnce();
    expect(deepLink.unlisten).toHaveBeenCalledOnce();
  });

  it('prefers a link that arrived before the startup one was read', async () => {
    enterTauri('mac');
    const deepLink = fakeDeepLink(['myapp://old']);
    const navigate = vi.fn();
    handleDeepLinks({ deepLink, navigate });
    deepLink.open('myapp://new');
    await flush();
    expect(navigate.mock.calls).toEqual([['/new']]);
  });

  it('hands raw URLs to onUrl alone, and survives a plugin missing from Rust', async () => {
    enterTauri('mac');
    const deepLink = fakeDeepLink(['myapp://a']);
    const onUrl = vi.fn();
    handleDeepLinks({ deepLink, onUrl });
    await flush();
    expect(onUrl).toHaveBeenCalledWith('myapp://a');

    const broken = fakeDeepLink();
    broken.getCurrent.mockRejectedValue(new Error('not registered'));
    broken.onOpenUrl.mockImplementation(() => {
      throw new Error('not registered');
    });
    expect(() => handleDeepLinks({ deepLink: broken, onUrl })()).not.toThrow();
    await flush();
  });

  it('is a no-op in a browser', () => {
    const deepLink = fakeDeepLink(['myapp://a']);
    handleDeepLinks({ deepLink, navigate: () => {} })();
    expect(deepLink.getCurrent).not.toHaveBeenCalled();
    expect(deepLink.onOpenUrl).not.toHaveBeenCalled();
  });
});

describe('createTray', () => {
  it('creates an icon with a tooltip and a menu built from the items', async () => {
    enterTauri('mac');
    const { tray, menu, icons, menus } = fakeTrayModules();
    const show = vi.fn();
    const created = createTray({
      tray,
      menu,
      id: 'main',
      icon: Promise.resolve('icons/tray.png'),
      tooltip: 'Watching for new files',
      title: '2',
      iconAsTemplate: true,
      items: [
        { id: 'show', label: 'Show window', action: show },
        'separator',
        { id: 'pause', label: 'Pause', enabled: false },
        'quit',
      ],
    });
    await created.ready;
    expect(menus).toHaveLength(1);
    expect(menus[0].items).toEqual([
      { id: 'show', text: 'Show window', enabled: true, action: expect.any(Function) },
      { item: 'Separator' },
      { id: 'pause', text: 'Pause', enabled: false, action: undefined },
      { item: 'Quit' },
    ]);
    (menus[0].items[0] as { action: (id: string) => void }).action('show');
    expect(show).toHaveBeenCalledOnce();
    expect(icons[0].options).toMatchObject({
      id: 'main',
      icon: 'icons/tray.png',
      tooltip: 'Watching for new files',
      title: '2',
      menu: menus[0],
      iconAsTemplate: true,
      showMenuOnLeftClick: true,
      action: undefined,
    });
  });

  it('runs onClick on a left click only, keeping the menu for the right', async () => {
    enterTauri('windows');
    const { tray, menu, icons, menus } = fakeTrayModules();
    const onClick = vi.fn();
    await createTray({ tray, menu, onClick }).ready;
    expect(menus).toHaveLength(0);
    const {
      action,
      showMenuOnLeftClick,
      icon,
      menu: none,
    } = icons[0].options as {
      action: (event: object) => void;
      showMenuOnLeftClick: boolean;
      icon: unknown;
      menu: unknown;
    };
    expect(showMenuOnLeftClick).toBe(false);
    expect(icon).toBeUndefined();
    expect(none).toBeUndefined();
    action({ type: 'Click', button: 'Right', buttonState: 'Up' });
    action({ type: 'Click', button: 'Left', buttonState: 'Down' });
    action({ type: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    action({ type: 'Click', button: 'Left', buttonState: 'Up' });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('updates what it is given and swaps the menu, freeing the old one', async () => {
    enterTauri('mac');
    const { tray, menu, icons, menus } = fakeTrayModules();
    const created = createTray({ tray, menu, items: [{ id: 'a', label: 'A' }] });
    await created.update({ tooltip: '2 jobs running' });
    const [icon] = icons;
    expect(icon.setTooltip).toHaveBeenCalledWith('2 jobs running');
    expect(icon.setTitle).not.toHaveBeenCalled();
    expect(icon.setMenu).not.toHaveBeenCalled();

    await created.update({ title: undefined, icon: Promise.resolve(null), items: [] });
    expect(icon.setTitle).toHaveBeenCalledWith(null);
    expect(icon.setIcon).toHaveBeenCalledWith(null);
    expect(icon.setMenu).toHaveBeenCalledWith(null);
    expect(menus[0].close).toHaveBeenCalledOnce();

    await created.update({ items: [{ id: 'b', label: 'B' }] });
    expect(icon.setMenu).toHaveBeenLastCalledWith(menus[1]);

    icon.setTooltip.mockRejectedValue(new Error('not allowed'));
    await expect(created.update({ tooltip: 'x' })).resolves.toBeUndefined();

    created.destroy();
    created.destroy();
    expect(icon.close).toHaveBeenCalledOnce();
    expect(menus[1].close).toHaveBeenCalledOnce();
    await created.update({ tooltip: 'gone' });
    expect(icon.setTooltip).toHaveBeenCalledTimes(2);
  });

  it('removes an icon that arrives after an early teardown', async () => {
    enterTauri('mac');
    const { tray, menu, icons, menus } = fakeTrayModules();
    const before = createTray({ tray, menu, items: [{ id: 'a', label: 'A' }] });
    before.destroy();
    await before.ready;
    expect(menus[0].close).toHaveBeenCalledOnce();
    expect(icons).toHaveLength(0);

    let release!: () => void;
    tray.TrayIcon.new.mockImplementationOnce(async (options = {}) => {
      await new Promise<void>((resolve) => (release = resolve));
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
    });
    const during = createTray({ tray, menu, items: [{ id: 'b', label: 'B' }] });
    await flush();
    during.destroy();
    expect(menus[1].close).toHaveBeenCalledOnce();
    release();
    await during.ready;
    expect(icons[0].close).toHaveBeenCalledOnce();
    expect(menus[1].close).toHaveBeenCalledOnce();
  });

  it('frees a menu built after a teardown mid-update', async () => {
    enterTauri('mac');
    const { tray, menu, icons, menus } = fakeTrayModules();
    const created = createTray({ tray, menu });
    await created.ready;
    let release!: () => void;
    const late = { items: [], close: vi.fn(async () => {}) };
    menu.Menu.new.mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => (release = resolve));
      return late;
    });
    const pending = created.update({ items: [{ id: 'a', label: 'A' }] });
    await flush();
    created.destroy();
    release();
    await pending;
    expect(icons[0].setMenu).not.toHaveBeenCalled();
    expect(late.close).toHaveBeenCalledOnce();
    expect(menus).toHaveLength(0);
  });

  it('survives a tray the capability does not allow', async () => {
    enterTauri('linux');
    const { tray, menu } = fakeTrayModules();
    tray.TrayIcon.new.mockRejectedValue(new Error('not allowed'));
    const created = createTray({ tray, menu });
    await expect(created.ready).resolves.toBeUndefined();
    await created.update({ tooltip: 'x' });
    expect(() => created.destroy()).not.toThrow();
  });

  it('is a no-op in a browser, swallowing an icon that cannot load there', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    const { tray, menu } = fakeTrayModules();
    const created = createTray({
      tray,
      menu,
      icon: Promise.reject(new Error('no IPC')),
      items: [{ id: 'a', label: 'A' }],
    });
    await created.ready;
    await created.update({ tooltip: 'x', icon: Promise.reject(new Error('no IPC')) });
    await flush();
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    created.destroy();
    expect(tray.TrayIcon.new).not.toHaveBeenCalled();
    expect(menu.Menu.new).not.toHaveBeenCalled();
  });
});

describe('setupTauri lifecycle', () => {
  it('wires second launches, deep links and the tray, and removes them all', async () => {
    enterTauri('mac');
    const event = fakeEvent();
    const deepLink = fakeDeepLink(['myapp://inbox']);
    const { tray, menu, icons } = fakeTrayModules();
    const onSecondInstance = vi.fn();
    const navigate = vi.fn();
    const desktop = setupTauri({
      plugins: { event, deepLink, tray, menu },
      singleInstance: { onSecondInstance },
      deepLinks: { navigate },
      tray: { tooltip: 'Running', items: [{ id: 'quit', label: 'Quit' }] },
    });
    await desktop.ready;
    expect(icons).toHaveLength(1);
    expect(navigate).toHaveBeenCalledWith('/inbox');
    event.emit('single-instance', { args: ['app', 'a.md'], cwd: '/w' });
    expect(onSecondInstance).toHaveBeenCalledWith({
      args: ['app', 'a.md'],
      cwd: '/w',
      files: ['/w/a.md'],
    });
    await desktop.tray?.update({ tooltip: 'Idle' });
    expect(icons[0].setTooltip).toHaveBeenCalledWith('Idle');

    desktop.destroy();
    expect(icons[0].close).toHaveBeenCalledOnce();
    expect(deepLink.unlisten).toHaveBeenCalledOnce();
    expect(event.unlisten).toHaveBeenCalledOnce();
  });

  it('leaves each piece off without its module or its options', () => {
    enterTauri('mac');
    const event = fakeEvent();
    const deepLink = fakeDeepLink();
    const { tray, menu } = fakeTrayModules();
    const desktop = setupTauri({ plugins: { event, deepLink, tray }, tray: {} });
    expect(desktop.tray).toBeUndefined();
    expect(event.listen).not.toHaveBeenCalled();
    expect(deepLink.onOpenUrl).not.toHaveBeenCalled();
    expect(setupTauri({ plugins: { tray, menu } }).tray).toBeUndefined();
  });
});
