import { describe, expect, it, vi } from 'vitest';
import {
  createAppLifecycle,
  deepLinkPath,
  handleDeepLinks,
  pauseAllMedia,
} from '../src/lib/index.js';
import { fakeApp, flush, platform } from './fakes.js';

/** jsdom media never plays; the shared setup gives them a settable `paused`. */
function media(tag: 'video' | 'audio', playing: boolean) {
  const element = document.createElement(tag) as HTMLMediaElement & { __paused?: boolean };
  element.__paused = !playing;
  element.pause = vi.fn(() => {
    element.__paused = true;
  });
  document.body.append(element);
  return element;
}

describe('pauseAllMedia', () => {
  it('pauses what is playing and counts it', () => {
    const video = media('video', true);
    const audio = media('audio', true);
    const idle = media('video', false);
    expect(pauseAllMedia()).toBe(2);
    expect(video.pause).toHaveBeenCalled();
    expect(audio.pause).toHaveBeenCalled();
    expect(idle.pause).not.toHaveBeenCalled();
  });
});

describe('createAppLifecycle', () => {
  it('reports active and listens to nothing in a browser', () => {
    const App = fakeApp();
    const lifecycle = createAppLifecycle({ App });
    expect(lifecycle.active).toBe(true);
    expect(App.addListener).not.toHaveBeenCalled();
    lifecycle.destroy();
  });

  it('tracks the foreground and stops media in the background', async () => {
    platform.current = 'ios';
    const App = fakeApp();
    const onPause = vi.fn();
    const onResume = vi.fn();
    const lifecycle = createAppLifecycle({ App, onPause, onResume });
    await flush();
    const video = media('video', true);

    App.emit('appStateChange', { isActive: false });
    expect(lifecycle.active).toBe(false);
    expect(video.pause).toHaveBeenCalled();
    expect(onPause).toHaveBeenCalledOnce();

    App.emit('appStateChange', { isActive: false });
    expect(onPause).toHaveBeenCalledOnce();

    App.emit('appStateChange', { isActive: true });
    expect(lifecycle.active).toBe(true);
    expect(onResume).toHaveBeenCalledOnce();
    lifecycle.destroy();
    await flush();
    expect(App.count('appStateChange')).toBe(0);
  });

  it('leaves media playing when told to', async () => {
    platform.current = 'android';
    const App = fakeApp();
    const lifecycle = createAppLifecycle({ App, pauseMedia: false });
    await flush();
    const video = media('video', true);
    App.emit('appStateChange', { isActive: false });
    expect(video.pause).not.toHaveBeenCalled();
    lifecycle.destroy();
  });
});

describe('deepLinkPath', () => {
  it.each([
    ['https://topostack.app/projects/42?tab=layers#top', '/projects/42?tab=layers#top'],
    ['https://topostack.app', '/'],
    ['topostack://projects/42', '/projects/42'],
    ['topostack://projects//42/', '/projects/42/'],
    ['topostack://', '/'],
    ['not a url', null],
  ])('%s → %s', (url, path) => {
    expect(deepLinkPath(url)).toBe(path);
  });
});

describe('handleDeepLinks', () => {
  it('routes opening URLs through the app router', async () => {
    platform.current = 'ios';
    const App = fakeApp();
    const navigate = vi.fn();
    const stop = handleDeepLinks({ App, navigate });
    await flush();
    App.emit('appUrlOpen', { url: 'topostack://maps/9' });
    App.emit('appUrlOpen', { url: '::' });
    expect(navigate.mock.calls).toEqual([['/maps/9']]);
    stop();
  });

  it('takes a resolver of its own, and does nothing in a browser', async () => {
    const App = fakeApp();
    handleDeepLinks({ App, navigate: vi.fn() })();
    expect(App.addListener).not.toHaveBeenCalled();

    platform.current = 'android';
    const navigate = vi.fn();
    handleDeepLinks({ App, navigate, resolve: (url) => (url.includes('ok') ? '/ok' : null) });
    await flush();
    App.emit('appUrlOpen', { url: 'x://ok' });
    App.emit('appUrlOpen', { url: 'x://no' });
    expect(navigate.mock.calls).toEqual([['/ok']]);
  });
});
