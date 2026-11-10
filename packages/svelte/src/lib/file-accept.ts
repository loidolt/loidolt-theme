/**
 * File filtering shared by `Dropzone` and anything else that receives files: the `accept` syntax
 * of `<input type="file">`, plus optional size and count limits.
 */

/** The parts of a `File` the filter reads, so plain objects can be checked too. */
export interface FileLike {
  name: string;
  type: string;
  size?: number;
}

export type FileRejectionReason = 'type' | 'size' | 'count';

export interface FileRejection<F extends FileLike = File> {
  file: F;
  /** `type`: not matched by `accept`; `size`: over `maxSize`; `count`: over `maxFiles`. */
  reason: FileRejectionReason;
}

export interface FileFilterOptions {
  /** The `<input accept>` value: extensions (`.pdf`), exact MIME types, or `type/*`. */
  accept?: string;
  /** `false` keeps only the first accepted file. Defaults to `true`. */
  multiple?: boolean;
  /** Largest accepted file, in bytes. */
  maxSize?: number;
  /** Most files accepted from one batch. Ignored when `multiple` is `false` (the limit is 1). */
  maxFiles?: number;
}

export interface FileFilterResult<F extends FileLike = File> {
  accepted: F[];
  rejected: FileRejection<F>[];
}

/**
 * Splits an `accept` string into lowercase tokens, dropping the ones a browser would ignore
 * (anything that is neither an extension nor a `type/subtype` MIME pattern).
 */
export function parseAccept(accept: string | null | undefined): string[] {
  if (!accept) return [];
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter((token) => /^\.[^\s/]+$/.test(token) || /^[^\s/]+\/[^\s/]+$/.test(token));
}

/**
 * Whether a file passes an `accept` filter, by the same rules as `<input accept>`: `.pdf` matches
 * the end of the name, `image/*` any image MIME type, `application/pdf` exactly. An empty or
 * absent filter accepts everything; matching ignores case and MIME parameters.
 */
export function matchesAccept(file: FileLike, accept: string | null | undefined): boolean {
  const tokens = parseAccept(accept);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase().split(';')[0].trim();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (!type) return false;
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/**
 * Sorts a batch of files into accepted and rejected, in order: type first, then size, then the
 * count limit, which only counts files that passed the other two.
 */
export function filterFiles<F extends FileLike = File>(
  files: Iterable<F> | ArrayLike<F>,
  options: FileFilterOptions = {}
): FileFilterResult<F> {
  const { accept, multiple = true, maxSize, maxFiles } = options;
  const limit = multiple ? (maxFiles ?? Infinity) : 1;
  const accepted: F[] = [];
  const rejected: FileRejection<F>[] = [];
  for (const file of Array.from(files)) {
    if (!matchesAccept(file, accept)) rejected.push({ file, reason: 'type' });
    else if (maxSize !== undefined && (file.size ?? 0) > maxSize)
      rejected.push({ file, reason: 'size' });
    else if (accepted.length >= limit) rejected.push({ file, reason: 'count' });
    else accepted.push(file);
  }
  return { accepted, rejected };
}
