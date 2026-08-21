<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ControlSize, Option } from '../types.js';
  import type { Theme, ThemePreference } from '../theme.svelte.js';
  import ToggleGroup from './ToggleGroup.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The store from `createTheme()`. */
    theme: Theme;
    /** Narrowed from the DOM attribute: the group this spreads onto rejects `null`. */
    id?: string;
    /** Accessible name of the group. */
    label?: string;
    lightLabel?: string;
    darkLabel?: string;
    systemLabel?: string;
    /**
     * Offers "system" alongside the two schemes. Worth keeping: without it a user who has not
     * chosen is silently locked to whichever scheme they happened to land on.
     */
    showSystem?: boolean;
    size?: ControlSize;
    class?: string;
    ref?: HTMLDivElement | null;
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
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived<Option<ThemePreference>[]>([
    { value: 'light', label: lightLabel },
    { value: 'dark', label: darkLabel },
    ...(showSystem ? [{ value: 'system' as const, label: systemLabel }] : []),
  ]);
</script>

<!--
  A segmented scheme picker wired to `createTheme()`. Pressing the pressed option is ignored: a
  toggle group deselects on a second press, and "no colour scheme" is not a state a page can be in.
-->
<ToggleGroup
  bind:ref
  {options}
  {label}
  {size}
  value={theme.preference}
  onValueChange={(next) => {
    if (next) theme.preference = next as ThemePreference;
  }}
  class={className}
  {...rest}
/>
