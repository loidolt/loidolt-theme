---
'@loidolt/theme-styles': patch
'@loidolt/theme-capacitor': minor
---

`TabBar` labels stay readable at large text sizes instead of ending in an ellipsis. A label grows with the text size up to 14px (about a quarter over its default), the item's side padding stops growing at 4px, and a label that still does not fit wraps onto further lines, hyphenated where the language allows, rather than being clipped. Five short labels now fit whole across a 375px phone at 200% text size.

On iOS, `followSystemTextSize` now also writes the zoom to `<html>` as `--ldt-text-zoom`. Capacitor's TextZoom applies it there as `-webkit-text-size-adjust`, which WebKit scales after the stylesheet's `min()`, so without it the label grew past the cap; with it, the label takes the zoom into its own size and opts out of the adjustment, and stays at 14px. Android's web view zooms text its own way and gets no variable. Set `--ldt-text-zoom` yourself if you call `TextZoom.set` directly on iOS.
