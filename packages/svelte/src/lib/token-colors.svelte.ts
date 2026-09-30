import { onDestroy } from 'svelte';
import {
  resolveRoles,
  roleVar,
  type ColorScheme,
  type ResolvedRoles,
  type RoleSpec,
  type SemanticRole,
} from '@loidolt/theme-tokens';

const hex = (value: number) =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, '0');

/**
 * A computed colour as `#rrggbb`, or `#rrggbbaa` when it is translucent. Accepts what browsers
 * return from `getComputedStyle`: `rgb()`/`rgba()` in either syntax, and `color(srgb …)`, which
 * is what a `color-mix()` token computes to. Anything else is `null`.
 */
export function normalizeColor(value: string): string | null {
  const text = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(text)) return text;
  const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
  const srgb = /^color\(srgb ([^)]+)\)$/.exec(text);
  const parts = (rgb?.[1] ?? srgb?.[1])?.split(/[\s,/]+/).filter(Boolean);
  if (!parts || parts.length < 3) return null;
  const numbers = parts.map((part) =>
    part.endsWith('%') ? Number.parseFloat(part) / 100 : Number(part)
  );
  if (numbers.some((number) => !Number.isFinite(number))) return null;
  const channels = numbers.slice(0, 3).map((number, index) =>
    // `rgb()` channels are 0–255 unless written as percentages; `color(srgb)` channels are 0–1.
    srgb || parts[index].endsWith('%') ? number * 255 : number
  );
  const alpha = numbers.length > 3 ? numbers[3] : 1;
  const base = `#${channels.map(hex).join('')}`;
  return alpha >= 1 ? base : `${base}${hex(alpha * 255)}`;
}

/**
 * Reads one role's live value from the page, as the element would paint it — so a scoped
 * `[data-theme]` subtree or an app's own overrides are honoured. `null` when the environment
 * cannot say (the server, or a DOM without custom-property support such as jsdom).
 */
export function readRoleColor(element: Element, role: SemanticRole): string | null {
  const view = element.ownerDocument?.defaultView;
  if (!view) return null;
  const probe = element.ownerDocument.createElement('span');
  probe.hidden = true;
  probe.style.color = `var(${roleVar(role)})`;
  element.appendChild(probe);
  try {
    return normalizeColor(view.getComputedStyle(probe).color);
  } finally {
    probe.remove();
  }
}

/**
 * Which theme an element is in: an explicit `data-theme` on it or an ancestor wins, then the
 * computed `color-scheme` (which the dark stylesheets set, including the system-following one).
 */
export function colorSchemeOf(element: Element | null | undefined): ColorScheme {
  if (!element) return 'light';
  const explicit = element.closest('[data-theme]')?.getAttribute('data-theme');
  if (explicit === 'dark' || explicit === 'light') return explicit;
  const view = element.ownerDocument?.defaultView;
  const computed = view?.getComputedStyle(element).colorScheme ?? '';
  return /\bdark\b/.test(computed) && !/\blight\b/.test(computed) ? 'dark' : 'light';
}

type Listener = () => void;
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- subscriber bookkeeping, never rendered
const listeners = new Set<Listener>();
let teardown: (() => void) | undefined;

/** One set of observers for the whole page, however many charts and maps are listening. */
function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (!teardown && typeof document !== 'undefined') {
    let queued = false;
    const notify = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        for (const each of [...listeners]) each();
      });
    };
    const root = document.documentElement;
    const scoped = new MutationObserver(notify);
    // A theme can be scoped to any subtree, so `data-theme` is watched everywhere; `class` and
    // `style` only on the root, where apps toggle theme classes and inline overrides.
    scoped.observe(root, { attributes: true, attributeFilter: ['data-theme'], subtree: true });
    const rootObserver = new MutationObserver(notify);
    rootObserver.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : undefined;
    media?.addEventListener('change', notify);
    teardown = () => {
      scoped.disconnect();
      rootObserver.disconnect();
      media?.removeEventListener('change', notify);
      teardown = undefined;
    };
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) teardown?.();
  };
}

/**
 * Calls `callback` whenever the page's colour scheme may have changed: a `data-theme` anywhere,
 * a class or inline style on `<html>`, or the system preference. Returns the unsubscribe.
 */
export function observeColorScheme(callback: () => void): () => void {
  return subscribe(callback);
}

export interface TokenColorsOptions {
  /** Where to read from. Defaults to `<html>`; pass the chart or map element to honour a scoped theme. */
  element?: () => Element | null | undefined;
}

export interface TokenColors<S extends RoleSpec> {
  /** Every role in the spec as a concrete colour. Reactive. */
  readonly colors: ResolvedRoles<S>;
  readonly scheme: ColorScheme;
  /** Goes up by one each time `colors` changes, for effects that repaint a canvas. */
  readonly version: number;
  /** Re-reads the page now — call it once the element has mounted. */
  refresh(): void;
  destroy(): void;
}

/**
 * Semantic token values for renderers that cannot read CSS — a chart canvas, a WebGL map. Reads
 * the live values off the page, so an app's own theme reaches the canvas, and follows theme
 * changes. On the server, and wherever values cannot be read, it falls back to the reference
 * light or dark theme.
 *
 * ```ts
 * const palette = createTokenColors({ series: ['chart1', 'chart2'], ink: 'text' }, { element: () => node });
 * $effect(() => chart?.setOption(build(palette.colors)));
 * ```
 */
export function createTokenColors<S extends RoleSpec>(
  spec: S,
  options: TokenColorsOptions = {}
): TokenColors<S> {
  const target = () =>
    options.element?.() ?? (typeof document === 'undefined' ? undefined : document.documentElement);

  const compute = () => {
    const element = target();
    const scheme = colorSchemeOf(element);
    const read = (role: SemanticRole) =>
      (element && readRoleColor(element, role)) || resolveRoles({ role }, scheme).role;
    return { scheme, colors: resolveRoles(spec, scheme, read) };
  };

  const initial = compute();
  let colors = $state.raw(initial.colors);
  let scheme = $state(initial.scheme);
  let version = $state(0);

  const refresh = () => {
    const next = compute();
    scheme = next.scheme;
    if (JSON.stringify(next.colors) === JSON.stringify(colors)) return;
    colors = next.colors;
    version += 1;
  };

  const unsubscribe = subscribe(refresh);
  const destroy = () => unsubscribe();

  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get colors() {
      return colors;
    },
    get scheme() {
      return scheme;
    },
    get version() {
      return version;
    },
    refresh,
    destroy,
  };
}
