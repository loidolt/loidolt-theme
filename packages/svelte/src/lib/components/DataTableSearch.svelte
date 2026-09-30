<script lang="ts" generics="T">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import type { DataTableState } from '../data-table.svelte.js';
  import Input from './Input.svelte';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'type'> {
    table: DataTableState<T>;
    /** Filter one column instead of searching them all. */
    column?: string;
    /** Accessible name, when not wrapped in a `Field`. */
    label?: string;
    /** Milliseconds to wait after the last keystroke — worth raising for a server search. */
    debounce?: number;
    boxed?: boolean;
    class?: string;
    ref?: HTMLInputElement | null;
  }

  let {
    table,
    column,
    label = 'Search',
    debounce = 200,
    boxed = true,
    placeholder = 'Search',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const current = $derived.by(() => {
    if (!column) return table.search;
    const value = table.filters[column];
    return typeof value === 'string' ? value : '';
  });

  // The field keeps its own text while the user types; it re-syncs when the table's value
  // changes from elsewhere (a Clear all, a reset).
  let text = $derived(current);

  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));

  function apply(value: string) {
    if (column) table.setFilter(column, value);
    else table.setSearch(value);
  }

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    const value = event.currentTarget.value;
    clearTimeout(timer);
    if (debounce > 0) timer = setTimeout(() => apply(value), debounce);
    else apply(value);
  }
</script>

<Input
  bind:ref
  bind:value={text}
  type="search"
  aria-label={label}
  {placeholder}
  {boxed}
  class={className}
  {...rest}
  oninput={handleInput}
/>
