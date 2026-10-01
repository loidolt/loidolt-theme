/*
 * Diffing for layer properties, so a re-render sends MapLibre only what changed. Every
 * `setPaintProperty` call re-validates and repaints; sending the whole paint object on every
 * change makes a busy map stutter.
 */

/** Structural equality for the JSON-shaped values in a style: expressions, colours, numbers. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const other = b as unknown[];
    return a.length === other.length && a.every((value, index) => deepEqual(value, other[index]));
  }
  const [left, right] = [a as Record<string, unknown>, b as Record<string, unknown>];
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]))
  );
}

/**
 * The properties that differ between two property objects, as `[name, next value]`. A
 * property that was removed comes back as `undefined`, which resets it to the style default.
 */
export function changedProperties(
  previous: Record<string, unknown> | undefined,
  next: Record<string, unknown> | undefined
): Array<[string, unknown]> {
  const [before, after] = [previous ?? {}, next ?? {}];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .filter((key) => !deepEqual(before[key], after[key]))
    .map((key) => [key, after[key]]);
}
