<script lang="ts">
  import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { AlertDialogContentProps } from 'bits-ui';
  import type {
    ActionVariant,
    ControlSize,
    DialogSize,
    HeadingLevel,
    TriggerChildProps,
  } from '../types.js';
  import { cx } from '../utils.js';

  type Props = Omit<AlertDialogContentProps, 'children' | 'class' | 'child'> & {
    open?: boolean;
    title: string;
    /** What confirming will do. Say the consequence here, not in the button. */
    description?: string;
    /** Trigger contents, rendered inside a button styled with `triggerClass`. */
    trigger?: Snippet;
    /** Full control of the trigger element — receives the props Bits needs on it. */
    triggerChild?: Snippet<[TriggerChildProps]>;
    /** Button variant for the default trigger. An explicit `triggerClass` wins wholesale. */
    triggerVariant?: ActionVariant;
    triggerSize?: ControlSize;
    triggerClass?: string;
    /** Extra body content between the description and the buttons. */
    children?: Snippet;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Colour of the confirm button. Use `danger` for anything destructive. */
    confirmVariant?: ActionVariant;
    onConfirm?: () => void;
    onCancel?: () => void;
    size?: DialogSize;
    headingLevel?: HeadingLevel;
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
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'primary',
    onConfirm,
    onCancel,
    size = 'sm',
    headingLevel = 2,
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
  A decision the user has to answer before anything else continues. Unlike `Dialog` it has no
  close affordance in the corner and does not dismiss on an outside click — Bits' alertdialog
  role enforces that, and it is the point: a confirmation you can dismiss by missing is not one.
  Focus opens on Cancel, so a stray Enter cannot confirm a destructive action.
-->
<AlertDialogPrimitive.Root bind:open {onOpenChange}>
  {#if triggerChild}<AlertDialogPrimitive.Trigger
      >{#snippet child(childProps)}{@render triggerChild(
          childProps
        )}{/snippet}</AlertDialogPrimitive.Trigger
    >{:else if trigger}<AlertDialogPrimitive.Trigger class={triggerClasses}
      >{@render trigger()}</AlertDialogPrimitive.Trigger
    >{/if}
  <AlertDialogPrimitive.Portal>
    <AlertDialogPrimitive.Overlay class={cx('ldt-overlay', overlayClass)} />
    <AlertDialogPrimitive.Content
      bind:ref
      class={cx('ldt-dialog', size && `ldt-dialog--${size}`, className)}
      {...rest}
    >
      <div class="ldt-dialog__header">
        <div>
          <AlertDialogPrimitive.Title level={headingLevel} class="ldt-dialog__title"
            >{title}</AlertDialogPrimitive.Title
          >{#if description}<AlertDialogPrimitive.Description class="ldt-dialog__description"
              >{description}</AlertDialogPrimitive.Description
            >{/if}
        </div>
      </div>
      {#if children}<div class="ldt-dialog__body">{@render children()}</div>{/if}
      <div class="ldt-dialog__footer">
        <AlertDialogPrimitive.Cancel
          class="ldt-button ldt-button--quiet"
          onclick={() => onCancel?.()}>{cancelLabel}</AlertDialogPrimitive.Cancel
        >
        <!--
          Bits leaves the Action button open on purpose, for callers awaiting a request. This
          wrapper is the declarative form, so it closes: `open` is bindable, and work that has to
          keep the dialog up can set it back to `true` from `onConfirm`.
        -->
        <AlertDialogPrimitive.Action
          class={cx('ldt-button', confirmVariant !== 'default' && `ldt-button--${confirmVariant}`)}
          onclick={() => {
            onConfirm?.();
            open = false;
          }}>{confirmLabel}</AlertDialogPrimitive.Action
        >
      </div>
    </AlertDialogPrimitive.Content>
  </AlertDialogPrimitive.Portal>
</AlertDialogPrimitive.Root>
