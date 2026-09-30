<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { IControl } from 'maplibre-gl';
  import { cx } from '@loidolt/theme-svelte';
  import { requireMapContext } from '../internal/context.js';
  import { safely } from '../internal/safely.js';

  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The corner it sits in, stacked with MapLibre's own controls there. */
    position?: Corner;
    children?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    position = 'top-left',
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const context = requireMapContext('MapControl');

  $effect(() => {
    const target = context.map;
    const node = ref;
    const corner = position;
    if (!target || !node) return;
    const control: IControl = {
      onAdd: () => node,
      onRemove: () => node.remove(),
    };
    target.addControl(control, corner);
    return () => safely(() => target.removeControl(control));
  });
</script>

<div hidden>
  <div bind:this={ref} class={cx('maplibregl-ctrl ldt-map-control', className)} {...rest}>
    {@render children?.()}
  </div>
</div>
