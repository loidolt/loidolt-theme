---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add `SignaturePad`: draw a signature with a mouse, pen or finger, or type a name as the
keyboard-accessible alternative.

- **Output:** both modes produce a PNG. Drawn signatures also keep their strokes and an SVG, and
  `name` submits the PNG with a form.
- **Validation:** a length check keeps a stray dot from counting as a signature.
- **Styling:** the ink follows the theme, and the canvas is sized to the device's pixel ratio.
- **Helpers:** the pure `strokeLength`, `strokePath`, `strokesToSvg` and `validateSignature`
  are exported for server-side checks.
- **Left out from classic-theme:** Google Fonts injection, `userAgent` capture and the built-in
  consent checkbox.
