import { Dropzone } from '@loidolt/theme-svelte';
import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { createFileDrop, type DesktopFile } from '../src/lib/index.js';
import FileDropHarness from './FileDropHarness.svelte';
import { enterTauri, fakeFs, fakeWebview, flush } from './fakes.js';

const at = { x: 10, y: 20 };

describe('createFileDrop', () => {
  it('does nothing in a browser and never calls for the web view', () => {
    const webview = vi.fn(fakeWebview);
    const drop = createFileDrop({ webview });
    expect(webview).not.toHaveBeenCalled();
    expect(drop.dragging).toBe(false);
    expect(drop.paths).toEqual([]);
    drop.destroy();
  });

  it('tracks a drag over the window from enter to leave', () => {
    enterTauri('mac');
    const webview = fakeWebview();
    const drop = createFileDrop({ webview: () => webview });
    expect(webview.onDragDropEvent).toHaveBeenCalledOnce();
    webview.fire({ type: 'enter', paths: ['/a.pdf'], position: at });
    expect(drop.dragging).toBe(true);
    expect(drop.paths).toEqual(['/a.pdf']);
    webview.fire({ type: 'over', position: at });
    expect(drop.dragging).toBe(true);
    webview.fire({ type: 'leave' });
    expect(drop.dragging).toBe(false);
    expect(drop.paths).toEqual([]);
    // Some platforms report `over` without an `enter` first.
    webview.fire({ type: 'over', position: at });
    expect(drop.dragging).toBe(true);
    webview.fire({ type: 'enter', paths: undefined, position: at });
    expect(drop.paths).toEqual([]);
    drop.destroy();
  });

  it('reads dropped paths into files for onFiles and the target', async () => {
    enterTauri('mac');
    const webview = fakeWebview();
    const fs = fakeFs({ '/docs/a.md': '# A', '/docs/b.pdf': 'pdf' });
    const order: string[] = [];
    const onPaths = vi.fn(() => order.push('paths'));
    const onFiles = vi.fn((_files: DesktopFile[]) => order.push('files'));
    const onError = vi.fn();
    const target = { addFiles: vi.fn(() => order.push('target')) };
    const drop = createFileDrop({ webview, fs, onPaths, onFiles, onError, target });
    webview.fire({ type: 'enter', paths: ['/docs/a.md'], position: at });
    webview.fire({
      type: 'drop',
      paths: ['/docs/a.md', '/docs/folder', '/docs/b.pdf'],
      position: at,
    });
    expect(drop.dragging).toBe(false);
    expect(onPaths).toHaveBeenCalledWith(['/docs/a.md', '/docs/folder', '/docs/b.pdf']);
    await flush();
    const files = onFiles.mock.calls[0][0];
    expect(files.map((file) => [file.name, file.type, file.path])).toEqual([
      ['a.md', 'text/markdown', '/docs/a.md'],
      ['b.pdf', 'application/pdf', '/docs/b.pdf'],
    ]);
    expect(target.addFiles).toHaveBeenCalledWith(files);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), '/docs/folder');
    expect(order).toEqual(['paths', 'files', 'target']);
    drop.destroy();
  });

  it('reads the target at drop time, and skips a drop with nothing readable', async () => {
    enterTauri('windows');
    const webview = fakeWebview();
    const fs = fakeFs({ 'C:\\a.txt': 'a' });
    type Target = { addFiles: ReturnType<typeof vi.fn<(files: File[]) => void>> };
    let target = undefined as Target | undefined;
    const onFiles = vi.fn();
    const drop = createFileDrop({ webview, fs, onFiles, target: () => target });
    webview.fire({ type: 'drop', paths: ['C:\\a.txt'], position: at });
    await flush();
    expect(onFiles).toHaveBeenCalledOnce();
    target = { addFiles: vi.fn<(files: File[]) => void>() };
    webview.fire({ type: 'drop', paths: ['C:\\a.txt'], position: at });
    await flush();
    expect(target.addFiles).toHaveBeenCalledOnce();
    webview.fire({ type: 'drop', paths: ['C:\\missing'], position: at });
    webview.fire({ type: 'drop', paths: undefined, position: at });
    await flush();
    expect(onFiles).toHaveBeenCalledTimes(2);
    expect(target.addFiles).toHaveBeenCalledOnce();
    drop.destroy();
  });

  it('hands over only paths without fs', async () => {
    enterTauri('linux');
    const webview = fakeWebview();
    const onPaths = vi.fn();
    const onFiles = vi.fn();
    const drop = createFileDrop({ webview, onPaths, onFiles });
    webview.fire({ type: 'drop', paths: ['/a.txt'], position: at });
    await flush();
    expect(onPaths).toHaveBeenCalledWith(['/a.txt']);
    expect(onFiles).not.toHaveBeenCalled();
    drop.destroy();
  });

  it('stops listening on destroy, even before the listener has arrived', async () => {
    enterTauri('mac');
    const webview = fakeWebview();
    const fs = fakeFs({ '/a.txt': 'a' });
    const onFiles = vi.fn();
    const drop = createFileDrop({ webview, fs, onFiles });
    webview.fire({ type: 'enter', paths: ['/a.txt'], position: at });
    drop.destroy();
    drop.destroy();
    expect(drop.dragging).toBe(false);
    await flush();
    expect(webview.unlisten).toHaveBeenCalledOnce();
    webview.fire({ type: 'drop', paths: ['/a.txt'], position: at });
    await flush();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('drops files read after destroy on the floor', async () => {
    enterTauri('mac');
    const webview = fakeWebview();
    const fs = fakeFs({ '/a.txt': 'a' });
    const onFiles = vi.fn();
    const drop = createFileDrop({ webview, fs, onFiles });
    webview.fire({ type: 'drop', paths: ['/a.txt'], position: at });
    drop.destroy();
    await flush();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('survives a web view that is not there', () => {
    enterTauri('mac');
    const drop = createFileDrop({
      webview: () => {
        throw new Error('no runtime');
      },
    });
    expect(drop.dragging).toBe(false);
    drop.destroy();
  });
});

describe('createFileDrop with a Dropzone', () => {
  it('shows the window overlay while dragging and delivers the drop into it', async () => {
    enterTauri('mac');
    const webview = fakeWebview();
    const fs = fakeFs({ '/docs/a.pdf': 'pdf', '/docs/b.png': 'png' });
    const onFiles = vi.fn();
    const { container, unmount } = render(FileDropHarness, {
      props: { webview, fs, accept: '.pdf', onFiles },
    });
    const root = container.querySelector('.ldt-dropzone')!;
    expect(root).not.toHaveAttribute('data-window-dragging');
    webview.fire({ type: 'enter', paths: ['/docs/a.pdf'], position: at });
    flushSync();
    expect(root).toHaveAttribute('data-window-dragging');
    expect(container.querySelector('.ldt-dropzone__overlay')).not.toBeNull();
    webview.fire({ type: 'drop', paths: ['/docs/a.pdf', '/docs/b.png'], position: at });
    flushSync();
    expect(root).not.toHaveAttribute('data-window-dragging');
    await flush();
    flushSync();
    const [accepted, rejected] = onFiles.mock.calls[0];
    expect(accepted.map((file: File) => file.name)).toEqual(['a.pdf']);
    expect(rejected).toEqual([
      { file: expect.objectContaining({ name: 'b.png' }), reason: 'type' },
    ]);
    unmount();
    await flush();
    expect(webview.unlisten).toHaveBeenCalledOnce();
  });

  it('is the Dropzone itself that fits the target', () => {
    // A type-level check that a mounted Dropzone is a FileDropTarget.
    const fits = (dropzone: ReturnType<typeof Dropzone>) =>
      createFileDrop({ webview: fakeWebview(), target: dropzone });
    expect(fits).toBeTypeOf('function');
  });
});
