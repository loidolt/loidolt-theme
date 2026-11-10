/*
 * Browser plumbing shared by sharing and saving files: handing a Blob to the native bridge, and
 * the download a browser falls back to.
 */

/** How long a download's object URL is kept: long enough for every browser to start reading it. */
export const REVOKE_AFTER = 40_000;

/**
 * Starts a browser download of `blob` as `name`: an object URL on a temporary `<a download>`,
 * revoked once the browser has had time to read it. Returns whether a download was started —
 * `false` without a DOM.
 */
export function downloadBlob(blob: Blob, name: string): boolean {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
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
  return true;
}

/**
 * The Blob as base64, without the `data:` prefix — what `Filesystem.writeFile` takes on iOS and
 * Android, where it cannot read a Blob itself.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      resolve(url.slice(url.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(blob);
  });
}

/**
 * A file name that is safe as the last segment of a path: no separators, no leading dots, no
 * control characters. Falls back to `fallback` when nothing is left.
 */
export function safeFileName(name: string, fallback = 'file'): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]+/g, '-')
    .replace(/^[.\s]+/, '')
    .trim();
  return cleaned || fallback;
}
