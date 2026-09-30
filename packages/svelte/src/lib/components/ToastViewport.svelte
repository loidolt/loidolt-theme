<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    label?: string;
    /** `polite` for routine updates; `assertive` interrupts and should be rare. */
    politeness?: 'polite' | 'assertive';
    /** Which corner or edge the stack sits against. Top positions stack newest-last as well. */
    position?:
      'bottom-end' | 'bottom-start' | 'bottom-center' | 'top-end' | 'top-start' | 'top-center';
    class?: string;
    children: Snippet;
    ref?: HTMLDivElement | null;
  }

  let {
    label = 'Notifications',
    politeness = 'polite',
    position = 'bottom-end',
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!--
  A plain `<div>`, not a `<section>`: the region has to stay mounted for a screen reader to
  announce toasts added later, and an always-present landmark with nothing in it is noise.
-->
<div
  bind:this={ref}
  class={cx(
    'ldt-toast-viewport',
    position !== 'bottom-end' && `ldt-toast-viewport--${position}`,
    className
  )}
  aria-label={label}
  aria-live={politeness}
  aria-relevant="additions text"
  {...rest}
  role="log"
>
  {@render children()}
</div>
