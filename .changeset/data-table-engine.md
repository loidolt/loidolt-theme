---
'@loidolt/theme-svelte': minor
---

Add `createDataTable()`, a runes engine for table state: sorting, global search, column
filters, paging, row selection and column visibility over an array.

- **Built for the existing parts.** `sortOf(id)` feeds `TableHeader`'s `sort` prop and `page` is
  1-based for `Pagination`.
- **Server data.** `manual: { sorting, filtering, pagination }` plus `rowCount` hand each step
  to a server, and every change is reported through a callback.
- **Filters.** A text filter matches as a substring. A list of values matches by set
  membership, so multi-value faceted filters work (classic-theme's comma-joined matching did
  not). `facets(id)` counts each value among the rows passing every _other_ filter.
- **Sort order.** Numbers, dates, then natural text ("Sheet 2" before "Sheet 10"), with empty
  values last in either direction.
- **Anywhere.** State is set synchronously, so it works during SSR and at module scope.
