import { onDestroy } from 'svelte';

export type Politeness = 'polite' | 'assertive';

/** Milliseconds between emptying the region and writing the new message. */
const WRITE_DELAY = 50;

export interface AnnouncerOptions {
  /** Default politeness for `announce()`. `'assertive'` interrupts; keep it for errors. */
  politeness?: Politeness;
  /**
   * Milliseconds before a message is cleared, so the region does not hold stale text a screen
   * reader user might land on later. `0` keeps it. Defaults to 5000.
   */
  clearAfter?: number;
}

export interface Announcer {
  /** The text to render inside a mounted `LiveRegion`. Reactive. */
  readonly message: string;
  readonly politeness: Politeness;
  /** Speaks `message`. Repeating the same text is announced again, not swallowed. */
  announce(message: string, options?: { politeness?: Politeness }): void;
  clear(): void;
  /** Cancels any pending write or clear. Automatic for a component-scoped instance. */
  destroy(): void;
}

/**
 * State behind a `LiveRegion`: set a message, and it is spoken and then cleared.
 *
 * ```svelte
 * const announcer = createAnnouncer();
 * <LiveRegion message={announcer.message} politeness={announcer.politeness} />
 * <button onclick={() => announcer.announce('Saved')}>Save</button>
 * ```
 *
 * The region must already be in the document when the message changes — a region mounted
 * together with its text is silent in most screen readers — so render `LiveRegion` once,
 * unconditionally, and let this drive its contents.
 */
export function createAnnouncer(options: AnnouncerOptions = {}): Announcer {
  const { politeness: defaultPoliteness = 'polite', clearAfter = 5000 } = options;
  if (!(Number.isFinite(clearAfter) && clearAfter >= 0)) {
    throw new RangeError('createAnnouncer: `clearAfter` must be a non-negative number');
  }

  let message = $state('');
  let politeness = $state<Politeness>(defaultPoliteness);
  let clearTimer: ReturnType<typeof setTimeout> | undefined;
  let pending = 0;

  const cancel = () => {
    clearTimeout(clearTimer);
    clearTimer = undefined;
  };

  const announce = (text: string, opts: { politeness?: Politeness } = {}) => {
    cancel();
    politeness = opts.politeness ?? defaultPoliteness;
    // Screen readers announce a *change*. Setting the same string again is no change, so empty
    // the region first and write the text a moment later. The gap is a macrotask, not a
    // microtask: both writes inside one task can reach assistive tech as a single, unchanged
    // mutation.
    message = '';
    const token = ++pending;
    setTimeout(() => {
      if (token !== pending) return;
      message = text;
      if (clearAfter > 0) clearTimer = setTimeout(() => (message = ''), clearAfter);
    }, WRITE_DELAY);
  };

  const clear = () => {
    pending++;
    cancel();
    message = '';
  };

  const destroy = () => {
    pending++;
    cancel();
  };

  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get message() {
      return message;
    },
    get politeness() {
      return politeness;
    },
    announce,
    clear,
    destroy,
  };
}
