import type { StatusVariant } from './types.js';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: StatusVariant;
  /** Milliseconds before auto-dismiss. `0` or `Infinity` keeps the toast until dismissed. */
  duration?: number;
}

export interface ToastRecord extends ToastOptions {
  id: string;
}

export interface ToasterOptions {
  /** Default `duration` for toasts that do not set one. */
  duration?: number;
  /** Oldest toasts past this count are dropped. */
  max?: number;
}

export interface Toaster {
  /** Live queue, oldest first. Feed it to `ToastViewport`. */
  readonly toasts: ToastRecord[];
  /** Adds a toast and returns its id. */
  push(toast: ToastOptions): string;
  dismiss(id: string): void;
  clear(): void;
  /** Suspends every auto-dismiss timer — call on pointer enter / focus in. */
  pause(): void;
  /** Resumes with the time each toast had left — call on pointer leave / focus out. */
  resume(): void;
}

/**
 * Queue behind `Toast` / `ToastViewport`: auto-dismiss with the remaining time preserved
 * across `pause()`/`resume()`, so hovering a toast does not lose the countdown.
 *
 * ```svelte
 * const toaster = createToaster();
 * <ToastViewport onpointerenter={toaster.pause} onpointerleave={toaster.resume}>
 *   {#each toaster.toasts as toast (toast.id)}
 *     <Toast {...toast} onDismiss={() => toaster.dismiss(toast.id)} />
 *   {/each}
 * </ToastViewport>
 * ```
 */
export function createToaster(options: ToasterOptions = {}): Toaster {
  const { duration: defaultDuration = 5000, max = 5 } = options;

  const toasts = $state<ToastRecord[]>([]);
  // Plain Map on purpose: these are timer handles, not UI state, and nothing renders from them.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const timers = new Map<string, { timeout: ReturnType<typeof setTimeout>; remaining: number }>();
  let startedAt = 0;
  let paused = false;
  let counter = 0;

  function clearTimer(id: string) {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer.timeout);
    timers.delete(id);
  }

  function arm(id: string, remaining: number) {
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    startedAt = Date.now();
    timers.set(id, { timeout: setTimeout(() => dismiss(id), remaining), remaining });
  }

  function dismiss(id: string) {
    clearTimer(id);
    const index = toasts.findIndex((toast) => toast.id === id);
    if (index !== -1) toasts.splice(index, 1);
  }

  function push(toast: ToastOptions): string {
    const id = `ldt-toast-${++counter}`;
    toasts.push({ ...toast, id });
    while (toasts.length > max) dismiss(toasts[0].id);
    if (!paused) arm(id, toast.duration ?? defaultDuration);
    else timers.set(id, { timeout: 0 as never, remaining: toast.duration ?? defaultDuration });
    return id;
  }

  return {
    get toasts() {
      return toasts;
    },
    push,
    dismiss,
    clear() {
      for (const toast of [...toasts]) dismiss(toast.id);
    },
    pause() {
      if (paused) return;
      paused = true;
      const elapsed = Date.now() - startedAt;
      for (const [id, timer] of timers) {
        clearTimeout(timer.timeout);
        timers.set(id, { timeout: 0 as never, remaining: Math.max(0, timer.remaining - elapsed) });
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
  };
}
