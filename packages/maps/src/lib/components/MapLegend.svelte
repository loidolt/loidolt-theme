<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '@loidolt/theme-svelte';
  import type { LegendGradient, LegendItem } from '../core/types.js';
  import { getMapContext } from '../internal/context.js';
  import MapControl from './MapControl.svelte';

  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  interface Props extends HTMLAttributes<HTMLElement> {
    title: string;
    /** Categories, each with its colour. */
    items?: LegendItem[];
    /** A continuous scale instead: its colours from least to most, and the two end labels. */
    gradient?: LegendGradient;
    /**
     * Where it sits. Inside a `MapView` it becomes a map control in this corner; outside one it
     * renders in the page flow, beside the map.
     */
    position?: Corner;
    class?: string;
  }

  let {
    title,
    items = [],
    gradient,
    position = 'bottom-left',
    class: className,
    ...rest
  }: Props = $props();

  const inMap = getMapContext() !== null;
</script>

{#snippet legend()}
  <section class={cx('ldt-map-legend', className)} aria-label={title} {...rest}>
    <h3 class="ldt-map-legend__title">{title}</h3>
    {#if gradient}
      <div
        class="ldt-map-legend__ramp"
        style:background-image={`linear-gradient(to right, ${gradient.colors.join(', ')})`}
        aria-hidden="true"
      ></div>
      <p class="ldt-map-legend__ends"><span>{gradient.min}</span><span>{gradient.max}</span></p>
    {/if}
    {#if items.length}
      <ul class="ldt-map-legend__items">
        {#each items as item (item.label)}
          <li class="ldt-map-legend__item">
            <span
              class={cx('ldt-map-legend__key', `ldt-map-legend__key--${item.shape ?? 'fill'}`)}
              style:--ldt-legend-color={item.color}
              aria-hidden="true"
            ></span>
            {item.label}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/snippet}

{#if inMap}
  <MapControl {position}>{@render legend()}</MapControl>
{:else}
  {@render legend()}
{/if}
