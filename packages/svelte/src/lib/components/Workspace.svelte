<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    sidebar?: Snippet;
    children: Snippet;
    inspector?: Snippet;
    /**
     * Collapses the sidebar column when `false` — the toggle behind a "hide navigation" control.
     * The snippet is left unrendered rather than hidden, so nothing in it holds focus or is
     * reachable by the tab order while collapsed.
     */
    sidebarOpen?: boolean;
    /** The same for the inspector column. */
    inspectorOpen?: boolean;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    sidebar,
    children,
    inspector,
    sidebarOpen = true,
    inspectorOpen = true,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const showSidebar = $derived(Boolean(sidebar) && sidebarOpen);
  const showInspector = $derived(Boolean(inspector) && inspectorOpen);
</script>

<!-- The grid columns follow the panes that are actually rendered. -->
<div
  bind:this={ref}
  class={cx(
    'ldt-workspace',
    showSidebar && 'ldt-workspace--sidebar',
    showInspector && 'ldt-workspace--inspector',
    className
  )}
  {...rest}
>
  {#if showSidebar}{@render sidebar!()}{/if}
  <div class="ldt-workspace__main">{@render children()}</div>
  {#if showInspector}{@render inspector!()}{/if}
</div>
