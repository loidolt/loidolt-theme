---
'@loidolt/theme-tokens': minor
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add behaviour helpers for custom surfaces, a live region, and a skip link.

- **Attachments.** `escapeKey`, `clickOutside`, `autofocus`, `rovingFocus` and `focusTrap` give
  markup you build yourself the keyboard and focus contract the library's own overlays and groups
  already have. They are Svelte attachments, so they never run during SSR.
- **`createAnnouncer()` and `LiveRegion`.** Speak status changes without moving focus. The
  announcer empties the region between messages, so a repeated message is still announced, and
  clears stale text after `clearAfter`.
- **`SkipLink`** jumps keyboard users past repeated navigation. It also moves focus to the
  target, so the next Tab continues from the content.
- **`describedBy(...ids)`** builds an `aria-describedby` value, or `undefined` when there are no
  ids. `Field` and `Fieldset` now use it.
- **Tokens:** WCAG contrast helpers (`getContrastRatio`, `meetsContrast`, `validateContrast`,
  `getContrastTextColor`) and named `aspectRatio` frames, emitted as `--loidolt-aspect-*`.
- **Styles:** `.ldt-sr-only-focusable`, `.ldt-touch-target-expand`, `.ldt-line-clamp` (with
  `--ldt-lines`), and `.ldt-print-visible`.
