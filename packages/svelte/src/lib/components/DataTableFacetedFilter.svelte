<script lang="ts" generics="T">
  import type { DataTableState } from '../data-table.svelte.js';
  import type { MenuEntry, Option } from '../types.js';
  import { cx } from '../utils.js';
  import DropdownMenu from './DropdownMenu.svelte';

  interface Props {
    table: DataTableState<T>;
    /** The column to filter. */
    column: string;
    /** Trigger text and menu heading. Defaults to the column header. */
    title?: string;
    /** Choices. Defaults to the column's `filterOptions`, else the values present in the data. */
    options?: Option[];
    /** Show how many rows hold each value. */
    showCounts?: boolean;
    clearLabel?: string;
    /** How the trigger reports a selection, e.g. "Stock, 2 selected". */
    selectedText?: (count: number) => string;
    class?: string;
  }

  let {
    table,
    column,
    title,
    options,
    showCounts = true,
    clearLabel = 'Clear filter',
    selectedText = (count) => `${count} selected`,
    class: className,
  }: Props = $props();

  // Not a value any real option can hold, so the clear row never collides with data.
  const CLEAR = '\u0000clear';

  const header = $derived(
    title ?? table.allColumns.find((one) => one.id === column)?.header ?? column
  );
  const counts = $derived(table.facets(column));
  const choices = $derived<Option[]>(
    options ??
      table.allColumns.find((one) => one.id === column)?.filterOptions ??
      [...counts.keys()].sort().map((value) => ({ value, label: value }))
  );
  const chosen = $derived.by(() => {
    const value = table.filters[column];
    return Array.isArray(value) ? value : [];
  });

  const items = $derived<MenuEntry[]>([
    {
      type: 'group',
      label: header,
      items: choices.map((choice) => ({
        type: 'checkbox' as const,
        value: choice.value,
        label: choice.label,
        checked: chosen.includes(choice.value),
        disabled: choice.disabled,
        hint: showCounts ? String(counts.get(choice.value) ?? 0) : undefined,
      })),
    },
    ...(chosen.length
      ? [{ value: CLEAR, label: clearLabel, separatorBefore: true } satisfies MenuEntry]
      : []),
  ]);

  function toggle(value: string, checked: boolean) {
    table.setFilter(column, checked ? [...chosen, value] : chosen.filter((one) => one !== value));
  }
</script>

<DropdownMenu
  {items}
  triggerClass={cx('ldt-button ldt-button--quiet ldt-button--sm ldt-facet', className)}
  onCheckedChange={toggle}
  onSelect={(value) => value === CLEAR && table.setFilter(column, null)}
>
  {#snippet trigger()}
    <span>{header}</span>{#if chosen.length}<span class="ldt-facet__count"
        ><span aria-hidden="true">{chosen.length}</span><span class="ldt-sr-only"
          >, {selectedText(chosen.length)}</span
        ></span
      >{/if}
  {/snippet}
</DropdownMenu>
