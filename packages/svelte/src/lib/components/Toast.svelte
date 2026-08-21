<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import IconButton from './IconButton.svelte';
  import type { StatusVariant } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    variant?: StatusVariant;
    dismissLabel?: string;
    onDismiss?: () => void;
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
    </div>{/if}{#if onDismiss}<IconButton
      class="ldt-toast__dismiss"
      size="sm"
      label={dismissLabel}
      onclick={onDismiss}>×</IconButton
    >{/if}
</div>
