<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLLabelAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLLabelAttributes {
    for?: string;
    class?: string;
    children: Snippet;
    ref?: HTMLLabelElement | null;
  }

  let {
    for: htmlFor,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<label bind:this={ref} for={htmlFor} class={cx('ldt-label', className)} {...rest}
  >{@render children()}</label
>
