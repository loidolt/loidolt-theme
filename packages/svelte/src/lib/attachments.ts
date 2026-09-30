import type { Attachment } from 'svelte/attachments';
import type { Orientation } from './types.js';

/*
 * Keyboard and focus behaviour for markup you build yourself. Every overlay, menu and group in
 * this package already gets these from Bits UI; reach for them when you compose a custom surface
 * — a bespoke popover, a card grid, a canvas toolbar — and still owe it the same contract.
 *
 * Each helper returns a Svelte attachment. Attachments only run in the browser, so none of this
 * touches the DOM during SSR, and they re-run when their arguments change, so options are plain
 * values rather than getters:
 *
 *   <div {@attach escapeKey(close, { enabled: open })}>
 */

export interface EscapeKeyOptions {
  /** Listen only while true. Defaults to `true`. */
  enabled?: boolean;
  preventDefault?: boolean;
  /**
   * Stop the event reaching outer Escape handlers, so only the innermost layer closes. Defaults
   * to `false`.
   */
  stopPropagation?: boolean;
  /**
   * `'document'` (the default) hears Escape wherever focus is — right for a layer that owns the
   * screen. `'node'` hears it only while focus is inside the element.
   */
  scope?: 'document' | 'node';
}

/** Calls `handler` when Escape is pressed. */
export function escapeKey(
  handler: (event: KeyboardEvent) => void,
  options: EscapeKeyOptions = {}
): Attachment<HTMLElement> {
  const { enabled = true, preventDefault = false, stopPropagation = false, scope } = options;
  return (node) => {
    if (!enabled) return;
    const target: HTMLElement | Document = scope === 'node' ? node : node.ownerDocument;
    const onKeydown = (event: Event) => {
      const key = event as KeyboardEvent;
      // An IME composition uses Escape to cancel the candidate, not the surface.
      if (key.key !== 'Escape' || key.isComposing) return;
      if (preventDefault) key.preventDefault();
      if (stopPropagation) key.stopPropagation();
      handler(key);
    };
    target.addEventListener('keydown', onKeydown);
    return () => target.removeEventListener('keydown', onKeydown);
  };
}

export interface ClickOutsideOptions {
  enabled?: boolean;
  /** Defaults to `['pointerdown']`, which covers mouse, pen and touch in one listener. */
  events?: Array<'pointerdown' | 'mousedown' | 'touchstart' | 'click'>;
  /**
   * Presses on these count as inside — typically the trigger that opened the surface, so
   * pressing it toggles rather than closing and instantly reopening.
   */
  ignore?: Array<Element | null | undefined>;
}

/** Calls `handler` when a press lands outside the element (and outside `ignore`). */
export function clickOutside(
  handler: (event: Event) => void,
  options: ClickOutsideOptions = {}
): Attachment<HTMLElement> {
  const { enabled = true, events = ['pointerdown'], ignore = [] } = options;
  return (node) => {
    if (!enabled) return;
    const doc = node.ownerDocument;
    const onPress = (event: Event) => {
      // `composedPath` sees through shadow roots and survives the target being removed by an
      // earlier handler in the same dispatch; `contains` on a detached target would not.
      const path = event.composedPath();
      if (path.includes(node) || ignore.some((element) => element && path.includes(element)))
        return;
      handler(event);
    };
    for (const type of events) doc.addEventListener(type, onPress, true);
    return () => {
      for (const type of events) doc.removeEventListener(type, onPress, true);
    };
  };
}

export interface AutofocusOptions {
  enabled?: boolean;
  /** Milliseconds to wait — for a surface that animates in. Defaults to the next frame. */
  delay?: number;
  preventScroll?: boolean;
  /** Select an input's text as well as focusing it. */
  select?: boolean;
}

/**
 * Moves focus to the element once it mounts. Prefer it to the `autofocus` attribute, which
 * browsers honour only on page load and which Svelte warns about for that reason.
 */
export function autofocus(options: AutofocusOptions = {}): Attachment<HTMLElement> {
  const { enabled = true, delay, preventScroll = false, select = false } = options;
  return (node) => {
    if (!enabled) return;
    const run = () => {
      node.focus({ preventScroll });
      if (select && (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement))
        node.select();
    };
    if (delay !== undefined) {
      const timer = setTimeout(run, delay);
      return () => clearTimeout(timer);
    }
    const frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  };
}

export interface RovingFocusOptions {
  /**
   * Which arrow keys move focus. `'both'` accepts all four, for a grid you walk in reading order.
   * Defaults to `'horizontal'`.
   */
  orientation?: Orientation | 'both';
  /** Wrap from the last item to the first and back. Defaults to `true`. */
  loop?: boolean;
  /** Which descendants take part. Defaults to `[data-roving-item]`. */
  selector?: string;
  /**
   * Keep exactly one item in the tab order (`tabindex="0"`) and the rest at `-1`, so Tab enters
   * and leaves the group in one step — the WAI-ARIA toolbar and grid pattern. Defaults to `true`.
   */
  manageTabIndex?: boolean;
  onFocusChange?: (index: number, element: HTMLElement) => void;
}

const isUsable = (element: HTMLElement) =>
  !element.matches(':disabled, [aria-disabled="true"]') && !element.closest('[hidden], [inert]');

/**
 * Arrow-key, Home and End navigation between the matching descendants, with an optional roving
 * tab stop. Items added or removed later are picked up on the next key press.
 */
export function rovingFocus(options: RovingFocusOptions = {}): Attachment<HTMLElement> {
  const {
    orientation = 'horizontal',
    loop = true,
    selector = '[data-roving-item]',
    manageTabIndex = true,
    onFocusChange,
  } = options;
  const next = new Set(
    orientation === 'vertical'
      ? ['ArrowDown']
      : orientation === 'horizontal'
        ? ['ArrowRight']
        : ['ArrowRight', 'ArrowDown']
  );
  const previous = new Set(
    orientation === 'vertical'
      ? ['ArrowUp']
      : orientation === 'horizontal'
        ? ['ArrowLeft']
        : ['ArrowLeft', 'ArrowUp']
  );

  return (node) => {
    const items = () =>
      [...node.querySelectorAll<HTMLElement>(selector)].filter((item) => isUsable(item));

    const setTabStop = (active: HTMLElement | undefined) => {
      if (!manageTabIndex) return;
      for (const item of node.querySelectorAll<HTMLElement>(selector)) {
        item.tabIndex = item === active ? 0 : -1;
      }
    };

    const move = (target: HTMLElement, index: number) => {
      setTabStop(target);
      target.focus();
      onFocusChange?.(index, target);
    };

    // Start with one tab stop: the first item already marked current, else the first usable one.
    const initial = items();
    setTabStop(
      initial.find((item) => item.matches('[aria-current], [aria-selected="true"]')) ?? initial[0]
    );

    const onKeydown = (event: KeyboardEvent) => {
      const list = items();
      if (list.length === 0) return;
      const current = list.findIndex(
        (item) => item === event.target || item.contains(event.target as Node)
      );
      if (current === -1) return;

      let index: number;
      if (next.has(event.key)) {
        index = current + 1 < list.length ? current + 1 : loop ? 0 : current;
      } else if (previous.has(event.key)) {
        index = current > 0 ? current - 1 : loop ? list.length - 1 : current;
      } else if (event.key === 'Home') {
        index = 0;
      } else if (event.key === 'End') {
        index = list.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      move(list[index], index);
    };

    // A click or programmatic focus moves the tab stop too, so Tab returns to the last item used.
    const onFocusin = (event: FocusEvent) => {
      const item = items().find((one) => one === event.target);
      if (item) setTabStop(item);
    };

    node.addEventListener('keydown', onKeydown);
    node.addEventListener('focusin', onFocusin);
    return () => {
      node.removeEventListener('keydown', onKeydown);
      node.removeEventListener('focusin', onFocusin);
    };
  };
}

export interface FocusTrapOptions {
  enabled?: boolean;
  /** A selector inside the element, or an element, to focus first. Defaults to the first tabbable. */
  initialFocus?: string | HTMLElement;
  /**
   * Where focus goes when the trap is released: `true` (the default) returns it to whatever had
   * it before, an element sends it there, `false` leaves it alone.
   */
  returnFocus?: boolean | HTMLElement;
  preventScroll?: boolean;
}

const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

const tabbables = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.closest('[hidden], [inert]') &&
      getComputedStyle(element).visibility !== 'hidden' &&
      getComputedStyle(element).display !== 'none'
  );

/**
 * Keeps Tab and Shift+Tab inside the element while enabled, and restores focus when released.
 * `Dialog`, `AlertDialog`, `Drawer` and the other Bits overlays already trap focus — this is for
 * a modal surface you render yourself.
 */
export function focusTrap(options: FocusTrapOptions = {}): Attachment<HTMLElement> {
  const { enabled = true, initialFocus, returnFocus = true, preventScroll = false } = options;
  return (node) => {
    if (!enabled) return;
    const doc = node.ownerDocument;
    const previous = doc.activeElement as HTMLElement | null;

    const first =
      typeof initialFocus === 'string'
        ? node.querySelector<HTMLElement>(initialFocus)
        : (initialFocus ?? null);
    const frame = requestAnimationFrame(() => {
      if (node.contains(doc.activeElement)) return;
      const target = first ?? tabbables(node)[0];
      // With nothing tabbable inside, hold focus on the container itself so Tab has nowhere to go.
      if (!target && !node.hasAttribute('tabindex')) node.tabIndex = -1;
      (target ?? node).focus({ preventScroll });
    });

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const list = tabbables(node);
      if (list.length === 0) {
        event.preventDefault();
        return;
      }
      const active = doc.activeElement;
      const [head, tail] = [list[0], list[list.length - 1]];
      if (event.shiftKey && (active === head || !node.contains(active))) {
        event.preventDefault();
        tail.focus({ preventScroll });
      } else if (!event.shiftKey && (active === tail || !node.contains(active))) {
        event.preventDefault();
        head.focus({ preventScroll });
      }
    };
    doc.addEventListener('keydown', onKeydown, true);

    return () => {
      cancelAnimationFrame(frame);
      doc.removeEventListener('keydown', onKeydown, true);
      const destination = returnFocus === true ? previous : returnFocus || null;
      if (destination?.isConnected) destination.focus({ preventScroll });
    };
  };
}
