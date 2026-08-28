<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Full-width row above the panes — a ContextBar or toolbar. */
    header?: Snippet;
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
    /** Extra classes for the main pane, replacing consumer reach-ins on `__main`. */
    mainClass?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    header,
    sidebar,
    children,
    inspector,
    sidebarOpen = true,
    inspectorOpen = true,
    class: className,
    mainClass,
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
    header && 'ldt-workspace--header',
    showSidebar && 'ldt-workspace--sidebar',
    showInspector && 'ldt-workspace--inspector',
    className
  )}
  {...rest}
>
  {#if header}<div class="ldt-workspace__header">{@render header()}</div>{/if}
  {#if showSidebar}{@render sidebar!()}{/if}
  <div class={cx('ldt-workspace__main', mainClass)}>{@render children()}</div>
  {#if showInspector}{@render inspector!()}{/if}
</div>
