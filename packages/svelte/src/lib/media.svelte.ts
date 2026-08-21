import { onDestroy } from 'svelte';
import { breakpoints } from '@loidolt/theme-tokens';

export interface MediaQueryOptions {
  /**
   * What `matches` reports before a `matchMedia` result exists — during SSR, and on the very
   * first client frame if the environment has no `matchMedia`. Pick the value that renders the
   * layout you would rather ship to a bot or an old browser; it defaults to `false`.
   */
  fallback?: boolean;
}

export interface MediaQuery {
  /** Live match state. Reactive — read it in markup or a `$derived`. */
  readonly matches: boolean;
  readonly query: string;
  /**
   * Removes the change listener. Called automatically when the query is created during
   * component initialisation; call it yourself for a module-scope instance you want to retire.
   */
  destroy(): void;
}

/**
 * Reactive `matchMedia`.
 *
 * ```svelte
 * <script lang="ts">
 *   import { createMediaQuery, breakpointQuery } from '@loidolt/theme-svelte';
 *   const compact = createMediaQuery(breakpointQuery('compact'));
 * </script>
 *
 * {#if compact.matches}<Drawer …/>{:else}<Sidebar …/>{/if}
 * ```
 *
 * SSR-safe: on the server `matches` is the `fallback` and nothing subscribes. Because the
 * server cannot know the viewport, markup that switches on a media query hydrates with the
 * fallback branch and swaps on the first client frame — render both branches, or gate the
 * swap on a mount flag, if that flash matters.
 */
export function createMediaQuery(query: string, options: MediaQueryOptions = {}): MediaQuery {
  const { fallback = false } = options;

  let matches = $state(fallback);
  let list: MediaQueryList | undefined;

  const update = (event: MediaQueryList | MediaQueryListEvent) => {
    matches = event.matches;
  };

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    list = window.matchMedia(query);
    matches = list.matches;
    list.addEventListener('change', update);
  }

  const destroy = () => {
    list?.removeEventListener('change', update);
    list = undefined;
  };

  // A query created inside a component should not outlive it. Created at module scope — the
  // usual place for an app-wide singleton — there is no component to hook into, and the caller
  // owns `destroy()` instead.
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: no lifecycle to attach to */
  }

  return {
    get matches() {
      return matches;
    },
    query,
    destroy,
  };
}

export type BreakpointName = keyof typeof breakpoints;

/**
 * The media query for a token breakpoint. `below` (the default) matches the narrow side, which
 * is the direction the stylesheet's own `@media (max-width: …)` blocks use.
 *
 * ```ts
 * breakpointQuery('compact');           // '(max-width: 760px)'
 * breakpointQuery('compact', 'above');  // '(min-width: 760.02px)'
 * ```
 */
export function breakpointQuery(name: BreakpointName, direction: 'below' | 'above' = 'below') {
  const value = breakpoints[name];
  if (direction === 'below') return `(max-width: ${value})`;
  // 0.02px, not 1px: the CSS Media Queries spec resolves widths at fractional precision, so a
  // whole-pixel step leaves a dead zone on fractional-DPI viewports where neither side matches.
  return `(min-width: ${Number.parseFloat(value) + 0.02}px)`;
}
