---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add `Toolbar`, `FilterPanel` and `ActiveFilterChips` for filterable lists.

- **`Toolbar`:** a labelled row of list controls with an `end` cluster, on the recessed surface.
  `roving` turns it into an ARIA `toolbar` with a single tab stop.
- **`FilterPanel`:** expands under a consumer-owned toggle and lays filters out on an auto-fit
  grid. Collapsed controls are `inert`, so they leave the tab order while the height still
  animates. Offers "Clear all" when filters are active.
- **`ActiveFilterChips`:** one removable square chip per active filter. Focus stays in the group
  as chips are removed.
