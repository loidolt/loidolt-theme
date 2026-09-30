<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Button from './Button.svelte';
  import IconButton from './IconButton.svelte';
  import type { ToastAction } from '../toaster.svelte.js';
  import type { StatusVariant } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    variant?: StatusVariant;
    dismissLabel?: string;
    onDismiss?: () => void;
    /** One follow-up button, e.g. Undo. Runs `onAction`, then dismisses unless told not to. */
    action?: ToastAction;
    /** Custom action area, in place of `action`. */
    actions?: Snippet;
    /**
     * Read by `createToaster`, not the component. Declared so `{...toast}` from a toaster's queue
     * does not leak it onto the element as an attribute.
     */
    duration?: number;
    class?: string;
    children?: Snippet;
    ref?: HTMLDivElement | null;
  }

  let {
    title,
    description,
    variant,
    dismissLabel = 'Dismiss notification',
    onDismiss,
    action,
    actions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- read by the toaster, never rendered
    duration: _duration,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!--
  No `role="status"` here: `ToastViewport` is the live region, and nesting one inside another
  makes screen readers announce each toast twice.
-->
<div
  bind:this={ref}
  class={cx('ldt-toast', variant && `ldt-toast--${variant}`, className)}
  {...rest}
>
  <strong class="ldt-toast__title">{title}</strong>{#if description}<p
      class="ldt-toast__description"
    >
      {description}
    </p>{/if}{#if children}<div class="ldt-toast__description">
      {@render children()}
    </div>{/if}{#if actions || action}<div class="ldt-toast__actions">
      {#if actions}{@render actions()}{:else if action}<Button
          size="sm"
          variant="quiet"
          onclick={() => {
            action.onAction();
            if (action.dismiss !== false) onDismiss?.();
          }}>{action.label}</Button
        >{/if}
    </div>{/if}{#if onDismiss}<IconButton
      class="ldt-toast__dismiss"
      size="sm"
      label={dismissLabel}
      onclick={onDismiss}>×</IconButton
    >{/if}
</div>
