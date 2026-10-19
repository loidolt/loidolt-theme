import type { StatusVariant, Toaster } from '@loidolt/theme-svelte';
import { nativePlatform, quietly } from './platform.js';
import type { HapticsPlugin, Teardown } from './types.js';

export type ImpactWeight = 'light' | 'medium' | 'heavy';

/**
 * Controls whose activation changes a value — the moments a native control ticks. Disabled ones
 * are skipped. Buttons are left out on purpose: iOS and Android buttons do not buzz, and a buzz
 * on every press soon reads as noise. Opt one in with `data-haptic`.
 */
export const SELECTION_TARGETS = [
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '.ldt-tab-bar__item',
  '[aria-pressed]',
].join(', ');

export interface HapticsOptions {
  /** `Haptics` from `@capacitor/haptics`. */
  Haptics: HapticsPlugin;
  /**
   * Read before every buzz, so an in-app "Vibration" setting can turn them off without
   * reinstalling anything. Defaults to always on.
   */
  enabled?: () => boolean;
}

export interface InstallHapticsOptions {
  /** What ticks on activation. Defaults to {@link SELECTION_TARGETS}. */
  selection?: string;
}

export interface NativeHaptics {
  /** A physical tap: `light` for a small control, `heavy` for a drop or a snap. */
  impact(weight?: ImpactWeight): void;
  /** One tick of a selection changing — a switch flipping, a tab changing. */
  selection(): void;
  /** The outcome pattern for a status: success, warning or error. `info` has none. */
  notify(variant: StatusVariant | undefined): void;
  /**
   * Gives the page's controls their native feel with one delegated listener: a selection tick
   * for every `selection` target, and an impact for any element with `data-haptic`
   * (`data-haptic="medium"` picks the weight).
   */
  install(options?: InstallHapticsOptions): Teardown;
}

const IMPACT = { light: 'LIGHT', medium: 'MEDIUM', heavy: 'HEAVY' } as const;
const NOTIFY = { success: 'SUCCESS', warning: 'WARNING', error: 'ERROR' } as const;

const isWeight = (value: string | undefined): value is ImpactWeight =>
  value === 'light' || value === 'medium' || value === 'heavy';

/**
 * Haptic feedback through `@capacitor/haptics`, in the theme's vocabulary. Silent in a browser,
 * even one that can vibrate: a web page that buzzes is a surprise, a native app that does not is
 * a disappointment.
 *
 * ```ts
 * import { Haptics } from '@capacitor/haptics';
 * export const haptics = createHaptics({ Haptics });
 * haptics.install();
 * ```
 */
export function createHaptics(options: HapticsOptions): NativeHaptics {
  const { Haptics, enabled = () => true } = options;
  const live = () => nativePlatform() !== null && enabled();

  const impact = (weight: ImpactWeight = 'light') => {
    if (live()) quietly(Haptics.impact({ style: IMPACT[weight] }));
  };

  const selection = () => {
    if (!live()) return;
    // A one-off tick is the whole start/changed/end sequence; started alone, Android stays silent.
    quietly(
      Haptics.selectionStart()
        .then(() => Haptics.selectionChanged())
        .then(() => Haptics.selectionEnd())
    );
  };

  const notify = (variant: StatusVariant | undefined) => {
    if (!live() || !variant || variant === 'info') return;
    quietly(Haptics.notification({ type: NOTIFY[variant] }));
  };

  const install = (installOptions: InstallHapticsOptions = {}): Teardown => {
    if (typeof document === 'undefined') return () => {};
    const { selection: selector = SELECTION_TARGETS } = installOptions;
    const onClick = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const opted = target.closest<HTMLElement>('[data-haptic]');
      const control = opted ?? target.closest(selector);
      if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
      if (opted) {
        const weight = opted.dataset.haptic;
        impact(isWeight(weight) ? weight : 'light');
      } else selection();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  };

  return { impact, selection, notify, install };
}

/**
 * The same toaster, with the matching notification pattern on every status toast — a success
 * tap, a warning or error buzz — so feedback lands even when the screen is not being watched.
 *
 * ```ts
 * export const toaster = withHaptics(createToaster(), haptics);
 * ```
 */
export function withHaptics(toaster: Toaster, haptics: Pick<NativeHaptics, 'notify'>): Toaster {
  const buzz = <A extends unknown[]>(
    variant: StatusVariant | ((...args: A) => StatusVariant | undefined),
    call: (...args: A) => string
  ) => {
    return (...args: A) => {
      const id = call(...args);
      haptics.notify(typeof variant === 'function' ? variant(...args) : variant);
      return id;
    };
  };

  return {
    get toasts() {
      return toaster.toasts;
    },
    push: buzz((toast) => toast.variant, toaster.push),
    update: toaster.update,
    success: buzz('success', toaster.success),
    info: buzz('info', toaster.info),
    warning: buzz('warning', toaster.warning),
    error: buzz('error', toaster.error),
    dismiss: toaster.dismiss,
    clear: toaster.clear,
    pause: toaster.pause,
    resume: toaster.resume,
    destroy: toaster.destroy,
  };
}
