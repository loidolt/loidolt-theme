<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { DialogContentProps } from 'bits-ui';
  import type { ActionVariant, ControlSize, HeadingLevel, TriggerChildProps } from '../types.js';
  import { cx } from '../utils.js';

  type Props = Omit<DialogContentProps, 'children' | 'class' | 'child'> & {
    open?: boolean;
    title: string;
    description?: string;
    /** Edge the panel is anchored to. `left`/`right` size by width, `top`/`bottom` by height. */
    side?: 'left' | 'right' | 'top' | 'bottom';
    /** Trigger contents, rendered inside a button styled with `triggerClass`. */
    trigger?: Snippet;
    /** Full control of the trigger element — receives the props Bits needs on it. */
    triggerChild?: Snippet<[TriggerChildProps]>;
    /** Button variant for the default trigger. An explicit `triggerClass` wins wholesale. */
    triggerVariant?: ActionVariant;
    triggerSize?: ControlSize;
    triggerClass?: string;
    children: Snippet;
    footer?: Snippet;
    headingLevel?: HeadingLevel;
    showClose?: boolean;
    closeLabel?: string;
    /** `class` lands on the portaled Content element. */
    class?: string;
    overlayClass?: string;
    onOpenChange?: (open: boolean) => void;
    ref?: HTMLElement | null;
  };

  let {
    open = $bindable(false),
    title,
    description,
    side = 'left',
    trigger,
    triggerChild,
    triggerVariant,
    triggerSize,
    triggerClass,
    children,
    footer,
    headingLevel = 2,
    showClose = true,
    closeLabel = 'Close',
    class: className,
    overlayClass,
    onOpenChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // An explicit triggerClass keeps today's contract and wins outright.
  const triggerClasses = $derived(
    triggerClass ??
      cx(
        'ldt-button',
        triggerVariant && triggerVariant !== 'default' && `ldt-button--${triggerVariant}`,
        triggerSize && triggerSize !== 'md' && `ldt-button--${triggerSize}`
      )
  );
</script>

<!--
  A modal panel anchored to one edge — the narrow-viewport form of a sidebar, and the usual home
  for navigation that has no room to sit in the topbar. Same primitive as `Dialog`, so focus is
  trapped, Escape closes, and the page behind is inert; set `--ldt-drawer-size` for the measure
  across the anchored edge.
-->
<DialogPrimitive.Root bind:open {onOpenChange}>
  {#if triggerChild}<DialogPrimitive.Trigger
      >{#snippet child(childProps)}{@render triggerChild(
          childProps
        )}{/snippet}</DialogPrimitive.Trigger
    >{:else if trigger}<DialogPrimitive.Trigger class={triggerClasses}
      >{@render trigger()}</DialogPrimitive.Trigger
    >{/if}
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay class={cx('ldt-overlay', overlayClass)} />
    <DialogPrimitive.Content
      bind:ref
      class={cx('ldt-drawer', `ldt-drawer--${side}`, className)}
      {...rest}
    >
      <div class="ldt-drawer__header">
        <div>
          <DialogPrimitive.Title level={headingLevel} class="ldt-drawer__title"
            >{title}</DialogPrimitive.Title
          >{#if description}<DialogPrimitive.Description class="ldt-drawer__description"
              >{description}</DialogPrimitive.Description
            >{/if}
        </div>
        {#if showClose}<DialogPrimitive.Close
            class="ldt-button ldt-icon-button ldt-button--ghost"
            aria-label={closeLabel}>×</DialogPrimitive.Close
          >{/if}
      </div>
      <div class="ldt-drawer__body ldt-scrollbar">{@render children()}</div>
      {#if footer}<div class="ldt-drawer__footer">{@render footer()}</div>{/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
