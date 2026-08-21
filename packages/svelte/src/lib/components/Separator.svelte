<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Orientation } from '../types.js';
  import { cx } from '../utils.js';

  type Props = HTMLAttributes<HTMLHRElement> &
    HTMLAttributes<HTMLDivElement> & {
      orientation?: Orientation;
      class?: string;
      ref?: HTMLElement | null;
    };

  let {
    orientation = 'horizontal',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const classes = $derived(
    cx('ldt-separator', orientation === 'vertical' && 'ldt-separator--vertical', className)
  );
</script>

{#if orientation === 'vertical'}
  <div bind:this={ref} class={classes} role="separator" aria-orientation="vertical" {...rest}></div>
{:else}
  <hr bind:this={ref} class={classes} {...rest} />
{/if}
