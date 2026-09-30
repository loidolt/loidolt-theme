<script lang="ts">
  import { tick, untrack } from 'svelte';
  import {
    IconButton,
    LiveRegion,
    Slider,
    Switch,
    createAnnouncer,
    cx,
  } from '@loidolt/theme-svelte';
  import type { LayerState } from '../core/types.js';
  import { requireMapContext, type LayerEntry } from '../internal/context.js';
  import MapControl from './MapControl.svelte';

  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  interface Props {
    /** The layers to offer, by id. Defaults to every layer placed with a layer component. */
    layers?: string[];
    title?: string;
    position?: Corner;
    /** Offer an opacity slider per layer. */
    showOpacity?: boolean;
    /** Offer moving layers up and down (Alt + ↑ and ↓ on a row, too). */
    allowReorder?: boolean;
    /** Show the list. Bindable, and toggled by the heading. */
    open?: boolean;
    /** Every change: visibility, opacity or order. Top of the list first. */
    onChange?: (layers: LayerState[]) => void;
    opacityLabel?: (label: string) => string;
    moveUpLabel?: (label: string) => string;
    moveDownLabel?: (label: string) => string;
    movedMessage?: (label: string, position: number, total: number) => string;
    class?: string;
  }

  let {
    layers: only,
    title = 'Layers',
    position = 'top-right',
    showOpacity = true,
    allowReorder = true,
    open = $bindable(true),
    onChange,
    opacityLabel = (label) => `${label} opacity`,
    moveUpLabel = (label) => `Move ${label} up`,
    moveDownLabel = (label) => `Move ${label} down`,
    movedMessage = (label, place, total) => `${label} moved to position ${place} of ${total}.`,
    class: className,
  }: Props = $props();

  const context = requireMapContext('LayerManager');
  const announcer = createAnnouncer();
  const id = $props.id();
  let list = $state<HTMLUListElement | null>(null);
  let orderVersion = $state(0);
  let states = $state<Record<string, { visible: boolean; opacity: number }>>({});

  const OPACITY: Record<string, string[]> = {
    fill: ['fill-opacity'],
    line: ['line-opacity'],
    circle: ['circle-opacity', 'circle-stroke-opacity'],
    symbol: ['text-opacity', 'icon-opacity'],
    'fill-extrusion': ['fill-extrusion-opacity'],
    heatmap: ['heatmap-opacity'],
    raster: ['raster-opacity'],
    background: ['background-opacity'],
  };

  /** Managed layers in draw order, topmost first — the order the list shows. */
  const rows = $derived.by((): LayerEntry[] => {
    void orderVersion;
    void context.styleVersion;
    const map = context.map;
    const entries = context.layers.filter((entry) => !only || only.includes(entry.id));
    if (!map) return entries;
    const drawn = (map.getStyle()?.layers ?? []).map((layer) => layer.id);
    return entries
      .filter((entry) => drawn.includes(entry.id))
      .sort((a, b) => drawn.indexOf(b.id) - drawn.indexOf(a.id));
  });

  // Read each layer's current state off the map as it arrives.
  $effect(() => {
    const map = context.map;
    const current = rows;
    if (!map) return;
    untrack(() => {
      for (const entry of current) {
        if (states[entry.id]) continue;
        const property = OPACITY[entry.type]?.[0];
        const opacity = property ? map.getPaintProperty(entry.id, property as never) : undefined;
        states[entry.id] = {
          visible: map.getLayoutProperty(entry.id, 'visibility') !== 'none',
          opacity: typeof opacity === 'number' ? opacity : 1,
        };
      }
    });
  });

  const snapshot = (): LayerState[] =>
    rows.map((entry) => ({
      id: entry.id,
      label: entry.label,
      visible: states[entry.id]?.visible ?? true,
      opacity: states[entry.id]?.opacity ?? 1,
    }));

  function setVisible(entry: LayerEntry, visible: boolean) {
    context.map?.setLayoutProperty(entry.id, 'visibility', visible ? 'visible' : 'none');
    states[entry.id] = { ...states[entry.id], visible };
    onChange?.(snapshot());
  }

  function setOpacity(entry: LayerEntry, opacity: number) {
    for (const property of OPACITY[entry.type] ?? []) {
      context.map?.setPaintProperty(entry.id, property as never, opacity as never);
    }
    states[entry.id] = { ...states[entry.id], opacity };
    onChange?.(snapshot());
  }

  /** Moves a layer one place up (drawn above its neighbour) or down, keeping focus with it. */
  async function move(entry: LayerEntry, direction: 'up' | 'down') {
    const map = context.map;
    const index = rows.indexOf(entry);
    const neighbour = rows[direction === 'up' ? index - 1 : index + 1];
    if (!map || !neighbour) return;
    if (direction === 'down') {
      map.moveLayer(entry.id, neighbour.id);
    } else {
      // Above the neighbour means before whatever is drawn right after it, or on top.
      const drawn = (map.getStyle()?.layers ?? []).map((layer) => layer.id);
      map.moveLayer(entry.id, drawn[drawn.indexOf(neighbour.id) + 1]);
    }
    orderVersion += 1;
    const place = rows.indexOf(entry) + 1;
    announcer.announce(movedMessage(entry.label, place, rows.length));
    onChange?.(snapshot());
    // Reordering moves the row's DOM, which drops focus; put it back on the same control.
    await tick();
    const row = list?.querySelector<HTMLElement>(`[data-layer="${CSS.escape(entry.id)}"]`);
    const preferred = row?.querySelector<HTMLButtonElement>(
      `[data-move="${direction}"]:not(:disabled)`
    );
    (preferred ?? row?.querySelector<HTMLButtonElement>('[data-move]:not(:disabled)'))?.focus();
  }

  function onRowKeydown(event: KeyboardEvent, entry: LayerEntry) {
    if (!allowReorder || !event.altKey) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    void move(entry, event.key === 'ArrowUp' ? 'up' : 'down');
  }
</script>

<MapControl {position} class={cx('ldt-layer-manager', className)}>
  <section aria-labelledby={`${id}-title`}>
    <h3 class="ldt-layer-manager__title" id={`${id}-title`}>
      <button
        type="button"
        class="ldt-layer-manager__toggle"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onclick={() => (open = !open)}>{title}</button
      >
    </h3>
    <ul bind:this={list} class="ldt-layer-manager__list" id={`${id}-list`} hidden={!open}>
      {#each rows as entry, index (entry.id)}
        {@const state = states[entry.id] ?? { visible: true, opacity: 1 }}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <li
          class="ldt-layer-manager__row"
          data-layer={entry.id}
          onkeydown={(event) => onRowKeydown(event, entry)}
        >
          <Switch checked={state.visible} onCheckedChange={(visible) => setVisible(entry, visible)}
            >{entry.label}</Switch
          >
          {#if allowReorder}
            <span class="ldt-layer-manager__move">
              <IconButton
                size="sm"
                label={moveUpLabel(entry.label)}
                data-move="up"
                disabled={index === 0}
                onclick={() => move(entry, 'up')}
              >
                <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false"
                  ><path
                    d="M5 8V2M2 5l3-3 3 3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.4"
                  /></svg
                >
              </IconButton>
              <IconButton
                size="sm"
                label={moveDownLabel(entry.label)}
                data-move="down"
                disabled={index === rows.length - 1}
                onclick={() => move(entry, 'down')}
              >
                <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false"
                  ><path
                    d="M5 2v6M2 5l3 3 3-3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.4"
                  /></svg
                >
              </IconButton>
            </span>
          {/if}
          {#if showOpacity && OPACITY[entry.type]}
            <Slider
              class="ldt-layer-manager__opacity"
              label={opacityLabel(entry.label)}
              min={0}
              max={1}
              step={0.05}
              value={state.opacity}
              disabled={!state.visible}
              formatValue={(value) => `${Math.round(value * 100)}%`}
              onValueChange={(value) => setOpacity(entry, value as number)}
            />
          {/if}
        </li>
      {/each}
    </ul>
    <LiveRegion message={announcer.message} politeness={announcer.politeness} />
  </section>
</MapControl>
