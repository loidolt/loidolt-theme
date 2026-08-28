<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    items: T[];
    selectedId?: string | null;
    onSelect?: (id: string) => void;
    /** Vertical rails flip horizontal on their own when the workspace container goes compact. */
    orientation?: Orientation;
    /** Accessible name of the listbox. */
    label: string;
    /** Thumbnail contents for one item; second argument is whether it is selected. */
    item: Snippet<[T, boolean]>;
    class?: string;
    itemClass?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    items,
    selectedId = $bindable(null),
    onSelect,
    orientation = 'vertical',
    label,
    item,
    class: className,
    itemClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let buttons = $state<Record<string, HTMLButtonElement | null>>({});

  $effect(() => {
    if (selectedId) {
      buttons[selectedId]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });

  function select(id: string) {
    selectedId = id;
    onSelect?.(id);
  }
</script>

<div
  bind:this={ref}
  class={cx(
    'ldt-filmstrip',
    orientation === 'horizontal' && 'ldt-filmstrip--horizontal',
    className
  )}
  role="listbox"
  aria-label={label}
  {...rest}
>
  {#each items as entry (entry.id)}
    <button
      type="button"
      class={cx('ldt-filmstrip__item', itemClass)}
      role="option"
      aria-selected={selectedId === entry.id}
      bind:this={buttons[entry.id]}
      onclick={() => select(entry.id)}
    >
      {@render item(entry, selectedId === entry.id)}
    </button>
  {/each}
</div>
