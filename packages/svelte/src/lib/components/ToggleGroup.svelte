<script lang="ts" generics="T extends string = string">
  import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ControlSize, Option, Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    options: Option<T>[];
    /** Narrowed from the DOM attribute: the Bits root this spreads onto rejects `null`. */
    id?: string;
    /** Lets more than one option be pressed at once. `value` is then an array. */
    multiple?: boolean;
    /** Pressed option, or options when `multiple`. Bindable. */
    value?: T | T[];
    /** Accessible name of the group. */
    label?: string;
    size?: ControlSize;
    orientation?: Orientation;
    disabled?: boolean;
    /** Renders an option's contents — an icon, say — in place of its plain label. */
    children?: Snippet<[Option<T>]>;
    class?: string;
    itemClass?: string;
    onValueChange?: (value: T | T[]) => void;
    ref?: HTMLDivElement | null;
  }

  let {
    options,
    multiple = false,
    value = $bindable(),
    label,
    size = 'md',
    orientation = 'horizontal',
    disabled = false,
    children,
    class: className,
    itemClass,
    onValueChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const classes = $derived(
    cx('ldt-toggle-group', size !== 'md' && `ldt-toggle-group--${size}`, className)
  );

  // As with `Accordion`, only the Root's typing differs between the two modes.
  const change = (next: string | string[]) => {
    value = next as T | T[];
    onValueChange?.(next as T | T[]);
  };

  /*
   * Bound rather than passed, so Bits holds no copy of its own: whatever `value` reads after a
   * press is what shows as pressed. A parent that refuses a change — PresetPicker refusing the
   * empty value a second press on the pressed item produces — then keeps its item pressed.
   */
  const single = () => (value ?? '') as string;
  const many = () => (value ?? []) as string[];
</script>

<!--
  A segmented control: a small, fixed set of choices shown side by side rather than folded into a
  Select. Single mode is a radio group in behaviour — one press replaces the last — so reach for
  it when the options are worth showing at all times.
-->
{#snippet items()}
  {#each options as option (option.value)}
    <ToggleGroupPrimitive.Item
      value={option.value}
      disabled={option.disabled}
      class={cx('ldt-toggle-group__item', itemClass)}
      >{#if children}{@render children(option)}{:else}{option.label}{/if}</ToggleGroupPrimitive.Item
    >
  {/each}
{/snippet}

{#if multiple}
  <ToggleGroupPrimitive.Root
    bind:ref
    type="multiple"
    bind:value={many, change}
    {orientation}
    {disabled}
    class={classes}
    aria-label={label}
    {...rest}
  >
    {@render items()}
  </ToggleGroupPrimitive.Root>
{:else}
  <!--
    Rendered through `child` to correct the root's role. In single mode Bits marks the items
    `role="radio"` but leaves the root at `role="group"`, and a radio must be owned by a
    `radiogroup` — otherwise assistive tech reports loose radios with no set and no position.
  -->
  <ToggleGroupPrimitive.Root
    bind:ref
    type="single"
    bind:value={single, change}
    {orientation}
    {disabled}
    class={classes}
    aria-label={label}
    {...rest}
  >
    {#snippet child({ props })}
      <div {...props} role="radiogroup">{@render items()}</div>
    {/snippet}
  </ToggleGroupPrimitive.Root>
{/if}
