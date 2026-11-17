---
'@loidolt/theme-capacitor': patch
---

`createDeviceLayout` now reports where the camera's region ends up after a rotation. iOS lays the web view out at its new size about a second before it turns the reserved regions, and nothing fires when they move, so on iPhone Duo's inner screen the page kept the previous orientation's region: in portrait `Topbar` stayed below the band beside the camera, and in landscape the strip's controls started too close to the clock. The plugin now looks again 0.5, 1 and 2 seconds after each change, and still sends nothing when the layout hasn't changed.
