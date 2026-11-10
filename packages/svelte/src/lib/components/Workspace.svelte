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
    /**
     * Puts a divider between the main pane and the inspector that resizes the two against each
     * other, by pointer drag or from the keyboard. Below the compact breakpoint the panes stack
     * and the divider is hidden. The inspector is wrapped in `.ldt-workspace__inspector` so the
     * divider can name it in `aria-controls`.
     */
    resizable?: boolean;
    /**
     * With `resizable`: the inspector's share, in percent, of the width it splits with the main
     * pane (the sidebar is not counted). It is also the divider's `aria-valuenow`, rounded.
     */
    inspectorSize?: number;
    /** Smallest `inspectorSize` the divider allows, in percent. */
    inspectorMinSize?: number;
    /** Largest `inspectorSize` the divider allows, in percent. */
    inspectorMaxSize?: number;
    /** Percentage points an arrow key moves the divider; with Shift held, five times as far. */
    resizeStep?: number;
    /**
     * `localStorage` key that keeps the inspector size across reloads. Unset, the size lives in
     * memory only. Only sizes the divider sets are written; a server-rendered page restores the
     * stored size before it is first painted.
     */
    storageKey?: string;
    /** Accessible name of the divider. */
    resizeLabel?: string;
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
    resizable = false,
    inspectorSize = $bindable(30),
    inspectorMinSize = 15,
    inspectorMaxSize = 70,
    resizeStep = 2,
    storageKey,
    resizeLabel = 'Resize inspector',
    class: className,
    mainClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const inspectorId = $props.id();

  const showSidebar = $derived(Boolean(sidebar) && sidebarOpen);
  const showInspector = $derived(Boolean(inspector) && inspectorOpen);
  const split = $derived(resizable && showInspector);

  const clamp = (value: number) =>
    Math.min(inspectorMaxSize, Math.max(inspectorMinSize, Math.round(value * 10) / 10));
  const size = $derived(clamp(inspectorSize));

  // Read during setup rather than on mount, so a client-rendered page draws the stored size the
  // first time. Storage can throw outright (blocked cookies, partitioned frames); that only means
  // the size is not remembered.
  const readStored = () => {
    if (typeof localStorage === 'undefined' || !storageKey) return;
    try {
      const stored = Number.parseFloat(localStorage.getItem(storageKey) ?? '');
      if (Number.isFinite(stored)) inspectorSize = clamp(stored);
    } catch {
      /* memory-only */
    }
  };
  readStored();

  const persist = () => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, String(size));
    } catch {
      /* see above */
    }
  };

  /*
   * Server-rendered markup cannot know the stored size, and hydration runs after first paint, so
   * a parser-run script sets the two shares on the workspace straight away. Inserted on the
   * client it is inert, and the setup read above does the same job.
   */
  const restoreScript = $derived.by(() => {
    if (!split || !storageKey) return '';
    const key = JSON.stringify(storageKey).replace(/</g, '\\u003c');
    const lo = Number(inspectorMinSize);
    const hi = Number(inspectorMaxSize);
    return (
      '<script>(function(s){try{var v=parseFloat(localStorage.getItem(' +
      key +
      '));if(v===v){v=Math.min(' +
      hi +
      ',Math.max(' +
      lo +
      ',v));var e=s.parentNode.style;' +
      "e.setProperty('--ldt-main-share',100-v+'fr');e.setProperty('--ldt-inspector-share',v+'fr')}" +
      '}catch(_){}})(document.currentScript)<' +
      '/script>'
    );
  });

  let main = $state<HTMLDivElement | null>(null);
  let pane = $state<HTMLDivElement | null>(null);
  let divider = $state<HTMLDivElement | null>(null);
  let resizing = $state(false);
  /** Where on the divider it was grabbed, so it does not jump to centre on the pointer. */
  let grabOffset = 0;
  /** The size Enter restores after collapsing the inspector to its minimum. */
  let restoreSize: number | undefined;

  const rtl = () => (ref ? getComputedStyle(ref).direction === 'rtl' : false);

  const sizeAt = (clientX: number): number | undefined => {
    if (!main || !pane || !divider) return undefined;
    const mainBox = main.getBoundingClientRect();
    const paneBox = pane.getBoundingClientRect();
    const gap = divider.getBoundingClientRect().width;
    const x = clientX - grabOffset;
    const reversed = rtl();
    const total = reversed
      ? mainBox.right - paneBox.left - gap
      : paneBox.right - mainBox.left - gap;
    if (total <= 0) return undefined;
    const width = reversed ? x - paneBox.left - gap / 2 : paneBox.right - x - gap / 2;
    return (width / total) * 100;
  };

  function onpointerdown(event: PointerEvent) {
    if (event.button !== 0 || !divider) return;
    event.preventDefault();
    const box = divider.getBoundingClientRect();
    grabOffset = event.clientX - (box.left + box.width / 2);
    resizing = true;
    divider.setPointerCapture?.(event.pointerId);
    divider.focus({ preventScroll: true });
  }

  function onpointermove(event: PointerEvent) {
    if (!resizing) return;
    const next = sizeAt(event.clientX);
    if (next !== undefined) inspectorSize = clamp(next);
  }

  function onpointerup(event: PointerEvent) {
    if (!resizing) return;
    resizing = false;
    if (divider?.hasPointerCapture?.(event.pointerId))
      divider.releasePointerCapture(event.pointerId);
    restoreSize = undefined;
    persist();
  }

  function onkeydown(event: KeyboardEvent) {
    const step = event.shiftKey ? resizeStep * 5 : resizeStep;
    // The divider moves the way the arrow points; which pane that grows depends on direction.
    const towardInspector = rtl() ? 'ArrowLeft' : 'ArrowRight';
    let next: number;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        next = size + (event.key === towardInspector ? -step : step);
        break;
      case 'Home':
        next = inspectorMinSize;
        break;
      case 'End':
        next = inspectorMaxSize;
        break;
      case 'Enter':
        // Collapses the inspector to its minimum, and puts it back on the second press.
        if (size > inspectorMinSize) {
          restoreSize = size;
          next = inspectorMinSize;
        } else if (restoreSize !== undefined) {
          next = restoreSize;
        } else return;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (event.key !== 'Enter') restoreSize = undefined;
    inspectorSize = clamp(next);
    persist();
  }
</script>

<!-- The grid columns follow the panes that are actually rendered. -->
<div
  bind:this={ref}
  class={cx(
    'ldt-workspace',
    header && 'ldt-workspace--header',
    showSidebar && 'ldt-workspace--sidebar',
    showInspector && 'ldt-workspace--inspector',
    split && 'ldt-workspace--resizable',
    resizing && 'ldt-workspace--resizing',
    className
  )}
  {...rest}
  style:--ldt-main-share={split ? `${100 - size}fr` : undefined}
  style:--ldt-inspector-share={split ? `${size}fr` : undefined}
>
  {#if header}<div class="ldt-workspace__header">{@render header()}</div>{/if}
  {#if showSidebar}{@render sidebar!()}{/if}
  <div bind:this={main} class={cx('ldt-workspace__main', mainClass)}>{@render children()}</div>
  {#if split}
    <!-- A focusable separator is an interactive widget in ARIA (a window splitter), which the
         compiler's role table does not know. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div
      bind:this={divider}
      class="ldt-workspace__divider"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      aria-label={resizeLabel}
      aria-controls={inspectorId}
      aria-valuenow={Math.round(size)}
      aria-valuemin={inspectorMinSize}
      aria-valuemax={inspectorMaxSize}
      {onpointerdown}
      {onpointermove}
      {onpointerup}
      onpointercancel={onpointerup}
      {onkeydown}
    ></div>
    <div bind:this={pane} id={inspectorId} class="ldt-workspace__inspector">
      {@render inspector!()}
    </div>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- built from a JSON-escaped key and numbers -->
    {@html restoreScript}
  {:else if showInspector}
    {@render inspector!()}
  {/if}
</div>
