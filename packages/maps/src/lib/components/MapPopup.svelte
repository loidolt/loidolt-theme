<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { Popup } from 'maplibre-gl';
  import { IconButton, cx } from '@loidolt/theme-svelte';
  import type { LngLat } from '../core/types.js';
  import { requireMapContext } from '../internal/context.js';
  import { safely } from '../internal/safely.js';

  interface Props {
    /** Where the popup points. */
    lngLat: LngLat;
    /** Bindable. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Names the popup for assistive tech, e.g. the place it describes. */
    label: string;
    closeLabel?: string;
    /** Close when the map itself is clicked. */
    closeOnClick?: boolean;
    /** Distance from `lngLat`, in pixels. */
    offset?: number;
    children?: Snippet;
    class?: string;
  }

  let {
    lngLat,
    open = $bindable(false),
    onOpenChange,
    label,
    closeLabel = 'Close',
    closeOnClick = true,
    offset = 12,
    children,
    class: className,
  }: Props = $props();

  const context = requireMapContext('MapPopup');
  let content = $state<HTMLDivElement | null>(null);
  let popup = $state.raw<Popup | null>(null);
  let returnTo: HTMLElement | null = null;

  const setOpen = (next: boolean) => {
    if (open === next) return;
    open = next;
    onOpenChange?.(next);
  };

  /** Focus goes back where it came from — unless the user has already moved it elsewhere. */
  const restoreFocus = () => {
    const active = document.activeElement;
    const inside = !active || active === document.body || content?.contains(active);
    if (inside && returnTo?.isConnected) returnTo.focus();
    returnTo = null;
  };

  $effect(() => {
    const target = context.map;
    const lib = context.lib;
    const element = content;
    if (!target || !lib || !element) return;
    const created = new lib.Popup({
      closeButton: false,
      closeOnClick: untrack(() => closeOnClick),
      focusAfterOpen: false,
      maxWidth: 'none',
      offset: untrack(() => offset),
      className: 'ldt-map-popup',
    }).setDOMContent(element);
    created.on('close', () => {
      setOpen(false);
      restoreFocus();
    });
    popup = created;
    return () => {
      popup = null;
      safely(() => created.remove());
    };
  });

  $effect(() => {
    const target = context.map;
    const current = popup;
    if (!target || !current) return;
    current.setLngLat(lngLat);
    if (open && !current.isOpen()) {
      returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      current.addTo(target);
      // Non-modal: focus moves in so its content is read and reachable, and Escape or the
      // close button brings it back.
      queueMicrotask(() => content?.focus());
    } else if (!open && current.isOpen()) {
      current.remove();
    }
  });
</script>

<div hidden>
  <div
    bind:this={content}
    class={cx('ldt-map-popup__content', className)}
    role="dialog"
    aria-label={label}
    tabindex="-1"
    onkeydown={(event) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
    }}
  >
    <div class="ldt-map-popup__body">{@render children?.()}</div>
    <IconButton
      label={closeLabel}
      size="sm"
      class="ldt-map-popup__close"
      onclick={() => setOpen(false)}
    >
      <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false"
        ><path d="m2 2 6 6M8 2 2 8" stroke="currentColor" stroke-width="1.4" /></svg
      >
    </IconButton>
  </div>
</div>
