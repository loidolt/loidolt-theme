---
'@loidolt/theme-styles': patch
---

`TabBar` labels stay readable at large text sizes instead of ending in an ellipsis. A label grows with the text size up to 14px (about a quarter over its default), the item's side padding stops growing at 4px, and a label that still does not fit wraps onto further lines, hyphenated where the language allows, rather than being clipped. Five short labels now fit whole across a 375px phone at 200% text size. Where text zoom arrives as `-webkit-text-size-adjust` (Capacitor's TextZoom on iOS), WebKit scales the label after the cap, so there it keeps growing and wraps.
