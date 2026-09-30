<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAnchorAttributes, 'href'> {
    /** Id of the element to skip to — usually `<main>`. */
    targetId: string;
    /** Link text, when `children` is not given. */
    label?: string;
    children?: Snippet;
    class?: string;
    ref?: HTMLAnchorElement | null;
  }

  let {
    targetId,
    label = 'Skip to main content',
    children,
    onclick,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement }) {
    onclick?.(event);
    if (event.defaultPrevented) return;
    const destination = document.getElementById(targetId);
    if (!destination) return;
    // Following the fragment scrolls, but only moves focus if the target is focusable. A
    // `<main>` is not, so without this the next Tab starts again from the top of the page.
    if (!destination.matches('a[href], button, input, select, textarea, [tabindex]')) {
      destination.tabIndex = -1;
    }
    destination.focus();
  }
</script>

<a
  bind:this={ref}
  class={cx('ldt-skip-link', className)}
  href={`#${targetId}`}
  {...rest}
  onclick={handleClick}
>
  {#if children}{@render children()}{:else}{label}{/if}
</a>
