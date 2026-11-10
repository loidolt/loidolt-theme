import type { Toaster } from '@loidolt/theme-svelte';
import { blobToBase64, downloadBlob, safeFileName } from './blob.js';
import { nativePlatform } from './platform.js';
import type { FilesystemPlugin, SharePlugin } from './types.js';

/**
 * A file to share: a `File`, a Blob with the name it should arrive under, or — natively — the
 * `file://` URI of a file already on the device.
 */
export type ShareableFile = File | { blob: Blob; name: string } | { uri: string };

export interface ShareContent {
  /** The subject, where the receiving app has one (an email, a note). */
  title?: string;
  text?: string;
  url?: string;
  files?: ShareableFile[];
  /** Android only: the heading of the share sheet. */
  dialogTitle?: string;
}

/**
 * How the content went out: the native share sheet, the browser's (Web Share API), a download,
 * the clipboard, a new tab, or not at all (on the server, or with nothing left to try).
 */
export type ShareMethod = 'native' | 'web' | 'download' | 'clipboard' | 'open' | 'none';

export interface ShareOutcome {
  method: ShareMethod;
  /** The user closed the share sheet without picking a target. Not an error. */
  cancelled: boolean;
  /** iOS only: the activity the user picked (`com.apple.UIKit.activity.Mail`, …). */
  activityType?: string;
}

export interface NativeShareOptions {
  /** `Share` from `@capacitor/share`. Without it, a native shell uses the Web Share API too. */
  Share?: SharePlugin;
  /**
   * `Filesystem` from `@capacitor/filesystem`. Needed to share a `File` or Blob natively: it is
   * written to the cache directory first, since the share sheet only takes file URIs.
   */
  Filesystem?: FilesystemPlugin;
  /**
   * Where a link or text goes when no share sheet is available: `copy` puts it on the clipboard
   * (the URL when there is one, otherwise the text), `open` opens the URL in a new tab, `false`
   * does nothing. Defaults to `copy` — a desktop share sheet's "Copy link". Files always
   * download.
   */
  fallback?: 'copy' | 'open' | false;
  /** Confirms a copy with a success toast. */
  toaster?: Pick<Toaster, 'success'>;
  /** The toast's title after a copy. */
  copiedLabel?: string;
}

export interface NativeShare {
  /**
   * Shares `content` through the best channel there is: the native share sheet, then the Web
   * Share API, then a download for files and the `fallback` for a link or text. Resolves with the
   * channel used and whether the user cancelled; rejects only on a real failure.
   */
  share(content: ShareContent): Promise<ShareOutcome>;
  /**
   * Whether `share` would open a share sheet (native or the browser's) for `content`, rather
   * than fall back — to label a button "Share" or "Download". Without `content`, whether a share
   * sheet is there at all.
   */
  canShare(content?: ShareContent): Promise<boolean>;
}

/** The cache folder shared files are written to; emptied before each native share. */
export const SHARE_CACHE_PATH = 'ldt-share';

const isUri = (file: ShareableFile): file is { uri: string } =>
  typeof (file as { uri?: unknown }).uri === 'string';

const fileName = (file: File | { blob: Blob; name: string }) => safeFileName(file.name);

const blobOf = (file: File | { blob: Blob; name: string }): Blob =>
  file instanceof Blob ? file : file.blob;

/** A `File` for the Web Share API, which takes nothing else. */
function asFile(file: File | { blob: Blob; name: string }): File {
  if (file instanceof File) return file;
  return new File([file.blob], fileName(file), { type: file.blob.type });
}

const isAbort = (error: unknown) =>
  error instanceof Error && (error.name === 'AbortError' || /cancel/i.test(error.message));

const hasContent = (content: ShareContent) =>
  Boolean(content.title || content.text || content.url || content.files?.length);

/**
 * Sharing that works the same in a native shell and in a browser. The native share sheet comes
 * from `@capacitor/share`; a Blob is written to the cache with `@capacitor/filesystem` first, and
 * the previous share's files are cleared then, since a receiving app may still be reading them
 * when the sheet closes. In a browser it is the Web Share API, then a download or the clipboard.
 *
 * ```ts
 * import { Filesystem } from '@capacitor/filesystem';
 * import { Share } from '@capacitor/share';
 *
 * const sharing = createShare({ Share, Filesystem, toaster });
 * const { method, cancelled } = await sharing.share({
 *   title: 'Export',
 *   files: [new File([data], 'export.pdf', { type: 'application/pdf' })],
 * });
 * ```
 *
 * On the server it resolves `{ method: 'none' }` without doing anything.
 */
export function createShare(options: NativeShareOptions = {}): NativeShare {
  const { Share, Filesystem, fallback = 'copy', toaster, copiedLabel = 'Link copied' } = options;

  const native = () => (Share && nativePlatform() ? Share : null);

  const nativeCanShare = async (plugin: SharePlugin, content?: ShareContent) => {
    const blobs = content?.files?.some((file) => !isUri(file)) ?? false;
    if (blobs && !Filesystem) return false;
    try {
      return (await plugin.canShare()).value;
    } catch {
      return false;
    }
  };

  const webCanShare = (content?: ShareContent) => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
    const files = content?.files ?? [];
    if (files.length === 0) return true;
    if (files.some(isUri) || typeof navigator.canShare !== 'function') return false;
    try {
      return navigator.canShare({ files: files.map((file) => asFile(file as File)) });
    } catch {
      return false;
    }
  };

  /** Writes each Blob to the cache and returns the URIs the share sheet takes. */
  const toUris = async (files: ShareableFile[]): Promise<string[]> => {
    if (files.length === 0) return [];
    if (files.some((file) => !isUri(file))) {
      if (!Filesystem) {
        throw new Error(
          'Sharing a File or Blob natively needs Filesystem from @capacitor/filesystem'
        );
      }
      await Filesystem.rmdir({ path: SHARE_CACHE_PATH, directory: 'CACHE', recursive: true }).catch(
        () => {}
      );
    }
    return Promise.all(
      files.map(async (file, index) => {
        if (isUri(file)) return file.uri;
        const { uri } = await Filesystem!.writeFile({
          // One folder per file, so two files of the same name both arrive under it.
          path: `${SHARE_CACHE_PATH}/${index}/${fileName(file)}`,
          data: await blobToBase64(blobOf(file)),
          directory: 'CACHE',
          recursive: true,
        });
        return uri;
      })
    );
  };

  const shareNatively = async (plugin: SharePlugin, content: ShareContent) => {
    const files = await toUris(content.files ?? []);
    try {
      const { activityType } = await plugin.share({
        title: content.title,
        text: content.text,
        url: content.url,
        files: files.length ? files : undefined,
        dialogTitle: content.dialogTitle,
      });
      return { method: 'native', cancelled: false, activityType } satisfies ShareOutcome;
    } catch (error) {
      if (isAbort(error)) return { method: 'native', cancelled: true } satisfies ShareOutcome;
      throw error;
    }
  };

  /** The Web Share API; `null` when it refused the content and a fallback should take over. */
  const shareOnWeb = async (content: ShareContent): Promise<ShareOutcome | null> => {
    const files = content.files ?? [];
    try {
      await navigator.share({
        title: content.title,
        text: content.text,
        url: content.url,
        ...(files.length ? { files: files.map((file) => asFile(file as File)) } : {}),
      });
      return { method: 'web', cancelled: false };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { method: 'web', cancelled: true };
      }
      // NotAllowedError (no user activation, a permissions policy), TypeError, DataError: the
      // browser would not share this, so the fallback does.
      return null;
    }
  };

  const fallBack = async (content: ShareContent): Promise<ShareOutcome> => {
    const files = content.files ?? [];
    if (files.length) {
      if (files.some(isUri)) {
        throw new Error('A file URI can only be shared in a native shell');
      }
      for (const file of files) downloadBlob(blobOf(file as File), fileName(file as File));
      return { method: 'download', cancelled: false };
    }
    const link = content.url ?? content.text;
    if (link && fallback === 'open' && content.url) {
      window.open(content.url, '_blank', 'noopener');
      return { method: 'open', cancelled: false };
    }
    if (link && fallback === 'copy' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      toaster?.success(copiedLabel);
      return { method: 'clipboard', cancelled: false };
    }
    return { method: 'none', cancelled: false };
  };

  return {
    async share(content) {
      if (!hasContent(content)) throw new TypeError('Nothing to share');
      if (typeof document === 'undefined') return { method: 'none', cancelled: false };
      const plugin = native();
      if (plugin) return shareNatively(plugin, content);
      if (webCanShare(content)) {
        const outcome = await shareOnWeb(content);
        if (outcome) return outcome;
      }
      return fallBack(content);
    },

    async canShare(content) {
      if (typeof document === 'undefined') return false;
      const plugin = native();
      return plugin ? nativeCanShare(plugin, content) : webCanShare(content);
    },
  };
}
