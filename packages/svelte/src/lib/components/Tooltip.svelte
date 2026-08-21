<script lang="ts">
  import { Tooltip as TooltipPrimitive } from 'bits-ui';
  import type { TooltipContentProps } from 'bits-ui';
  import { getContext, type Snippet } from 'svelte';
  import type { Alignment, Placement, TriggerChildProps } from '../types.js';
  import { cx } from '../utils.js';
  import { TOOLTIP_PROVIDER_KEY } from './TooltipProvider.svelte';

  type Props = Omit<TooltipContentProps, 'children' | 'class' | 'child'> & {
    open?: boolean;
    content: string;
    trigger?: Snippet;
    /** Full control of the trigger element — avoids nesting a button inside the trigger. */
    triggerChild?: Snippet<[TriggerChildProps]>;
    triggerClass?: string;
    /**
     * Set only when the trigger has no accessible name of its own. Bits already wires
     * `aria-describedby`, so forcing an `aria-label` here would clobber that name.
     */
    triggerLabel?: string;
    side?: Placement;
    align?: Alignment;
    sideOffset?: number;
    /** Ignored when an ancestor `TooltipProvider` is present. */
    delayDuration?: number;
    /** `class` lands on the portaled Content element. */
    class?: string;
    onOpenChange?: (open: boolean) => void;
    ref?: HTMLElement | null;
  };

  let {
    open = $bindable(false),
    content,
    trigger,
    triggerChild,
    triggerClass = 'ldt-button ldt-icon-button ldt-button--ghost',
    triggerLabel,
    side = 'top',
    align = 'center',
    sideOffset = 6,
    delayDuration = 350,
    class: className,
    onOpenChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const hasProvider = getContext(TOOLTIP_PROVIDER_KEY) === true;
</script>

{#snippet tooltip()}
  <TooltipPrimitive.Root bind:open {onOpenChange}>
    {#if triggerChild}<TooltipPrimitive.Trigger
        >{#snippet child(childProps)}{@render triggerChild(
            childProps
          )}{/snippet}</TooltipPrimitive.Trigger
      >{:else if trigger}<TooltipPrimitive.Trigger class={triggerClass} aria-label={triggerLabel}
        >{@render trigger()}</TooltipPrimitive.Trigger
      >{/if}
    <TooltipPrimitive.Portal
      ><TooltipPrimitive.Content
        bind:ref
        {side}
        {align}
        {sideOffset}
        class={cx('ldt-tooltip', className)}
        {...rest}>{content}</TooltipPrimitive.Content
      ></TooltipPrimitive.Portal
    >
  </TooltipPrimitive.Root>
{/snippet}

{#if hasProvider}{@render tooltip()}{:else}<TooltipPrimitive.Provider {delayDuration}
    >{@render tooltip()}</TooltipPrimitive.Provider
  >{/if}
