<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface CommonProps {
    /** Highlighted as the current item: `aria-current` on links, `aria-pressed` on buttons. */
    selected?: boolean;
    class?: string;
    children: Snippet;
    ref?: HTMLAnchorElement | HTMLButtonElement | null;
  }

  // Same href rule as Button: with it an <a>, without it a <button>.
  type Props = CommonProps &
    (
      | (Omit<HTMLAnchorAttributes, 'class' | 'type'> & { href: string; type?: never })
      | (Omit<HTMLButtonAttributes, 'class'> & { href?: never })
    );

  let {
    selected = false,
    href,
    type = 'button',
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const classes = $derived(cx('ldt-list-row', selected && 'ldt-list-row--selected', className));
</script>

{#if href}
  <a
    bind:this={ref}
    {href}
    class={classes}
    aria-current={selected || undefined}
    {...rest as HTMLAnchorAttributes}>{@render children()}</a
  >
{:else}
  <button
    bind:this={ref}
    {type}
    class={classes}
    aria-pressed={selected || undefined}
    {...rest as HTMLButtonAttributes}>{@render children()}</button
  >
{/if}
