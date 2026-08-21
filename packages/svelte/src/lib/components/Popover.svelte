<script lang="ts">
  import { Popover as PopoverPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { PopoverContentProps } from 'bits-ui';
  import type { Alignment, Placement, TriggerChildProps } from '../types.js';
  import { cx } from '../utils.js';

  type Props = Omit<PopoverContentProps, 'children' | 'class' | 'child'> & {
    open?: boolean;
    trigger?: Snippet;
    /** Full control of the trigger element — receives the props Bits needs on it. */
    triggerChild?: Snippet<[TriggerChildProps]>;
    triggerClass?: string;
    children: Snippet;
    side?: Placement;
    align?: Alignment;
    sideOffset?: number;
    /** `class` lands on the portaled Content element. */
    class?: string;
    onOpenChange?: (open: boolean) => void;
    ref?: HTMLElement | null;
  };

  let {
    open = $bindable(false),
    trigger,
    triggerChild,
    triggerClass = 'ldt-button ldt-button--quiet',
    children,
    side = 'bottom',
    align = 'start',
    sideOffset = 6,
    class: className,
    onOpenChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<PopoverPrimitive.Root bind:open {onOpenChange}>
  {#if triggerChild}<PopoverPrimitive.Trigger
      >{#snippet child(childProps)}{@render triggerChild(
          childProps
        )}{/snippet}</PopoverPrimitive.Trigger
    >{:else if trigger}<PopoverPrimitive.Trigger class={triggerClass}
      >{@render trigger()}</PopoverPrimitive.Trigger
    >{/if}
  <PopoverPrimitive.Portal
    ><PopoverPrimitive.Content
      bind:ref
      {side}
      {align}
      {sideOffset}
      class={cx('ldt-popover', className)}
      {...rest}>{@render children()}</PopoverPrimitive.Content
    ></PopoverPrimitive.Portal
  >
</PopoverPrimitive.Root>
