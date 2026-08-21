<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    sidebar?: Snippet;
    children: Snippet;
    inspector?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    sidebar,
    children,
    inspector,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!-- The grid columns follow the snippets that are actually present. -->
<div
  bind:this={ref}
  class={cx(
    'ldt-workspace',
    sidebar && 'ldt-workspace--sidebar',
    inspector && 'ldt-workspace--inspector',
    className
  )}
  {...rest}
>
  {#if sidebar}{@render sidebar()}{/if}
  <div class="ldt-workspace__main">{@render children()}</div>
  {#if inspector}{@render inspector()}{/if}
</div>
