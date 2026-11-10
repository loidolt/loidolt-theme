import { describe, expect, it, vi } from 'vitest';
import { createNotifications, setupTauri } from '../src/lib/index.js';
import { enterTauri, fakeNotification, fakeWebNotification } from './fakes.js';

const finished = { title: 'Export finished', body: 'The report is ready.' };
const toaster = () => ({ info: vi.fn() });

describe('createNotifications inside a Tauri window', () => {
  it('sends through the plugin once permission is granted', async () => {
    enterTauri('mac');
    const plugin = fakeNotification(true);
    const notifications = createNotifications({ plugin });
    expect(notifications.backend).toBe('tauri');
    await notifications.ready;
    expect(notifications.permission).toBe('granted');
    expect(await notifications.notify({ ...finished, silent: true })).toBe(true);
    expect(plugin.sendNotification).toHaveBeenCalledWith({
      title: 'Export finished',
      body: 'The report is ready.',
      icon: undefined,
      silent: true,
    });
  });

  it('asks for permission when it has none yet, and only then', async () => {
    enterTauri('mac');
    const plugin = fakeNotification(false, 'granted');
    const notifications = createNotifications({ plugin });
    await notifications.ready;
    expect(notifications.permission).toBe('default');
    expect(await notifications.notify(finished)).toBe(false);
    expect(plugin.sendNotification).not.toHaveBeenCalled();

    expect(await notifications.requestPermission()).toBe('granted');
    expect(notifications.permission).toBe('granted');
    expect(await notifications.requestPermission()).toBe('granted');
    expect(plugin.requestPermission).toHaveBeenCalledOnce();
    expect(await notifications.notify(finished)).toBe(true);
  });

  it('handles a denied permission without throwing, and toasts instead', async () => {
    enterTauri('mac');
    const plugin = fakeNotification(false, 'denied');
    const toasts = toaster();
    const notifications = createNotifications({ plugin, toaster: toasts });
    expect(await notifications.requestPermission()).toBe('denied');
    expect(await notifications.notify(finished)).toBe(false);
    expect(plugin.sendNotification).not.toHaveBeenCalled();
    expect(toasts.info).toHaveBeenCalledWith('Export finished', {
      description: 'The report is ready.',
    });
  });

  it('tells denied from not asked by the web view when the plugin says no', async () => {
    enterTauri('mac');
    fakeWebNotification('denied');
    const notifications = createNotifications({ plugin: fakeNotification(false) });
    await notifications.ready;
    expect(notifications.permission).toBe('denied');
  });

  it('survives a plugin missing from Rust, and a send or prompt that throws', async () => {
    enterTauri('mac');
    const plugin = fakeNotification(true);
    plugin.isPermissionGranted.mockRejectedValue(new Error('plugin not registered'));
    const broken = createNotifications({ plugin });
    await broken.ready;
    expect(broken.permission).toBe('default');
    plugin.requestPermission.mockRejectedValue(new Error('not allowed by the capability'));
    expect(await broken.requestPermission()).toBe('default');

    const granted = fakeNotification(true);
    granted.sendNotification.mockImplementation(() => {
      throw new Error('no notification centre');
    });
    const toasts = toaster();
    const notifications = createNotifications({ plugin: granted, toaster: toasts });
    expect(await notifications.notify(finished)).toBe(false);
    expect(toasts.info).toHaveBeenCalledOnce();
  });

  it('stays quiet after destroy', async () => {
    enterTauri('mac');
    const plugin = fakeNotification(true);
    const toasts = toaster();
    const notifications = createNotifications({ plugin, toaster: toasts });
    notifications.destroy();
    expect(await notifications.notify(finished)).toBe(false);
    expect(plugin.sendNotification).not.toHaveBeenCalled();
    expect(toasts.info).not.toHaveBeenCalled();
  });
});

describe('createNotifications in a browser', () => {
  it('ignores the plugin outside Tauri and uses the Web Notifications API', async () => {
    const plugin = fakeNotification(true);
    const { api, shown } = fakeWebNotification('default', 'granted');
    const notifications = createNotifications({ plugin });
    expect(notifications.backend).toBe('web');
    expect(notifications.permission).toBe('default');
    expect(plugin.isPermissionGranted).not.toHaveBeenCalled();

    expect(await notifications.requestPermission()).toBe('granted');
    expect(api.requestPermission).toHaveBeenCalledOnce();
    expect(await notifications.notify({ title: 'Job failed', icon: '/icon.png' })).toBe(true);
    expect(shown).toEqual([
      {
        title: 'Job failed',
        options: { body: undefined, icon: '/icon.png', silent: undefined },
      },
    ]);
    expect(plugin.sendNotification).not.toHaveBeenCalled();
  });

  it('starts from the permission the browser already has, and never re-prompts', async () => {
    const { api } = fakeWebNotification('denied');
    const notifications = createNotifications();
    expect(notifications.permission).toBe('denied');
    expect(await notifications.requestPermission()).toBe('denied');
    expect(api.requestPermission).not.toHaveBeenCalled();
    expect(await notifications.notify(finished)).toBe(false);
  });

  it('falls back to a toast where the constructor throws', async () => {
    const { api } = fakeWebNotification('granted');
    (api as unknown as { mockImplementation(fn: () => never): void }).mockImplementation(() => {
      throw new TypeError('Illegal constructor');
    });
    const toasts = toaster();
    const notifications = createNotifications({ toaster: toasts });
    expect(await notifications.notify(finished)).toBe(false);
    expect(toasts.info).toHaveBeenCalledOnce();
  });

  it('keeps the state when the prompt rejects', async () => {
    const { api } = fakeWebNotification('default');
    api.requestPermission.mockRejectedValue(new Error('blocked'));
    const notifications = createNotifications();
    expect(await notifications.requestPermission()).toBe('default');
  });

  it('is unsupported with no API at all, toasting when it can', async () => {
    const plain = createNotifications();
    expect(plain.backend).toBe('none');
    expect(plain.permission).toBe('unsupported');
    expect(await plain.requestPermission()).toBe('unsupported');
    expect(await plain.notify(finished)).toBe(false);

    const toasts = toaster();
    const toasting = createNotifications({ toaster: toasts });
    expect(await toasting.notify({ title: 'Job failed' })).toBe(false);
    expect(toasts.info).toHaveBeenCalledWith('Job failed', { description: undefined });
  });

  it('is unsupported in a Tauri window with neither the plugin nor the API', () => {
    enterTauri('mac');
    expect(createNotifications().backend).toBe('none');
  });
});

describe('setupTauri notifications', () => {
  it('exposes notifications through the plugin and waits for the permission', async () => {
    enterTauri('mac');
    const notification = fakeNotification(true);
    const toasts = toaster();
    const desktop = setupTauri({ plugins: { notification }, notifications: { toaster: toasts } });
    expect(desktop.notifications?.backend).toBe('tauri');
    await desktop.ready;
    expect(desktop.notifications?.permission).toBe('granted');
    desktop.destroy();
    expect(await desktop.notifications?.notify(finished)).toBe(false);
    expect(toasts.info).not.toHaveBeenCalled();
  });

  it('falls back to the web in a browser, and leaves them out when told to', () => {
    fakeWebNotification('granted');
    expect(setupTauri().notifications?.backend).toBe('web');
    expect(setupTauri({ notifications: false }).notifications).toBeUndefined();
  });
});
