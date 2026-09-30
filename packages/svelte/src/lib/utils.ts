/**
 * Joins truthy class names. Falsy entries are dropped, so `condition && 'ldt-x'` is safe.
 * Accepts the `class` prop of any component in this package.
 */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

/**
 * Joins the ids of the elements that describe a control into one `aria-describedby` value, or
 * `undefined` when there are none — an empty attribute is still an attribute.
 *
 * ```svelte
 * <input aria-describedby={describedBy(hint && hintId, error && errorId)} />
 * ```
 */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}
