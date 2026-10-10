---
'@loidolt/theme-svelte': minor
'@loidolt/theme-styles': minor
---

Tabs gains a `rail` variant for settings sidebars, tab icons and descriptions, and a shared `panelHeader`.

- `TabItem` extends `Option` with an `icon` snippet and a `description`, shown on hover and announced as the tab's description.
- `variant="rail"`: icons above short labels in a narrow column beside panels that scroll on their own, or one row of equal tabs above the panels when `orientation` is horizontal. A vertical rail falls back to a row on phones, like vertical tabs.
- `panelHeader` renders shared content once above the panels, such as a filter field, pinned while a vertical rail's panels scroll. `panelsClass` styles the element around the panels.
- Documents that every panel stays mounted and hidden while unselected.
