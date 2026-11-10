import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acceptToMimeTypes, createFiles, FilePermissionError } from '../src/lib/index.js';
import { blobToBase64 } from '../src/lib/blob.js';
import { fakeFilePicker, fakeFilesystem, platform } from './fakes.js';

const pdf = () => new File(['%PDF-1.7'], 'export.pdf', { type: 'application/pdf' });

let inputs: HTMLInputElement[];
let anchors: HTMLAnchorElement[];

beforeEach(() => {
  inputs = [];
  anchors = [];
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
    this: HTMLInputElement
  ) {
    inputs.push(this);
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    anchors.push(this);
  });
  URL.createObjectURL = vi.fn(() => 'blob:download');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Settles the hidden input the browser picker opened with `files`. */
function choose(files: File[]) {
  const input = inputs.at(-1)!;
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new Event('change'));
}

describe('acceptToMimeTypes', () => {
  it('turns an accept attribute into MIME types', () => {
    expect(acceptToMimeTypes('.pdf, image/*,application/epub+zip,.JPG,.jpeg')).toEqual([
      'application/pdf',
      'image/*',
      'application/epub+zip',
      'image/jpeg',
    ]);
  });

  it('means anything when it cannot say', () => {
    expect(acceptToMimeTypes(undefined)).toBeUndefined();
    expect(acceptToMimeTypes(' ')).toBeUndefined();
    expect(acceptToMimeTypes('*/*')).toBeUndefined();
    expect(acceptToMimeTypes('.pdf,.unknownext')).toBeUndefined();
    expect(acceptToMimeTypes('audio')).toBeUndefined();
  });
});

describe('pick in a native shell', () => {
  it('opens the native picker and reads the files back as Files', async () => {
    platform.current = 'ios';
    // jsdom's File only takes jsdom's Blob, so the response is a stand-in rather than Node's.
    const fetch = vi.fn(async (url: string) => ({
      ok: true,
      blob: async () => new Blob([`data from ${url}`]),
    }));
    vi.stubGlobal('fetch', fetch);
    const FilePicker = fakeFilePicker([
      {
        name: 'a.pdf',
        mimeType: 'application/pdf',
        size: 3,
        modifiedAt: 1_700_000_000_000,
        webPath: 'capacitor://localhost/_capacitor_file_/a.pdf',
      },
      { name: 'b.pdf', mimeType: '', size: 3, path: '/tmp/b.pdf' },
    ]);
    const files = await createFiles({ FilePicker }).pick({ accept: '.pdf', multiple: true });

    expect(FilePicker.pickFiles).toHaveBeenCalledWith({ types: ['application/pdf'], limit: 0 });
    expect(files).toHaveLength(2);
    expect(files[0]).toBeInstanceOf(File);
    expect(files[0]!.name).toBe('a.pdf');
    expect(files[0]!.type).toBe('application/pdf');
    expect(files[0]!.lastModified).toBe(1_700_000_000_000);
    expect(atob(await blobToBase64(files[0]!))).toBe(
      'data from capacitor://localhost/_capacitor_file_/a.pdf'
    );
    expect(fetch).toHaveBeenLastCalledWith('capacitor://localhost/_capacitor_file_/tmp/b.pdf');
    expect(inputs).toHaveLength(0);
  });

  it('uses a blob the plugin already has, and picks one by default', async () => {
    platform.current = 'android';
    const blob = new Blob(['x'], { type: 'text/plain' });
    const FilePicker = fakeFilePicker([{ name: 'n.txt', mimeType: '', size: 1, blob }]);
    const [file] = await createFiles({ FilePicker }).pick();
    expect(FilePicker.pickFiles).toHaveBeenCalledWith({ types: undefined, limit: 1 });
    expect(file!.type).toBe('text/plain');
  });

  it('resolves no files when the picker is dismissed', async () => {
    platform.current = 'ios';
    const FilePicker = fakeFilePicker();
    FilePicker.pickFiles.mockRejectedValueOnce(new Error('pickFiles canceled.'));
    expect(await createFiles({ FilePicker }).pick()).toEqual([]);
  });

  it('rejects on a real failure', async () => {
    platform.current = 'ios';
    const FilePicker = fakeFilePicker();
    FilePicker.pickFiles.mockRejectedValueOnce(new Error('Unknown error'));
    await expect(createFiles({ FilePicker }).pick()).rejects.toThrow('Unknown error');
  });

  it('rejects when a picked file cannot be read', async () => {
    platform.current = 'ios';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 }))
    );
    const unreadable = fakeFilePicker([{ name: 'a', mimeType: '', size: 0, path: '/a' }]);
    await expect(createFiles({ FilePicker: unreadable }).pick()).rejects.toThrow('Could not read');
    const pathless = fakeFilePicker([{ name: 'b', mimeType: '', size: 0 }]);
    await expect(createFiles({ FilePicker: pathless }).pick()).rejects.toThrow('no path');
  });

  it('falls back to the file input without the plugin', async () => {
    platform.current = 'ios';
    const picking = createFiles().pick();
    choose([pdf()]);
    expect(await picking).toHaveLength(1);
  });
});

describe('pick in a browser', () => {
  it('opens a hidden file input with the same accept and multiple', async () => {
    const FilePicker = fakeFilePicker();
    const picking = createFiles({ FilePicker }).pick({ accept: '.pdf', multiple: true });
    const input = inputs[0]!;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('.pdf');
    expect(input.multiple).toBe(true);
    expect(input.hidden).toBe(true);
    expect(input.isConnected).toBe(true);
    const file = pdf();
    choose([file]);
    expect(await picking).toEqual([file]);
    expect(input.isConnected).toBe(false);
    expect(FilePicker.pickFiles).not.toHaveBeenCalled();
  });

  it('resolves no files when the picker is cancelled', async () => {
    const picking = createFiles().pick();
    expect(inputs[0]!.accept).toBe('');
    expect(inputs[0]!.multiple).toBe(false);
    inputs[0]!.dispatchEvent(new Event('cancel'));
    expect(await picking).toEqual([]);
    expect(inputs[0]!.isConnected).toBe(false);
  });

  it('resolves no files for an empty change', async () => {
    const picking = createFiles().pick();
    Object.defineProperty(inputs[0]!, 'files', { value: null });
    inputs[0]!.dispatchEvent(new Event('change'));
    expect(await picking).toEqual([]);
  });
});

describe('save in a native shell', () => {
  it('writes the file to Documents as base64', async () => {
    platform.current = 'ios';
    const Filesystem = fakeFilesystem();
    const outcome = await createFiles({ Filesystem }).save(pdf());
    expect(outcome).toEqual({
      method: 'filesystem',
      uri: 'file:///DOCUMENTS/export.pdf',
      path: 'export.pdf',
      directory: 'DOCUMENTS',
    });
    expect(Filesystem.files.get('DOCUMENTS/export.pdf')).toBe(btoa('%PDF-1.7'));
    expect(Filesystem.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ recursive: true, directory: 'DOCUMENTS' })
    );
    expect(Filesystem.checkPermissions).not.toHaveBeenCalled();
    expect(anchors).toHaveLength(0);
  });

  it('numbers a name that is taken, unless asked to overwrite', async () => {
    platform.current = 'ios';
    const Filesystem = fakeFilesystem();
    const files = createFiles({ Filesystem });
    const blob = { blob: new Blob(['x']), name: 'notes.txt' };
    await files.save(blob, { folder: 'Exports' });
    expect((await files.save(blob, { folder: 'Exports' })) as { path: string }).toMatchObject({
      path: 'Exports/notes (1).txt',
    });
    expect(await files.save(blob, { folder: '/Exports/' })).toMatchObject({
      path: 'Exports/notes (2).txt',
    });
    expect(await files.save(blob, { folder: 'Exports', overwrite: true })).toMatchObject({
      path: 'Exports/notes.txt',
    });
    await files.save({ blob: new Blob(['x']), name: 'README' });
    expect(await files.save({ blob: new Blob(['x']), name: 'README' })).toMatchObject({
      path: 'README (1)',
    });
    expect(
      await files.save({ blob: new Blob(['x']), name: 'top' }, { overwrite: true })
    ).toMatchObject({ path: 'top' });
  });

  it('gives up after too many copies', async () => {
    platform.current = 'ios';
    const Filesystem = fakeFilesystem();
    Filesystem.stat.mockResolvedValue({ uri: 'file:///taken' });
    await expect(createFiles({ Filesystem }).save(pdf())).rejects.toThrow('Too many');
  });

  it('keeps a folder and a name inside the directory', async () => {
    platform.current = 'ios';
    const Filesystem = fakeFilesystem();
    const outcome = await createFiles({ Filesystem, directory: 'DATA' }).save(
      { blob: new Blob(['x']), name: '../escape.txt' },
      { folder: '../up/../Exports' }
    );
    expect(outcome).toMatchObject({ path: 'up/Exports/-escape.txt', directory: 'DATA' });
  });

  it('asks for storage access on Android when it is needed', async () => {
    platform.current = 'android';
    const Filesystem = fakeFilesystem('prompt', 'granted');
    await createFiles({ Filesystem }).save(pdf());
    expect(Filesystem.requestPermissions).toHaveBeenCalledOnce();
    expect(Filesystem.writeFile).toHaveBeenCalledOnce();
  });

  it('does not ask again once access is granted', async () => {
    platform.current = 'android';
    const Filesystem = fakeFilesystem('granted');
    await createFiles({ Filesystem }).save(pdf());
    expect(Filesystem.requestPermissions).not.toHaveBeenCalled();
  });

  it('rejects with FilePermissionError when access is refused', async () => {
    platform.current = 'android';
    const Filesystem = fakeFilesystem('prompt', 'denied');
    const saving = createFiles({ Filesystem }).save(pdf());
    await expect(saving).rejects.toBeInstanceOf(FilePermissionError);
    await expect(saving).rejects.toThrow('denied');
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
  });

  it('needs no storage access for the app’s own directories', async () => {
    platform.current = 'android';
    const Filesystem = fakeFilesystem('denied');
    await createFiles({ Filesystem, directory: 'DATA' }).save(pdf());
    expect(Filesystem.checkPermissions).not.toHaveBeenCalled();
  });

  it('rejects when the write fails', async () => {
    platform.current = 'ios';
    const Filesystem = fakeFilesystem();
    Filesystem.writeFile.mockRejectedValueOnce(new Error('No space left'));
    await expect(createFiles({ Filesystem }).save(pdf())).rejects.toThrow('No space left');
  });

  it('needs Filesystem to save', async () => {
    platform.current = 'ios';
    await expect(createFiles().save(pdf())).rejects.toThrow('Filesystem');
  });
});

describe('save in a browser', () => {
  it('downloads the file', async () => {
    const Filesystem = fakeFilesystem();
    expect(
      await createFiles({ Filesystem }).save({ blob: new Blob(['x']), name: 'a/b.txt' })
    ).toEqual({
      method: 'download',
      name: 'a-b.txt',
    });
    expect(anchors[0]!.download).toBe('a-b.txt');
    expect(Filesystem.writeFile).not.toHaveBeenCalled();
  });
});
