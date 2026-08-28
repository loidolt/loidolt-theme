<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { DialogContentProps } from 'bits-ui';
  import type {
    ActionVariant,
    ControlSize,
    DialogSize,
    HeadingLevel,
    TriggerChildProps,
  } from '../types.js';
  import { cx } from '../utils.js';

  type Props = Omit<DialogContentProps, 'children' | 'class' | 'child'> & {
    open?: boolean;
    title: string;
    description?: string;
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
    /** Sets `--ldt-dialog-width` via a modifier class. Omit to inherit the CSS default. */
    size?: DialogSize;
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
    trigger,
    triggerChild,
    triggerVariant,
    triggerSize,
    triggerClass,
    children,
    footer,
    size,
    headingLevel = 2,
    showClose = true,
    closeLabel = 'Close dialog',
    class: className,
    overlayClass,
    onOpenChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // An explicit triggerClass keeps today's contract and wins outright; otherwise the class is
  // composed from the button variant vocabulary.
  const triggerClasses = $derived(
    triggerClass ??
      cx(
        'ldt-button',
        triggerVariant && triggerVariant !== 'default' && `ldt-button--${triggerVariant}`,
        triggerSize && triggerSize !== 'md' && `ldt-button--${triggerSize}`
      )
  );
</script>

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
      class={cx('ldt-dialog', size && `ldt-dialog--${size}`, className)}
      {...rest}
    >
      <div class="ldt-dialog__header">
        <div>
          <DialogPrimitive.Title level={headingLevel} class="ldt-dialog__title"
            >{title}</DialogPrimitive.Title
          >{#if description}<DialogPrimitive.Description class="ldt-dialog__description"
              >{description}</DialogPrimitive.Description
            >{/if}
        </div>
        {#if showClose}<DialogPrimitive.Close
            class="ldt-button ldt-icon-button ldt-button--ghost"
            aria-label={closeLabel}>×</DialogPrimitive.Close
          >{/if}
      </div>
      <div class="ldt-dialog__body">{@render children()}</div>
      {#if footer}<div class="ldt-dialog__footer">{@render footer()}</div>{/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
