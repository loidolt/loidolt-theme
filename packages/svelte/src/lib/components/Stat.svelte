<script lang="ts">
  import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface CommonProps {
    label: string;
    value: string | number;
    /** Small accent line above the value, in the eyebrow voice. */
    eyebrow?: string;
    class?: string;
    ref?: HTMLElement | null;
  }

  type Props = CommonProps &
    (
      | (Omit<HTMLAnchorAttributes, 'class'> & { href: string })
      | (Omit<HTMLAttributes<HTMLElement>, 'class'> & { href?: never })
    );

  let {
    label,
    value,
    eyebrow,
    href,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<svelte:element
  this={href ? 'a' : 'div'}
  bind:this={ref}
  class={cx('ldt-stat', className)}
  {href}
  {...rest}
>
  {#if eyebrow}<p class="ldt-eyebrow">{eyebrow}</p>{/if}
  <p class="ldt-stat__value">{value}</p>
  <p class="ldt-stat__label">{label}</p>
</svelte:element>
