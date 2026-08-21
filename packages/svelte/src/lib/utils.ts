/**
 * Joins truthy class names. Falsy entries are dropped, so `condition && 'ldt-x'` is safe.
 * Accepts the `class` prop of any component in this package.
 */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
