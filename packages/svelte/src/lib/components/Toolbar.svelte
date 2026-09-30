<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { rovingFocus } from '../attachments.js';
  import type { Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Accessible name, e.g. "Sheet list tools". */
    label: string;
    /** Leading controls — search, filters, a result count. */
    children?: Snippet;
    /** Controls pushed to the far end — view toggles, a sort menu. */
    end?: Snippet;
    orientation?: Orientation;
    /**
     * Make it an ARIA `toolbar`: one tab stop, arrow keys between the controls marked
     * `data-roving-item`. Leave it off (a labelled `group`, Tab between controls) when the bar
     * holds a text field or a control that owns its own arrow keys, like a `ToggleGroup`.
     */
    roving?: boolean;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    label,
    children,
    end,
    orientation = 'horizontal',
    roving = false,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<div
  bind:this={ref}
  class={cx('ldt-toolbar', orientation === 'vertical' && 'ldt-toolbar--vertical', className)}
  role={roving ? 'toolbar' : 'group'}
  aria-label={label}
  aria-orientation={roving ? orientation : undefined}
  {@attach roving ? rovingFocus({ orientation }) : undefined}
  {...rest}
>
  {#if children}{@render children()}{/if}
  {#if end}<div class="ldt-toolbar__end">{@render end()}</div>{/if}
</div>
