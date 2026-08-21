<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
    value?: string;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    class?: string;
    ref?: HTMLTextAreaElement | null;
  }

  let {
    value = $bindable(''),
    boxed = false,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<textarea
  bind:this={ref}
  bind:value
  class={cx('ldt-textarea', boxed && 'ldt-textarea--boxed', className)}
  {...rest}
></textarea>
