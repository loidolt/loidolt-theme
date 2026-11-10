import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  acceptToFilters,
  baseName,
  createDesktopFiles,
  mimeTypeOf,
  readDesktopFiles,
} from '../src/lib/index.js';
import { enterTauri, fakeDialog, fakeFs } from './fakes.js';

const text = (file: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(file);
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('acceptToFilters', () => {
  it('turns extensions and MIME types into one filter named after its extensions', () => {
    expect(acceptToFilters('.PDF, application/json')).toEqual([
      { name: 'PDF, JSON', extensions: ['pdf', 'json'] },
    ]);
    expect(acceptToFilters('image/jpeg')).toEqual([
      { name: 'JPEG, JPG', extensions: ['jpeg', 'jpg'] },
    ]);
  });

  it('expands a wildcard into every known extension of the kind', () => {
    const [filter] = acceptToFilters('image/*')!;
    expect(filter.extensions).toEqual(
      expect.arrayContaining(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'heic'])
    );
    expect(filter.extensions).not.toContain('pdf');
  });

  it('takes a name, and dedupes', () => {
    expect(acceptToFilters('.md, text/markdown', 'Notes')).toEqual([
      { name: 'Notes', extensions: ['md'] },
    ]);
  });

  it('means anything for no accept, a catch-all, or a type it cannot map', () => {
    expect(acceptToFilters(undefined)).toBeUndefined();
    expect(acceptToFilters(' , ')).toBeUndefined();
    expect(acceptToFilters('*/*')).toBeUndefined();
    expect(acceptToFilters('.pdf, *')).toBeUndefined();
    expect(acceptToFilters('.pdf, application/x-unknown')).toBeUndefined();
    expect(acceptToFilters('.')).toBeUndefined();
  });
});

describe('names and types', () => {
  it('reads the last segment of either kind of path', () => {
    expect(baseName('/Users/sam/notes.md')).toBe('notes.md');
    expect(baseName('C:\\Users\\sam\\report.PDF')).toBe('report.PDF');
    expect(baseName('/Users/sam/folder/')).toBe('folder');
    expect(baseName('')).toBe('');
  });

  it('types a file by its extension', () => {
    expect(mimeTypeOf('/a/report.PDF')).toBe('application/pdf');
    expect(mimeTypeOf('photo.jpeg')).toBe('image/jpeg');
    expect(mimeTypeOf('archive.unknown')).toBe('');
    expect(mimeTypeOf('/a/.hidden')).toBe('');
    expect(mimeTypeOf('Makefile')).toBe('');
  });
});

describe('readDesktopFiles', () => {
  it('reads paths into typed files with their path, skipping what it cannot read', async () => {
    const fs = fakeFs({ '/docs/a.md': '# A', '/docs/b.png': 'png' });
    const onError = vi.fn();
    const files = await readDesktopFiles(
      fs,
      ['/docs/a.md', '/docs/folder', '/docs/b.png'],
      onError
    );
    expect(files.map((file) => [file.name, file.type, file.path])).toEqual([
      ['a.md', 'text/markdown', '/docs/a.md'],
      ['b.png', 'image/png', '/docs/b.png'],
    ]);
    expect(files[0]).toBeInstanceOf(File);
    expect(await text(files[0])).toBe('# A');
    expect(onError).toHaveBeenCalledWith(expect.any(Error), '/docs/folder');
    expect(await readDesktopFiles(fs, ['/missing'])).toEqual([]);
  });
});

describe('createDesktopFiles in a Tauri window', () => {
  it('picks one file through the dialog, filtered by accept, and reads it', async () => {
    enterTauri('mac');
    const dialog = fakeDialog('/Users/sam/report.pdf');
    const fs = fakeFs({ '/Users/sam/report.pdf': 'pdf bytes' });
    const files = await createDesktopFiles({ dialog, fs }).pick({ accept: '.pdf', title: 'Open' });
    expect(dialog.open).toHaveBeenCalledWith({
      title: 'Open',
      defaultPath: undefined,
      multiple: false,
      directory: false,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ name: 'report.pdf', type: 'application/pdf' });
    expect(files[0].path).toBe('/Users/sam/report.pdf');
    expect(await text(files[0])).toBe('pdf bytes');
  });

  it('picks several, with filters given as Tauri takes them', async () => {
    enterTauri('windows');
    const dialog = fakeDialog(['C:\\a.txt', 'C:\\b.csv']);
    const fs = fakeFs({ 'C:\\a.txt': 'a', 'C:\\b.csv': 'b' });
    const filters = [{ name: 'Text', extensions: ['txt', 'csv'] }];
    const files = await createDesktopFiles({ dialog, fs }).pick({
      multiple: true,
      accept: '.pdf',
      filters,
      defaultPath: 'C:\\',
    });
    expect(dialog.open).toHaveBeenCalledWith(
      expect.objectContaining({ multiple: true, filters, defaultPath: 'C:\\' })
    );
    expect(files.map((file) => [file.name, file.type])).toEqual([
      ['a.txt', 'text/plain'],
      ['b.csv', 'text/csv'],
    ]);
  });

  it('resolves no files when the dialog is dismissed', async () => {
    enterTauri('linux');
    const fs = fakeFs();
    const files = createDesktopFiles({ dialog: fakeDialog(null), fs });
    expect(await files.pick()).toEqual([]);
    expect(await files.pickPaths()).toEqual([]);
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('rejects when a picked file cannot be read', async () => {
    enterTauri('mac');
    const files = createDesktopFiles({ dialog: fakeDialog('/gone.pdf'), fs: fakeFs() });
    await expect(files.pick()).rejects.toThrow('No such file');
  });

  it('picks paths unread, folders included, without filters for a folder', async () => {
    enterTauri('mac');
    const dialog = fakeDialog(['/Users/sam/Projects', '/Users/sam/Archive']);
    const paths = await createDesktopFiles({ dialog }).pickPaths({
      directory: true,
      multiple: true,
      accept: '.pdf',
    });
    expect(paths).toEqual(['/Users/sam/Projects', '/Users/sam/Archive']);
    expect(dialog.open).toHaveBeenCalledWith(
      expect.objectContaining({ directory: true, multiple: true, filters: undefined })
    );
    dialog.open.mockResolvedValueOnce('/Users/sam/one.pdf');
    expect(await createDesktopFiles({ dialog }).pickPaths({ accept: '.pdf' })).toEqual([
      '/Users/sam/one.pdf',
    ]);
  });

  it('saves through the dialog, suggesting the name and its extension', async () => {
    enterTauri('mac');
    const dialog = fakeDialog(null, '/Users/sam/Documents/export.pdf');
    const fs = fakeFs();
    const outcome = await createDesktopFiles({ dialog, fs }).save(
      new File(['report'], 'export.pdf', { type: 'application/pdf' })
    );
    expect(outcome).toEqual({ method: 'filesystem', path: '/Users/sam/Documents/export.pdf' });
    expect(dialog.save).toHaveBeenCalledWith({
      title: undefined,
      defaultPath: 'export.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    expect(new TextDecoder().decode(fs.written.get('/Users/sam/Documents/export.pdf'))).toBe(
      'report'
    );
  });

  it('saves a named blob where told, with the filters given', async () => {
    enterTauri('mac');
    const dialog = fakeDialog(null, '/tmp/notes');
    const fs = fakeFs();
    const filters = [{ name: 'Text', extensions: ['txt'] }];
    const outcome = await createDesktopFiles({ dialog, fs }).save(
      { blob: new Blob(['hi']), name: '../notes' },
      { defaultPath: '/tmp', filters, title: 'Save notes' }
    );
    expect(dialog.save).toHaveBeenCalledWith({ title: 'Save notes', defaultPath: '/tmp', filters });
    expect(outcome).toEqual({ method: 'filesystem', path: '/tmp/notes' });
  });

  it('suggests a cleaned name with no filter when it has no extension', async () => {
    enterTauri('mac');
    const dialog = fakeDialog(null, null);
    const fs = fakeFs();
    const outcome = await createDesktopFiles({ dialog, fs }).save({
      blob: new Blob(['hi']),
      name: '../notes',
    });
    expect(dialog.save).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPath: '-notes', filters: undefined })
    );
    expect(outcome).toEqual({ method: 'cancelled' });
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('needs the dialog and fs plugins to save', async () => {
    enterTauri('mac');
    await expect(
      createDesktopFiles({ fs: fakeFs() }).save(new File(['x'], 'x.txt'))
    ).rejects.toThrow(/plugin-dialog/);
  });

  it('picks through the web view’s own file input without the plugins', async () => {
    enterTauri('mac');
    const files = createDesktopFiles({ dialog: fakeDialog('/a.txt') });
    const picked = files.pick({ accept: '.txt' });
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    expect(input.accept).toBe('.txt');
    input.dispatchEvent(new Event('cancel'));
    expect(await picked).toEqual([]);
  });
});

describe('createDesktopFiles in a browser', () => {
  it('picks through a hidden file input', async () => {
    const dialog = fakeDialog('/a.txt');
    const files = createDesktopFiles({ dialog, fs: fakeFs() });
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const picked = files.pick({ accept: '.pdf', multiple: true });
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    expect(input.hidden).toBe(true);
    expect(input.multiple).toBe(true);
    expect(click).toHaveBeenCalled();
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    expect(await picked).toEqual([file]);
    expect(document.querySelector('input[type=file]')).toBeNull();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('resolves no files when the picker is dismissed, and has no paths to give', async () => {
    const files = createDesktopFiles();
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const picked = files.pick();
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
    expect(input.multiple).toBe(false);
    expect(input.hasAttribute('accept')).toBe(false);
    input.dispatchEvent(new Event('change'));
    expect(await picked).toEqual([]);
    expect(await files.pickPaths()).toEqual([]);
  });

  it('downloads instead of saving', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clicked.push(this);
    });
    const dialog = fakeDialog();
    const outcome = await createDesktopFiles({ dialog, fs: fakeFs() }).save(
      new File(['x'], 'report.pdf')
    );
    expect(outcome).toEqual({ method: 'download', name: 'report.pdf' });
    expect(clicked[0].download).toBe('report.pdf');
    expect(clicked[0].href).toBe('blob:x');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(dialog.save).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});
