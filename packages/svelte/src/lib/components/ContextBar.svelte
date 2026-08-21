<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    section: string;
    title: string;
    detail?: string;
    actions?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    section,
    title,
    detail,
    actions,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<div bind:this={ref} class={cx('ldt-contextbar', className)} {...rest}>
  <div class="ldt-contextbar__location">
    <span class="ldt-contextbar__section">{section}</span><strong class="ldt-contextbar__title"
      >{title}</strong
    >{#if detail}<small class="ldt-contextbar__detail">{detail}</small>{/if}
  </div>
  {#if actions}<div class="ldt-contextbar__actions">{@render actions()}</div>{/if}
</div>
