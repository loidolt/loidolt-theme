import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createShare, SHARE_CACHE_PATH } from '../src/lib/index.js';
import { fakeFilesystem, fakeShare, fakeToaster, platform } from './fakes.js';

const pdf = () => new File(['%PDF-1.7'], 'export.pdf', { type: 'application/pdf' });

/** Puts `value` on `navigator` for one test. */
function stub<K extends 'share' | 'canShare' | 'clipboard'>(name: K, value: unknown) {
  Object.defineProperty(navigator, name, { configurable: true, value });
}

const abort = () => Object.assign(new Error('Share canceled'), { name: 'AbortError' });

let clicks: HTMLAnchorElement[];

beforeEach(() => {
  clicks = [];
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    clicks.push(this);
  });
  URL.createObjectURL = vi.fn(() => 'blob:download');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  for (const name of ['share', 'canShare', 'clipboard']) {
    delete (navigator as unknown as Record<string, unknown>)[name];
  }
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('createShare in a native shell', () => {
  it('opens the native share sheet with a link and text', async () => {
    platform.current = 'ios';
    const Share = fakeShare({ activityType: 'com.apple.UIKit.activity.Mail' });
    const outcome = await createShare({ Share }).share({
      title: 'Field notes',
      text: 'The latest notes',
      url: 'https://example.com/notes',
    });
    expect(outcome).toEqual({
      method: 'native',
      cancelled: false,
      activityType: 'com.apple.UIKit.activity.Mail',
    });
    expect(Share.share).toHaveBeenCalledWith({
      title: 'Field notes',
      text: 'The latest notes',
      url: 'https://example.com/notes',
      files: undefined,
      dialogTitle: undefined,
    });
  });

  it('writes files to the cache, clears the last share, and shares their URIs', async () => {
    platform.current = 'android';
    const Share = fakeShare();
    const Filesystem = fakeFilesystem();
    const sharing = createShare({ Share, Filesystem });
    await sharing.share({
      files: [pdf(), { blob: new Blob(['a,b']), name: '../export.csv' }, { uri: 'file:///kept' }],
      dialogTitle: 'Share the exported file',
    });

    expect(Filesystem.rmdir).toHaveBeenCalledWith({
      path: SHARE_CACHE_PATH,
      directory: 'CACHE',
      recursive: true,
    });
    expect(Filesystem.writeFile).toHaveBeenCalledTimes(2);
    expect(Filesystem.files.get(`CACHE/${SHARE_CACHE_PATH}/0/export.pdf`)).toBe(btoa('%PDF-1.7'));
    expect(Filesystem.files.get(`CACHE/${SHARE_CACHE_PATH}/1/-export.csv`)).toBe(btoa('a,b'));
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [
          `file:///CACHE/${SHARE_CACHE_PATH}/0/export.pdf`,
          `file:///CACHE/${SHARE_CACHE_PATH}/1/-export.csv`,
          'file:///kept',
        ],
        dialogTitle: 'Share the exported file',
      })
    );

    await sharing.share({ files: [pdf()] });
    expect(Filesystem.files.size).toBe(1);
  });

  it('shares file URIs without touching the filesystem', async () => {
    platform.current = 'ios';
    const Share = fakeShare();
    await createShare({ Share }).share({ files: [{ uri: 'file:///doc.epub' }] });
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///doc.epub'] })
    );
  });

  it('still shares when clearing the cache fails', async () => {
    platform.current = 'ios';
    const Share = fakeShare();
    const Filesystem = fakeFilesystem();
    Filesystem.rmdir.mockRejectedValueOnce(new Error('Folder does not exist'));
    await createShare({ Share, Filesystem }).share({ files: [pdf()] });
    expect(Share.share).toHaveBeenCalledOnce();
  });

  it('reports a cancelled sheet as cancelled, not as an error', async () => {
    platform.current = 'android';
    const Share = fakeShare();
    Share.share.mockRejectedValueOnce(new Error('Share canceled'));
    await expect(createShare({ Share }).share({ text: 'Hello' })).resolves.toEqual({
      method: 'native',
      cancelled: true,
    });
  });

  it('rejects on a real failure', async () => {
    platform.current = 'ios';
    const Share = fakeShare();
    Share.share.mockRejectedValueOnce(new Error("Can't share while sharing is in progress"));
    await expect(createShare({ Share }).share({ text: 'Hello' })).rejects.toThrow('in progress');
  });

  it('needs Filesystem to share a Blob', async () => {
    platform.current = 'ios';
    const Share = fakeShare();
    await expect(createShare({ Share }).share({ files: [pdf()] })).rejects.toThrow('Filesystem');
    expect(Share.share).not.toHaveBeenCalled();
  });

  it('asks the plugin whether it can share', async () => {
    platform.current = 'ios';
    const Share = fakeShare();
    expect(await createShare({ Share }).canShare()).toBe(true);
    expect(await createShare({ Share }).canShare({ files: [pdf()] })).toBe(false);
    expect(
      await createShare({ Share, Filesystem: fakeFilesystem() }).canShare({ files: [pdf()] })
    ).toBe(true);
    Share.canShare.mockResolvedValueOnce({ value: false });
    expect(await createShare({ Share }).canShare()).toBe(false);
    Share.canShare.mockRejectedValueOnce(new Error('not implemented'));
    expect(await createShare({ Share }).canShare()).toBe(false);
  });

  it('uses the Web Share API when no plugin is given', async () => {
    platform.current = 'ios';
    const share = vi.fn(async () => {});
    stub('share', share);
    expect(await createShare().share({ url: 'https://example.com/' })).toEqual({
      method: 'web',
      cancelled: false,
    });
  });
});

describe('createShare in a browser', () => {
  it('ignores the native plugin and uses the Web Share API', async () => {
    const Share = fakeShare();
    const share = vi.fn(async (_data: ShareData) => {});
    stub('share', share);
    stub('canShare', () => true);
    const file = pdf();
    const outcome = await createShare({ Share }).share({
      title: 'Export',
      files: [file, { blob: new Blob(['x'], { type: 'text/plain' }), name: 'notes.txt' }],
    });
    expect(outcome).toEqual({ method: 'web', cancelled: false });
    expect(Share.share).not.toHaveBeenCalled();
    const data = share.mock.calls[0]![0];
    expect(data.title).toBe('Export');
    expect(data.files![0]).toBe(file);
    expect(data.files![1]).toBeInstanceOf(File);
    expect(data.files![1]!.name).toBe('notes.txt');
    expect(data.files![1]!.type).toBe('text/plain');
  });

  it('treats AbortError as a cancel', async () => {
    stub('share', vi.fn().mockRejectedValue(abort()));
    expect(await createShare().share({ text: 'Hello' })).toEqual({
      method: 'web',
      cancelled: true,
    });
  });

  it('downloads files the browser cannot share', async () => {
    vi.useFakeTimers();
    const share = vi.fn(async () => {});
    stub('share', share);
    stub('canShare', () => false);
    const outcome = await createShare().share({
      files: [pdf(), { blob: new Blob(['x']), name: 'notes.txt' }],
    });
    expect(outcome).toEqual({ method: 'download', cancelled: false });
    expect(share).not.toHaveBeenCalled();
    expect(clicks.map((anchor) => anchor.download)).toEqual(['export.pdf', 'notes.txt']);
    expect(clicks[0]!.href).toBe('blob:download');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('downloads files where the browser has no canShare', async () => {
    stub('share', vi.fn());
    expect((await createShare().share({ files: [pdf()] })).method).toBe('download');
  });

  it('downloads files where there is no Web Share API at all', async () => {
    expect((await createShare().share({ files: [pdf()] })).method).toBe('download');
    expect(clicks).toHaveLength(1);
  });

  it('falls back when the browser refuses to share', async () => {
    stub(
      'share',
      vi.fn().mockRejectedValue(Object.assign(new Error('no'), { name: 'NotAllowedError' }))
    );
    stub('canShare', () => true);
    expect((await createShare().share({ files: [pdf()] })).method).toBe('download');
  });

  it('falls back when canShare throws', async () => {
    stub('share', vi.fn());
    stub('canShare', () => {
      throw new TypeError('bad');
    });
    expect((await createShare().share({ files: [pdf()] })).method).toBe('download');
  });

  it('copies a link, with a toast, when there is no share sheet', async () => {
    const writeText = vi.fn(async () => {});
    stub('clipboard', { writeText });
    const toaster = fakeToaster();
    const outcome = await createShare({ toaster }).share({
      text: 'Have a look',
      url: 'https://example.com/a',
    });
    expect(outcome).toEqual({ method: 'clipboard', cancelled: false });
    expect(writeText).toHaveBeenCalledWith('https://example.com/a');
    expect(toaster.success).toHaveBeenCalledWith('Link copied');

    await createShare({ copiedLabel: 'Copied' }).share({ text: 'Plain text' });
    expect(writeText).toHaveBeenLastCalledWith('Plain text');
  });

  it('opens a link instead, when asked', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const outcome = await createShare({ fallback: 'open' }).share({ url: 'https://example.com/' });
    expect(outcome).toEqual({ method: 'open', cancelled: false });
    expect(open).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener');
    expect((await createShare({ fallback: 'open' }).share({ text: 'Only text' })).method).toBe(
      'none'
    );
  });

  it('does nothing for a link with the fallback off, or without a clipboard', async () => {
    expect(
      (await createShare({ fallback: false }).share({ url: 'https://example.com/' })).method
    ).toBe('none');
    expect((await createShare().share({ url: 'https://example.com/' })).method).toBe('none');
  });

  it('cannot share a native file URI', async () => {
    await expect(createShare().share({ files: [{ uri: 'file:///a.pdf' }] })).rejects.toThrow(
      'native shell'
    );
  });

  it('rejects empty content', async () => {
    await expect(createShare().share({})).rejects.toThrow(TypeError);
  });

  it('knows whether a share sheet is there', async () => {
    const sharing = createShare();
    expect(await sharing.canShare()).toBe(false);
    stub('share', vi.fn());
    expect(await sharing.canShare()).toBe(true);
    expect(await sharing.canShare({ files: [pdf()] })).toBe(false);
    stub('canShare', (data: ShareData) => data.files?.length === 1);
    expect(await sharing.canShare({ files: [pdf()] })).toBe(true);
    expect(await sharing.canShare({ files: [{ uri: 'file:///a' }] })).toBe(false);
  });
});
