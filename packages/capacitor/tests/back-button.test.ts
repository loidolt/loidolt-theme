import { Dialog } from '@loidolt/theme-svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeTopLayer, handleBackButton } from '../src/lib/index.js';
import { fakeApp, flush, platform } from './fakes.js';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

afterEach(() => {
  vi.restoreAllMocks();
});

async function setup(options: Omit<Parameters<typeof handleBackButton>[0], 'App'> = {}) {
  platform.current = 'android';
  const App = fakeApp();
  const stop = handleBackButton({ App, ...options });
  await flush();
  const back = vi.spyOn(history, 'back').mockImplementation(() => {});
  return { App, stop, back };
}

describe('closeTopLayer', () => {
  it('reports nothing taken when nothing listens', () => {
    expect(closeTopLayer()).toBe(false);
  });

  it('sends Escape from the focused element and reports a handler that took it', () => {
    const field = document.createElement('input');
    document.body.append(field);
    field.focus();
    const seen = vi.fn((event: KeyboardEvent) => {
      expect(event.target).toBe(field);
      event.preventDefault();
    });
    document.addEventListener('keydown', seen);
    expect(closeTopLayer()).toBe(true);
    expect(seen).toHaveBeenCalledOnce();
    document.removeEventListener('keydown', seen);
  });
});

describe('handleBackButton', () => {
  it('only listens on Android', async () => {
    platform.current = 'ios';
    const App = fakeApp();
    handleBackButton({ App });
    await flush();
    expect(App.addListener).not.toHaveBeenCalled();
  });

  it('closes an open dialog instead of navigating behind it', async () => {
    const { App, back, stop } = await setup();
    const onOpenChange = vi.fn();
    render(Dialog, { title: 'Edit sheet', open: true, onOpenChange, children: text('Body') });
    await screen.findByRole('dialog');
    App.emit('backButton', { canGoBack: true });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(back).not.toHaveBeenCalled();
    stop();
  });

  it('lets the app handle it before history', async () => {
    const onBack = vi.fn(() => true);
    const { App, back } = await setup({ onBack });
    App.emit('backButton', { canGoBack: true });
    expect(onBack).toHaveBeenCalledWith({ canGoBack: true });
    expect(back).not.toHaveBeenCalled();
  });

  it('goes back through history when there is some', async () => {
    const { App, back } = await setup({ onBack: () => {} });
    App.emit('backButton', { canGoBack: true });
    expect(back).toHaveBeenCalledOnce();
    expect(App.minimizeApp).not.toHaveBeenCalled();
  });

  it('backgrounds the app at the start of history by default', async () => {
    const { App } = await setup();
    App.emit('backButton', { canGoBack: false });
    expect(App.minimizeApp).toHaveBeenCalledOnce();
    expect(App.exitApp).not.toHaveBeenCalled();
  });

  it('exits, or does nothing, at the start of history when asked', async () => {
    const exiting = await setup({ atRoot: 'exit' });
    exiting.App.emit('backButton', { canGoBack: false });
    expect(exiting.App.exitApp).toHaveBeenCalledOnce();
    exiting.stop();

    const staying = await setup({ atRoot: 'none' });
    staying.App.emit('backButton', { canGoBack: false });
    expect(staying.App.exitApp).not.toHaveBeenCalled();
    expect(staying.App.minimizeApp).not.toHaveBeenCalled();
  });

  it('removes its listener', async () => {
    const { App, stop } = await setup();
    expect(App.count('backButton')).toBe(1);
    stop();
    await flush();
    expect(App.count('backButton')).toBe(0);
  });
});
