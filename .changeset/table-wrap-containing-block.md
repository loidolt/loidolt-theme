---
'@loidolt/theme-styles': patch
---

Bounded scroll regions now contain their visually hidden text. `Table`'s wrapper (so `DataTable` too), `Sidebar` and a vertical rail's `Tabs` panels are `position: relative`, so an absolutely positioned `.ldt-sr-only` inside them (a table caption, the live region every `Button` renders) scrolls and clips with the region instead of escaping it. Before, a long sticky table in a short `--ldt-table-height` made the page as tall as all of its rows, and scrolled sticky chrome such as an `AppShell` `TabBar` out of view. Nothing else changes visually; an app that positions these elements itself still wins, since its CSS outranks the theme's layers.
