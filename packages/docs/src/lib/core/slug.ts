/**
 * A URL fragment from heading text: lower-cased, with letters and digits of any script kept and
 * everything else collapsed to single hyphens. "Café & Crème" → `café-crème`.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** Hands out unique slugs: the second "Usage" becomes `usage-2`. */
export function createSlugger(prefix = '') {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text) || 'section';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return `${prefix}${count === 1 ? base : `${base}-${count}`}`;
  };
}
