<script lang="ts" generics="V extends number | number[] = number">
  import { Slider as SliderPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** A number for one thumb, an array for a range — one thumb per entry. */
    value?: V;
    min?: number;
    max?: number;
    /** The increment, or an explicit list of the only values allowed. */
    step?: number | number[];
    orientation?: Orientation;
    disabled?: boolean;
    /** Accessible name. With two or more thumbs each is named from it by `thumbLabel`. */
    label: string;
    thumbLabel?: (index: number, count: number) => string;
    /** Spoken (`aria-valuetext`) and shown for each value — add units here: `(v) => \`${v} mm\``. */
    formatValue?: (value: number) => string;
    /** Show the formatted value beside the track. */
    showValue?: boolean;
    /** Mark every step along the track. Sensible only for a coarse `step`. */
    ticks?: boolean;
    /** Submits each value as a hidden input under this name. */
    name?: string;
    /** Every change, while dragging too. */
    onValueChange?: (value: V) => void;
    /** Only when the user lets go or finishes a key press — the moment to save. */
    onValueCommit?: (value: V) => void;
    /** Rendered after the track, e.g. min/max captions. */
    children?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    value = $bindable(0 as V),
    min = 0,
    max = 100,
    step = 1,
    orientation = 'horizontal',
    disabled = false,
    label,
    thumbLabel = (index, count) =>
      count === 1 ? label : `${label}, ${index === 0 ? 'minimum' : 'maximum'}`,
    formatValue = String,
    showValue = false,
    ticks = false,
    name,
    onValueChange,
    onValueCommit,
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const values = $derived<number[]>(Array.isArray(value) ? value : [value as number]);
  const multiple = $derived(Array.isArray(value));
</script>

{#snippet parts({
  thumbItems,
  tickItems,
}: {
  thumbItems: { index: number; value: number }[];
  tickItems: { index: number }[];
})}
  <span class="ldt-slider__track"><SliderPrimitive.Range class="ldt-slider__range" /></span>
  {#if ticks}
    {#each tickItems as tick (tick.index)}<SliderPrimitive.Tick
        class="ldt-slider__tick"
        index={tick.index}
      />{/each}
  {/if}
  {#each thumbItems as thumb (thumb.index)}
    <SliderPrimitive.Thumb
      class="ldt-slider__thumb"
      index={thumb.index}
      aria-label={thumbLabel(thumb.index, thumbItems.length)}
      aria-valuetext={formatValue(thumb.value)}
    />
  {/each}
{/snippet}

<div
  bind:this={ref}
  class={cx('ldt-slider', orientation === 'vertical' && 'ldt-slider--vertical', className)}
  data-disabled={disabled ? '' : undefined}
  {...rest}
>
  <!--
    `exact` positioning: the thumb's centre sits on the value and the wrapper's padding keeps it
    inside the box. The default measures the thumb in the browser, which shifts it after
    hydration.
  -->
  {#if multiple}
    <SliderPrimitive.Root
      type="multiple"
      bind:value={() => value as number[], (next) => (value = next as V)}
      {min}
      {max}
      {step}
      {orientation}
      {disabled}
      thumbPositioning="exact"
      class="ldt-slider__control"
      onValueChange={(next) => onValueChange?.(next as V)}
      onValueCommit={(next) => onValueCommit?.(next as V)}
    >
      {#snippet children({ thumbItems, tickItems })}{@render parts({
          thumbItems,
          tickItems,
        })}{/snippet}
    </SliderPrimitive.Root>
  {:else}
    <SliderPrimitive.Root
      type="single"
      bind:value={() => value as number, (next) => (value = next as V)}
      {min}
      {max}
      {step}
      {orientation}
      {disabled}
      thumbPositioning="exact"
      class="ldt-slider__control"
      onValueChange={(next) => onValueChange?.(next as V)}
      onValueCommit={(next) => onValueCommit?.(next as V)}
    >
      {#snippet children({ thumbItems, tickItems })}{@render parts({
          thumbItems,
          tickItems,
        })}{/snippet}
    </SliderPrimitive.Root>
  {/if}
  {#if showValue}
    <!-- The thumbs already speak their values; this is the sighted copy. -->
    <output class="ldt-slider__value" aria-hidden="true"
      >{values.map((one) => formatValue(one)).join(' – ')}</output
    >
  {/if}
  {#if name}
    {#each values as one, index (index)}<input type="hidden" {name} value={one} />{/each}
  {/if}
  {#if children}{@render children()}{/if}
</div>
