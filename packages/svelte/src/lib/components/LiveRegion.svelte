<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Politeness } from '../announcer.svelte.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Text to announce. Changing it is what triggers speech. */
    message?: string;
    /** `'polite'` waits for a pause (`role="status"`); `'assertive'` interrupts (`role="alert"`). */
    politeness?: Politeness;
    /** Read the whole region on every change, not only the changed part. */
    atomic?: boolean;
    /** Keep the region off-screen. Set `false` to also show the message visually. */
    visuallyHidden?: boolean;
    /** Rendered after `message`, for richer content. */
    children?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    message = '',
    politeness = 'polite',
    atomic = true,
    visuallyHidden = true,
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!--
  Must already be in the document before its text changes: a region mounted together with its
  message is silent in most screen readers. Render it once, unconditionally, and change the
  message — `createAnnouncer()` does that bookkeeping.
-->
<div
  bind:this={ref}
  class={cx('ldt-live-region', visuallyHidden && 'ldt-sr-only', className)}
  role={politeness === 'assertive' ? 'alert' : 'status'}
  aria-live={politeness}
  aria-atomic={atomic}
  {...rest}
>
  {message}{#if children}{@render children()}{/if}
</div>
