---
'@loidolt/theme-capacitor': minor
---

On iPhone Duo, the side strip's controls now line up under the system's clock and status icons, and on the inner screen in portrait `Topbar` moves up beside the camera instead of starting below a blank band.

- **Side strip.** iOS centres its own items in a 4.5rem column on the content side of the strip, and leaves the rest of a wider strip as margin at the bezel. `Topbar`'s actions and the `TabBar` now share that column (`--ldt-bar-outer` is the margin) rather than centring in the whole strip, which put them about 6pt nearer the edge than the clock.
- **Top corner cutout.** New `topCutoutOf`, and `createDeviceLayout` writes `data-top-cutout="left"` or `"right"` with `--ldt-cutout-width` and `--ldt-cutout-height` while the camera and status bar take one top corner and the bars stay horizontal. `styles.css` then raises `Topbar` into the band beside the cutout, ending where it ends, so the brand and actions sit on the clock's line. The status bar backdrop covers the cutout only. Overlays still clear the whole band.
