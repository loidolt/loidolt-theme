<script lang="ts" generics="T">
  import type { DataTableState } from '../data-table.svelte.js';
  import type { MenuEntry } from '../types.js';
  import { cx } from '../utils.js';
  import DropdownMenu from './DropdownMenu.svelte';

  interface Props {
    table: DataTableState<T>;
    /** Trigger text. */
    label?: string;
    resetLabel?: string;
    class?: string;
  }

  let { table, label = 'Columns', resetLabel = 'Show all', class: className }: Props = $props();

  const RESET = '\u0000reset';

  const items = $derived<MenuEntry[]>([
    {
      type: 'group',
      label,
      items: table.allColumns
        .filter((column) => column.hideable !== false)
        .map((column) => ({
          type: 'checkbox' as const,
          value: column.id,
          label: column.header,
          checked: table.isVisible(column.id),
        })),
    },
    ...(table.hidden.length
      ? [{ value: RESET, label: resetLabel, separatorBefore: true } satisfies MenuEntry]
      : []),
  ]);
</script>

<DropdownMenu
  {items}
  align="end"
  triggerClass={cx('ldt-button ldt-button--quiet ldt-button--sm', className)}
  onCheckedChange={(id, checked) => table.setColumnVisible(id, checked)}
  onSelect={(value) => value === RESET && table.showAllColumns()}
>
  {#snippet trigger()}{label}{/snippet}
</DropdownMenu>
