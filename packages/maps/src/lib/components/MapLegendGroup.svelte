<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '@loidolt/theme-svelte';
  import type { LegendGradient, LegendItem } from '../core/types.js';
  import { getMapContext } from '../internal/context.js';
  import MapControl from './MapControl.svelte';

  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Names the group, e.g. "Layers shown". */
    title: string;
    /** One collapsible legend per layer. */
    legends: Array<{
      title: string;
      items?: LegendItem[];
      gradient?: LegendGradient;
      open?: boolean;
    }>;
    position?: Corner;
    class?: string;
  }

  let { title, legends, position = 'bottom-left', class: className, ...rest }: Props = $props();

  const inMap = getMapContext() !== null;
</script>

{#snippet group()}
  <section
    class={cx('ldt-map-legend ldt-map-legend--group', className)}
    aria-label={title}
    {...rest}
  >
    <h3 class="ldt-map-legend__title">{title}</h3>
    {#each legends as legend (legend.title)}
      <details class="ldt-map-legend__section" open={legend.open ?? true}>
        <summary class="ldt-map-legend__summary">{legend.title}</summary>
        {#if legend.gradient}
          <div
            class="ldt-map-legend__ramp"
            style:background-image={`linear-gradient(to right, ${legend.gradient.colors.join(', ')})`}
            aria-hidden="true"
          ></div>
          <p class="ldt-map-legend__ends">
            <span>{legend.gradient.min}</span><span>{legend.gradient.max}</span>
          </p>
        {/if}
        {#if legend.items?.length}
          <ul class="ldt-map-legend__items">
            {#each legend.items as item (item.label)}
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
      </details>
    {/each}
  </section>
{/snippet}

{#if inMap}
  <MapControl {position}>{@render group()}</MapControl>
{:else}
  {@render group()}
{/if}
