---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add `DataTable`, `DataTableSearch`, `DataTableFacetedFilter`, `DataTableColumnVisibility` and
`DataTablePagination`, rendering `createDataTable()` state with the existing `Table`,
`TableHeader`, `Pagination`, `Checkbox`, `DropdownMenu` and `EmptyState`.

- **Rows:** paged or virtual tables report `aria-rowcount` and `aria-rowindex`. Rows can be
  selected by checkbox (with an indeterminate select-all) or by radio.
- **Cells:** editable cells are buttons that become fields, where Enter saves and Escape restores.
  `hideBelow` drops columns on narrow screens.
- **States:** loading placeholders and an empty state are built in.
- **Filters:** the faceted filter shows counts and supports true multi-value filtering. The
  search re-syncs when the table is reset.
- **Footer:** the pagination footer announces the visible range.
