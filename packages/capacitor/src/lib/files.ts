import { Capacitor } from '@capacitor/core';
import { blobToBase64, downloadBlob, safeFileName } from './blob.js';
import { nativePlatform } from './platform.js';
import type { FilePickerPlugin, FilesystemPlugin, PickedNativeFile } from './types.js';

/** The part of `@capacitor/filesystem` saving uses. */
type FilesSystemPlugin = Pick<
  FilesystemPlugin,
  'writeFile' | 'stat' | 'checkPermissions' | 'requestPermissions'
>;

export interface PickOptions {
  /**
   * What may be picked, written as for `<input accept>`: MIME types (`application/pdf`), wildcards
   * (`image/*`) and extensions (`.pdf`), comma-separated. Like the attribute it is a filter for the
   * picker, not a guarantee about what comes back.
   */
  accept?: string;
  /** Allow more than one file. Defaults to `false`. */
  multiple?: boolean;
}

/** A file to save: a `File`, or a Blob with the name it should be saved under. */
export type SaveableFile = File | { blob: Blob; name: string };

export interface SaveOptions {
  /** A folder inside the directory, created when missing (`'Exports'`). */
  folder?: string;
  /**
   * Replace a file of the same name. Defaults to `false`: the new one is saved as
   * `name (1).ext`, `name (2).ext`, … instead.
   */
  overwrite?: boolean;
}

/**
 * Where a saved file went: written to the device with `Filesystem` (with its URI and the path
 * inside `directory`), handed to the browser as a download, or nowhere (on the server).
 */
export type SaveOutcome =
  | { method: 'filesystem'; uri: string; path: string; directory: string }
  | { method: 'download'; name: string }
  | { method: 'none' };

export interface NativeFilesOptions {
  /** `FilePicker` from `@capawesome/capacitor-file-picker`. Without it, the browser's picker. */
  FilePicker?: FilePickerPlugin;
  /** `Filesystem` from `@capacitor/filesystem`. Needed to save in a native shell. */
  Filesystem?: FilesSystemPlugin;
  /**
   * The `Directory` files are saved to. Defaults to `'DOCUMENTS'`: on iOS the app's Documents
   * folder, which the Files app shows once the app opts in (see the README); on Android the
   * shared Documents folder, which every file manager shows.
   */
  directory?: string;
}

export interface NativeFiles {
  /**
   * Lets the user pick files — the native picker in an app, the browser's elsewhere — and resolves
   * them as `File`s, the same objects a `FileInput` hands you, so one upload path serves both.
   * Resolves `[]` when the picker is dismissed. In a browser, call it from a click or key handler,
   * as for any file input.
   */
  pick(options?: PickOptions): Promise<File[]>;
  /**
   * Saves a file to the device with `Filesystem` in a native shell (asking for storage access on
   * the Android versions that need it), or downloads it in a browser.
   */
  save(file: SaveableFile, options?: SaveOptions): Promise<SaveOutcome>;
}

/** The user refused storage access, so the file could not be saved. */
export class FilePermissionError extends Error {
  override name = 'FilePermissionError';
  constructor(message = 'Storage access was denied') {
    super(message);
  }
}

/** Common extensions in `accept` and the MIME types the native pickers filter by. */
export const EXTENSION_TYPES: Readonly<Record<string, string>> = {
  '.avif': 'image/avif',
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.epub': 'application/epub+zip',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.m4a': 'audio/mp4',
  '.md': 'text/markdown',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.rtf': 'application/rtf',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
};

/**
 * An `accept` string as the MIME types a native picker filters by. `undefined` means "anything":
 * no `accept`, or an extension with no known type — rather than make those files unpickable.
 */
export function acceptToMimeTypes(accept: string | undefined): string[] | undefined {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0 || tokens.includes('*/*')) return undefined;
  const types = new Set<string>();
  for (const token of tokens) {
    const type = token.startsWith('.') ? EXTENSION_TYPES[token] : token.includes('/') && token;
    if (!type) return undefined;
    types.add(type);
  }
  return [...types];
}

const isCancel = (error: unknown) => error instanceof Error && /cancel/i.test(error.message);

const nameOf = (file: SaveableFile) => safeFileName(file.name);
const blobOf = (file: SaveableFile): Blob => (file instanceof Blob ? file : file.blob);

/** A picked native file as a `File`, read through the web view's file URL. */
async function toFile(picked: PickedNativeFile): Promise<File> {
  let blob = picked.blob;
  if (!blob) {
    const src = picked.webPath ?? (picked.path ? Capacitor.convertFileSrc(picked.path) : null);
    if (!src) throw new Error(`The picked file ${picked.name} has no path to read it from`);
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Could not read the picked file ${picked.name}`);
    blob = await response.blob();
  }
  return new File([blob], picked.name, {
    type: picked.mimeType || blob.type,
    lastModified: picked.modifiedAt,
  });
}

/** The browser's own picker: a hidden file input, opened and removed again. */
function pickInBrowser({ accept, multiple = false }: PickOptions): Promise<File[]> {
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

/** `name (n).ext`. */
function numbered(name: string, n: number): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
}

/**
 * Opening and saving files the same way in a native shell and in a browser. Picking uses
 * `@capawesome/capacitor-file-picker` in the app and a file input elsewhere, and resolves `File`s
 * either way; saving writes to the device's Documents with `@capacitor/filesystem`, or downloads.
 *
 * ```ts
 * import { FilePicker } from '@capawesome/capacitor-file-picker';
 * import { Filesystem } from '@capacitor/filesystem';
 *
 * const files = createFiles({ FilePicker, Filesystem });
 * const [pdf] = await files.pick({ accept: '.pdf' });
 * await files.save(new File([bytes], 'export.pdf'));
 * ```
 *
 * On the server `pick` resolves `[]` and `save` resolves `{ method: 'none' }`.
 */
export function createFiles(options: NativeFilesOptions = {}): NativeFiles {
  const { FilePicker, Filesystem, directory = 'DOCUMENTS' } = options;

  /** Android 10 and older need storage access for the shared folders; it is asked for here. */
  const ensureAccess = async (fs: FilesSystemPlugin) => {
    if (nativePlatform() !== 'android') return;
    if (directory !== 'DOCUMENTS' && directory !== 'EXTERNAL_STORAGE') return;
    if ((await fs.checkPermissions()).publicStorage === 'granted') return;
    if ((await fs.requestPermissions()).publicStorage !== 'granted') {
      throw new FilePermissionError();
    }
  };

  const exists = (fs: FilesSystemPlugin, path: string) =>
    fs.stat({ path, directory }).then(
      () => true,
      () => false
    );

  const freePath = async (fs: FilesSystemPlugin, folder: string, name: string) => {
    const at = (file: string) => (folder ? `${folder}/${file}` : file);
    if (!(await exists(fs, at(name)))) return at(name);
    for (let n = 1; n < 1000; n++) {
      const candidate = at(numbered(name, n));
      if (!(await exists(fs, candidate))) return candidate;
    }
    throw new Error(`Too many files named ${name}`);
  };

  return {
    async pick(pickOptions = {}) {
      if (typeof document === 'undefined') return [];
      if (!FilePicker || !nativePlatform()) return pickInBrowser(pickOptions);
      let picked: PickedNativeFile[];
      try {
        ({ files: picked } = await FilePicker.pickFiles({
          types: acceptToMimeTypes(pickOptions.accept),
          limit: pickOptions.multiple ? 0 : 1,
        }));
      } catch (error) {
        if (isCancel(error)) return [];
        throw error;
      }
      return Promise.all(picked.map(toFile));
    },

    async save(file, saveOptions = {}) {
      if (typeof document === 'undefined') return { method: 'none' };
      const name = nameOf(file);
      if (!nativePlatform()) {
        downloadBlob(blobOf(file), name);
        return { method: 'download', name };
      }
      if (!Filesystem) {
        // A web view has no download manager of its own; a download would go nowhere.
        throw new Error(
          'Saving a file in a native shell needs Filesystem from @capacitor/filesystem'
        );
      }
      await ensureAccess(Filesystem);
      const folder = (saveOptions.folder ?? '')
        .split('/')
        // `..` and `.` come out empty, so a folder cannot climb out of the directory.
        .map((segment) => safeFileName(segment, ''))
        .filter(Boolean)
        .join('/');
      const path = saveOptions.overwrite
        ? [folder, name].filter(Boolean).join('/')
        : await freePath(Filesystem, folder, name);
      const { uri } = await Filesystem.writeFile({
        path,
        data: await blobToBase64(blobOf(file)),
        directory,
        recursive: true,
      });
      return { method: 'filesystem', uri, path, directory };
    },
  };
}
