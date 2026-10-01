import { onDestroy } from 'svelte';
import type { StatusVariant } from './types.js';

/** A single follow-up the toast offers — "Undo", "View", "Retry". */
export interface ToastAction {
  label: string;
  onAction: () => void;
  /** Dismiss the toast after the action runs. Defaults to `true`. */
  dismiss?: boolean;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: StatusVariant;
  /** Milliseconds before auto-dismiss. `0` or `Infinity` keeps the toast until dismissed. */
  duration?: number;
  /**
   * A button in the toast. Give an actionable toast enough `duration` to reach it (or `0`):
   * WCAG 2.2.1 requires that people who need more time get it.
   */
  action?: ToastAction;
}

/** Everything but the title, for the status shortcuts. */
export type ToastShortcutOptions = Omit<ToastOptions, 'title' | 'variant'>;

export interface ToastRecord extends ToastOptions {
  id: string;
}

export interface ToasterOptions {
  /** Default `duration` for toasts that do not set one. Defaults to persistent (`0`). */
  duration?: number;
  /** Oldest toasts past this count are dropped. */
  max?: number;
}

export interface Toaster {
  /** Live queue, oldest first. Feed it to `ToastViewport`. */
  readonly toasts: ToastRecord[];
  /** Adds a toast and returns its id. */
  push(toast: ToastOptions): string;
  /**
   * Changes a toast in place — "Uploading…" becoming "Uploaded". A new `duration` restarts its
   * timer. Returns `false` when the toast is already gone.
   */
  update(id: string, patch: Partial<ToastOptions>): boolean;
  success(title: string, options?: ToastShortcutOptions): string;
  info(title: string, options?: ToastShortcutOptions): string;
  warning(title: string, options?: ToastShortcutOptions): string;
  /** Stays until dismissed unless you pass a `duration`: an error should not vanish unread. */
  error(title: string, options?: ToastShortcutOptions): string;
  dismiss(id: string): void;
  clear(): void;
  /** Suspends every auto-dismiss timer — call on pointer enter / focus in. */
  pause(): void;
  /** Resumes with the time each toast had left — call on pointer leave / focus out. */
  resume(): void;
  /** Clears the queue and every timer. Automatic for a component-scoped instance. */
  destroy(): void;
}

/**
 * Queue behind `Toast` / `ToastViewport`: auto-dismiss with the remaining time preserved
 * across `pause()`/`resume()`, so hovering a toast does not lose the countdown.
 *
 * ```svelte
 * const toaster = createToaster();
 * <ToastViewport
 *   onpointerenter={toaster.pause}
 *   onpointerleave={toaster.resume}
 *   onfocusin={toaster.pause}
 *   onfocusout={toaster.resume}
 * >
 *   {#each toaster.toasts as toast (toast.id)}
 *     <Toast {...toast} onDismiss={() => toaster.dismiss(toast.id)} />
 *   {/each}
 * </ToastViewport>
 * ```
 */
export function createToaster(options: ToasterOptions = {}): Toaster {
  const { duration: defaultDuration = 0, max = 5 } = options;

  if (!Number.isInteger(max) || max < 1) {
    throw new RangeError('createToaster: `max` must be a positive integer');
  }
  const validDuration = (duration: number) =>
    duration === Infinity || (Number.isFinite(duration) && duration >= 0);
  if (!validDuration(defaultDuration)) {
    throw new RangeError('createToaster: `duration` must be non-negative or Infinity');
  }

  const toasts = $state<ToastRecord[]>([]);
  // Plain Map on purpose: these are timer handles, not UI state, and nothing renders from them.
  // `startedAt` lives per entry: toasts are pushed at different moments, so a shared start
  // time would corrupt every other toast's remaining time on pause. `timeout: null` marks a
  // paused entry holding only its remaining time.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const timers = new Map<
    string,
    { timeout: ReturnType<typeof setTimeout> | null; remaining: number; startedAt: number }
  >();
  let paused = false;
  let counter = 0;

  function clearTimer(id: string) {
    const timer = timers.get(id);
    if (timer?.timeout != null) clearTimeout(timer.timeout);
    timers.delete(id);
  }

  function arm(id: string, remaining: number) {
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    timers.set(id, {
      timeout: setTimeout(() => dismiss(id), remaining),
      remaining,
      startedAt: Date.now(),
    });
  }

  function dismiss(id: string) {
    clearTimer(id);
    const index = toasts.findIndex((toast) => toast.id === id);
    if (index !== -1) toasts.splice(index, 1);
  }

  function push(toast: ToastOptions): string {
    const duration = toast.duration ?? defaultDuration;
    if (!validDuration(duration)) {
      throw new RangeError('createToaster: toast `duration` must be non-negative or Infinity');
    }
    const id = `ldt-toast-${++counter}`;
    toasts.push({ ...toast, id });
    while (toasts.length > max) dismiss(toasts[0].id);
    if (!paused) arm(id, duration);
    else {
      timers.set(id, { timeout: null, remaining: duration, startedAt: 0 });
    }
    return id;
  }

  function update(id: string, patch: Partial<ToastOptions>): boolean {
    const index = toasts.findIndex((toast) => toast.id === id);
    if (index === -1) return false;
    if (patch.duration !== undefined) {
      if (!validDuration(patch.duration)) {
        throw new RangeError('createToaster: toast `duration` must be non-negative or Infinity');
      }
      clearTimer(id);
      if (!paused) arm(id, patch.duration);
      else timers.set(id, { timeout: null, remaining: patch.duration, startedAt: 0 });
    }
    toasts[index] = { ...toasts[index], ...patch, id };
    return true;
  }

  const shortcut =
    (variant: StatusVariant, fallbackDuration?: number) =>
    (title: string, options: ToastShortcutOptions = {}) =>
      push({ duration: fallbackDuration, ...options, title, variant });

  const destroy = () => {
    for (const timer of timers.values()) {
      if (timer.timeout !== null) clearTimeout(timer.timeout);
    }
    timers.clear();
    toasts.splice(0);
    paused = false;
  };

  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get toasts() {
      return toasts;
    },
    push,
    update,
    success: shortcut('success'),
    info: shortcut('info'),
    warning: shortcut('warning'),
    error: shortcut('error', 0),
    dismiss,
    clear() {
      for (const toast of [...toasts]) dismiss(toast.id);
    },
    pause() {
      if (paused) return;
      paused = true;
      const now = Date.now();
      for (const [id, timer] of timers) {
        if (timer.timeout === null) continue;
        clearTimeout(timer.timeout);
        timers.set(id, {
          timeout: null,
          // Floor of 1ms: a toast that expired while paused should dismiss right after
          // resume — `0` is the "keep until dismissed" sentinel and would strand it.
          remaining: Math.max(1, timer.remaining - (now - timer.startedAt)),
          startedAt: 0,
        });
      }
    },
    resume() {
      if (!paused) return;
      paused = false;
      for (const [id, timer] of [...timers]) {
        timers.delete(id);
        arm(id, timer.remaining);
      }
    },
    destroy,
  };
}
