import { isTauri } from './platform.js';
import type { DialogFilter, DialogPlugin, FsPlugin } from './types.js';

/**
 * A file read from disk: a `File` like any a `Dropzone` or `FileInput` hands you, plus the
 * `path` it was read from. `path` is absent for a file picked through the browser's own picker.
 */
export type DesktopFile = File & { readonly path?: string };

export interface PickOptions {
  /**
   * What may be picked, written as for `<input accept>`: extensions (`.pdf`), MIME types
   * (`application/pdf`) and wildcards (`image/*`), comma-separated. Becomes the dialog's
   * `filters`. Like the attribute it narrows the dialog, not what comes back.
   */
  accept?: string;
  /** Allow more than one file. Defaults to `false`. */
  multiple?: boolean;
  /** The dialog's title (not shown by every OS). */
  title?: string;
  /** The folder the dialog opens in, or a file in it to preselect. */
  defaultPath?: string;
  /** The dialog's filters as Tauri takes them, instead of the ones made from `accept`. */
  filters?: DialogFilter[];
}

export interface PickPathsOptions extends PickOptions {
  /** Pick folders instead of files. `accept` and `filters` are ignored then. */
  directory?: boolean;
}

/** A file to save: a `File`, or a Blob with the name it should be saved under. */
export type SaveableFile = File | { blob: Blob; name: string };

export interface SaveOptions {
  /**
   * Where the dialog starts: a folder, or a full path to suggest. Defaults to the file's name, so
   * the dialog opens in the OS's usual folder with the name filled in.
   */
  defaultPath?: string;
  /**
   * The dialog's filters. Defaults to the file's own extension, which on macOS also keeps the
   * extension on whatever name the user types.
   */
  filters?: DialogFilter[];
  /** The dialog's title (not shown by every OS). */
  title?: string;
}

/**
 * Where a saved file went: written to the path the user chose in the save dialog, handed to the
 * browser as a download, nowhere because the user cancelled the dialog, or nowhere at all (on
 * the server). The same shape as `createFiles` in `@loidolt/theme-capacitor`, plus `cancelled`.
 */
export type SaveOutcome =
  | { method: 'filesystem'; path: string }
  | { method: 'download'; name: string }
  | { method: 'cancelled' }
  | { method: 'none' };

export interface DesktopFilesOptions {
  /** `@tauri-apps/plugin-dialog`, for the native open and save dialogs. */
  dialog?: DialogPlugin;
  /** `@tauri-apps/plugin-fs`, for reading what was picked and writing what is saved. */
  fs?: FsPlugin;
}

export interface DesktopFiles {
  /**
   * Lets the user pick files — the native open dialog in a Tauri window, the browser's picker
   * elsewhere — and resolves them as `File`s with their `path`, so one upload path serves both.
   * Resolves `[]` when the dialog is dismissed. Each file is read whole into memory; for large
   * files use {@link pickPaths} and read them in Rust. In a browser, call it from a click or key
   * handler, as for any file input.
   */
  pick(options?: PickOptions): Promise<DesktopFile[]>;
  /**
   * The native open dialog's choice as paths, unread — files, or folders with `directory`.
   * Resolves `[]` when dismissed, and outside a Tauri window (a browser has no paths to give).
   */
  pickPaths(options?: PickPathsOptions): Promise<string[]>;
  /**
   * Asks where to save with the native save dialog and writes the file there, or downloads it in
   * a browser. Resolves `{ method: 'cancelled' }` when the dialog is dismissed.
   */
  save(file: SaveableFile, options?: SaveOptions): Promise<SaveOutcome>;
}

/** Common extensions and their MIME types, for `File.type` and for turning `accept` into filters. */
export const EXTENSION_TYPES: Readonly<Record<string, string>> = {
  avif: 'image/avif',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  epub: 'application/epub+zip',
  gif: 'image/gif',
  heic: 'image/heic',
  htm: 'text/html',
  html: 'text/html',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  json: 'application/json',
  m4a: 'audio/mp4',
  md: 'text/markdown',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  odt: 'application/vnd.oasis.opendocument.text',
  pdf: 'application/pdf',
  png: 'image/png',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rtf: 'application/rtf',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  wav: 'audio/wav',
  webp: 'image/webp',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xml: 'application/xml',
  zip: 'application/zip',
};

/** The last segment of a path, with either separator. */
export function baseName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

/** The lowercase extension of a name or path, without the dot; `''` for none. */
function extensionOf(name: string): string {
  const base = baseName(name);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
}

/** The MIME type for a file name or path by its extension, or `''` when it is not a known one. */
export function mimeTypeOf(name: string): string {
  return EXTENSION_TYPES[extensionOf(name)] ?? '';
}

/**
 * An `accept` string as the dialog filters Tauri takes, which list extensions: `.pdf` stays
 * `pdf`, a MIME type becomes its known extensions, `image/*` every known image extension.
 * `undefined` means "anything": no `accept`, `*` or a MIME type with no known extension — rather
 * than make those files unpickable. The filter is named after its extensions (`PDF, PNG`), which
 * needs no translation; `name` replaces that.
 */
export function acceptToFilters(
  accept: string | undefined,
  name?: string
): DialogFilter[] | undefined {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return undefined;
  const extensions = new Set<string>();
  for (const token of tokens) {
    if (token === '*' || token === '*/*') return undefined;
    if (token.startsWith('.')) {
      if (token.length > 1) extensions.add(token.slice(1));
      continue;
    }
    const wildcard = token.endsWith('/*') ? token.slice(0, -1) : null;
    const known = Object.keys(EXTENSION_TYPES).filter((extension) =>
      wildcard
        ? EXTENSION_TYPES[extension].startsWith(wildcard)
        : EXTENSION_TYPES[extension] === token
    );
    if (known.length === 0) return undefined;
    for (const extension of known) extensions.add(extension);
  }
  if (extensions.size === 0) return undefined;
  const list = [...extensions];
  return [
    { name: name ?? list.map((extension) => extension.toUpperCase()).join(', '), extensions: list },
  ];
}

/** A file read from `path`, typed by its extension. Rejects when it cannot be read. */
export async function readDesktopFile(
  fs: Pick<FsPlugin, 'readFile'>,
  path: string
): Promise<DesktopFile> {
  const bytes = await fs.readFile(path);
  const name = baseName(path);
  const file = new File([bytes as BlobPart], name, { type: mimeTypeOf(name) });
  Object.defineProperty(file, 'path', { value: path, enumerable: true });
  return file as DesktopFile;
}

/**
 * The files at `paths`, read whole into memory, in order. A path that cannot be read (a folder,
 * one outside the fs scope, a file gone since) is skipped and handed to `onError`, so one bad
 * path does not lose the rest.
 */
export async function readDesktopFiles(
  fs: Pick<FsPlugin, 'readFile'>,
  paths: readonly string[],
  onError?: (error: unknown, path: string) => void
): Promise<DesktopFile[]> {
  const read = await Promise.all(
    paths.map((path) =>
      readDesktopFile(fs, path).catch((error: unknown) => {
        onError?.(error, path);
        return null;
      })
    )
  );
  return read.filter((file): file is DesktopFile => file !== null);
}

/**
 * A file name that is safe as the last segment of a path: no separators, no leading dots, no
 * control characters. Falls back to `fallback` when nothing is left.
 */
function safeFileName(name: string, fallback = 'file'): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]+/g, '-')
    .replace(/^[.\s]+/, '')
    .trim();
  return cleaned || fallback;
}

/** How long a download's object URL is kept: long enough for every browser to start reading it. */
const REVOKE_AFTER = 40_000;

/** Starts a browser download of `blob` as `name`, through a temporary `<a download>`. */
function downloadBlob(blob: Blob, name: string): void {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = name;
  anchor.rel = 'noopener';
  anchor.hidden = true;
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(href), REVOKE_AFTER);
  }
}

/** The browser's own picker: a hidden file input, opened and removed again. */
function pickInBrowser({ accept, multiple = false }: PickOptions): Promise<DesktopFile[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.hidden = true;
    input.multiple = multiple;
    if (accept) input.accept = accept;
    const done = (files: File[]) => {
      input.remove();
      resolve(files);
    };
    input.addEventListener('change', () => done(Array.from(input.files ?? [])), { once: true });
    // Every current browser fires `cancel` when the picker is dismissed.
    input.addEventListener('cancel', () => done([]), { once: true });
    document.body.append(input);
    input.click();
  });
}

/** The Blob's bytes, read whole into memory. */
function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsArrayBuffer(blob);
  });
}

const asPaths = (result: string | string[] | null | undefined): string[] =>
  result == null ? [] : Array.isArray(result) ? result : [result];

/**
 * Opening and saving files the same way in a Tauri window and in a browser. In a window, picking
 * goes through the native open dialog and reads the chosen files with `@tauri-apps/plugin-fs`,
 * and saving asks with the native save dialog and writes there; in a browser, a file input and a
 * download. Either way `pick` resolves `File`s, so they go down the same upload path as a
 * `Dropzone`'s.
 *
 * ```ts
 * import * as dialog from '@tauri-apps/plugin-dialog';
 * import * as fs from '@tauri-apps/plugin-fs';
 *
 * const files = createDesktopFiles({ dialog, fs });
 * const [pdf] = await files.pick({ accept: '.pdf' });
 * await files.save(new File([bytes], 'export.pdf'));
 * ```
 *
 * On the server `pick` resolves `[]` and `save` resolves `{ method: 'none' }`.
 */
export function createDesktopFiles(options: DesktopFilesOptions = {}): DesktopFiles {
  const { dialog, fs } = options;

  async function pickPaths(pickOptions: PickPathsOptions = {}): Promise<string[]> {
    if (!dialog || !isTauri()) return [];
    const {
      accept,
      multiple = false,
      directory = false,
      title,
      defaultPath,
      filters,
    } = pickOptions;
    const result = await dialog.open({
      title,
      defaultPath,
      multiple,
      directory,
      filters: directory ? undefined : (filters ?? acceptToFilters(accept)),
    });
    return asPaths(result);
  }

  return {
    pickPaths,

    async pick(pickOptions = {}) {
      if (typeof document === 'undefined') return [];
      // A web view's own file input works too, for a window without the plugins.
      if (!dialog || !fs || !isTauri()) return pickInBrowser(pickOptions);
      const { accept, multiple, title, defaultPath, filters } = pickOptions;
      const paths = await pickPaths({ accept, multiple, title, defaultPath, filters });
      return Promise.all(paths.map((path) => readDesktopFile(fs, path)));
    },

    async save(file, saveOptions = {}) {
      if (typeof document === 'undefined') return { method: 'none' };
      const name = safeFileName(file.name);
      const blob = file instanceof Blob ? file : file.blob;
      if (!isTauri()) {
        downloadBlob(blob, name);
        return { method: 'download', name };
      }
      if (!dialog || !fs) {
        // A web view has no download manager of its own; a download would go nowhere.
        throw new Error(
          'Saving a file in a Tauri window needs dialog from @tauri-apps/plugin-dialog and fs from @tauri-apps/plugin-fs'
        );
      }
      const extension = extensionOf(name);
      const path = await dialog.save({
        title: saveOptions.title,
        defaultPath: saveOptions.defaultPath ?? name,
        filters:
          saveOptions.filters ??
          (extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : undefined),
      });
      if (path == null) return { method: 'cancelled' };
      await fs.writeFile(path, await bytesOf(blob));
      return { method: 'filesystem', path };
    },
  };
}
