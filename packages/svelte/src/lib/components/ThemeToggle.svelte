<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { ControlSize } from '../types.js';
  import type { Theme, ThemePreference } from '../theme.svelte.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLButtonAttributes, 'children' | 'aria-label'> {
    /** The store from `createTheme()`. */
    theme: Theme;
    /** Accessible name for the preference represented by the icon. */
    label?: string;
    lightLabel?: string;
    darkLabel?: string;
    systemLabel?: string;
    /** Include "system" in the cycle. */
    showSystem?: boolean;
    size?: ControlSize;
    class?: string;
    ref?: HTMLButtonElement | null;
  }

  let {
    theme,
    label = 'Colour scheme',
    lightLabel = 'Light',
    darkLabel = 'Dark',
    systemLabel = 'System',
    showSystem = true,
    size = 'sm',
    class: className,
    disabled = false,
    type = 'button',
    title,
    onclick,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const preferences = $derived<ThemePreference[]>(
    showSystem ? ['light', 'dark', 'system'] : ['light', 'dark']
  );

  // If the system option is hidden, represent the scheme that is actually showing and toggle
  // away from it on the first press.
  const activePreference = $derived<ThemePreference>(
    !showSystem && theme.preference === 'system' ? theme.resolved : theme.preference
  );
  const currentIndex = $derived(preferences.indexOf(activePreference));
  const nextPreference = $derived(preferences[(currentIndex + 1) % preferences.length]);

  const preferenceLabel = (preference: ThemePreference) => {
    if (preference === 'light') return lightLabel;
    if (preference === 'dark') return darkLabel;
    return systemLabel;
  };

  const currentLabel = $derived(preferenceLabel(activePreference));
  const nextLabel = $derived(preferenceLabel(nextPreference));
  const buttonLabel = $derived(`${label}: ${currentLabel}`);
  const buttonTitle = $derived(title ?? `${buttonLabel} → ${nextLabel}`);
</script>

<!-- A native button gives the three-state cycle standard keyboard behavior in one compact target. -->
<button
  bind:this={ref}
  {type}
  {disabled}
  aria-label={buttonLabel}
  title={buttonTitle}
  class={cx(
    'ldt-button ldt-icon-button ldt-button--ghost',
    size !== 'md' && `ldt-button--${size}`,
    className
  )}
  data-theme-preference={activePreference}
  onclick={(event) => {
    theme.preference = nextPreference;
    onclick?.(event);
  }}
  {...rest}
>
  {#if activePreference === 'light'}
    <svg
      data-theme-icon="light"
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="square"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
      />
    </svg>
  {:else if activePreference === 'dark'}
    <svg
      data-theme-icon="dark"
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="miter"
    >
      <path d="M20.4 15.4A8.5 8.5 0 0 1 8.6 3.6 8.5 8.5 0 1 0 20.4 15.4Z" />
    </svg>
  {:else}
    <svg
      data-theme-icon="system"
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="square"
      stroke-linejoin="miter"
    >
      <rect x="3" y="4" width="18" height="13" />
      <path d="M9 21h6M12 17v4" />
    </svg>
  {/if}
</button>
