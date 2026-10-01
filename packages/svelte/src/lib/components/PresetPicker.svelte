<script lang="ts" generics="P extends string = string">
  import { builtInPresets } from '@loidolt/theme-tokens';
  import type { ControlSize, Option } from '../types.js';
  import type { Theme } from '../theme.svelte.js';
  import Select from './Select.svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  interface Props {
    /** The store from `createTheme({ presets })`. */
    theme: Theme<P>;
    /**
     * Label per preset. Defaults to the built-in presets' own labels, and to the capitalised
     * name for any preset of your own.
     */
    options?: Option<P>[];
    /** Accessible name of the control. */
    label?: string;
    /** `segmented` keeps every preset in view; `select` folds a longer list into a dropdown. */
    variant?: 'segmented' | 'select';
    size?: ControlSize;
    class?: string;
  }

  let {
    theme,
    options,
    label = 'Style',
    variant = 'segmented',
    size = 'sm',
    class: className,
  }: Props = $props();

  const builtInLabels = new Map<string, string>(
    builtInPresets.map((preset) => [preset.name, preset.label])
  );

  const items = $derived(
    options ??
      theme.presets.map((name) => ({
        value: name,
        label: builtInLabels.get(name) ?? name.charAt(0).toUpperCase() + name.slice(1),
      }))
  );

  // Bound through the theme rather than passed down: a segmented control lets the pressed item
  // be pressed again to clear it, and there is no "no preset". The theme ignores the empty
  // value, and the getter hands the control the preset that is still in force.
  const getPreset = () => theme.preset;
  const setPreset = (next: P | P[] | '' | undefined) => {
    if (typeof next === 'string' && next !== '') theme.preset = next;
  };
</script>

<!--
  The preset half of a theme switcher; ThemeToggle is the scheme half. Both drive the same
  `createTheme()` store, so they can sit side by side in a topbar.
-->
{#if variant === 'select'}
  <Select options={items} bind:value={getPreset, setPreset} {label} boxed class={className} />
{:else}
  <ToggleGroup options={items} bind:value={getPreset, setPreset} {label} {size} class={className} />
{/if}
