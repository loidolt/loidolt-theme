<script lang="ts" generics="T extends string = string">
  import type { Snippet } from 'svelte';
  import DropdownMenu from './DropdownMenu.svelte';
  import type { Alignment, MenuItem, Placement } from '../types.js';
  import { cx } from '../utils.js';

  interface Props {
    open?: boolean;
    /** Trigger text. */
    label: string;
    /** Heading above the items inside the popup. */
    groupLabel?: string;
    items?: MenuItem<T>[];
    children?: Snippet;
    /** Marks this entry as the current section: styles the trigger and sets `aria-current`. */
    active?: boolean;
    side?: Placement;
    align?: Alignment;
    /** `class` lands on the trigger; use `menuClass` for the popup. */
    class?: string;
    menuClass?: string;
    onSelect?: (value: T) => void;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    label,
    groupLabel,
    items,
    children,
    active = false,
    side,
    align,
    class: className,
    menuClass,
    onSelect,
    onOpenChange,
  }: Props = $props();
</script>

{#snippet navTrigger({ props }: { props: Record<string, unknown> })}
  <button
    {...props}
    type="button"
    class={cx('ldt-nav-menu', active && 'ldt-nav-menu--active', className)}
    aria-current={active ? 'page' : undefined}>{label} <span aria-hidden="true">⌄</span></button
  >
{/snippet}

<DropdownMenu
  bind:open
  {items}
  {groupLabel}
  {children}
  {side}
  {align}
  {onSelect}
  {onOpenChange}
  triggerChild={navTrigger}
  class={menuClass}
/>
