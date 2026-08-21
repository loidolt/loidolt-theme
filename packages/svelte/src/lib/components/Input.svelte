<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLInputAttributes, 'value'> {
    value?: string;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    class?: string;
    ref?: HTMLInputElement | null;
  }

  let {
    value = $bindable(''),
    boxed = false,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<input
  bind:this={ref}
  bind:value
  class={cx('ldt-input', boxed && 'ldt-input--boxed', className)}
  {...rest}
/>
