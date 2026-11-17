---
'@loidolt/theme-capacitor': minor
---

On iPhone Duo, `styles.css` now lays out the theme's own bars the way the system lays out its own. While `createDeviceLayout` reports a vertical bar edge (the cover screen, and the inner screen in landscape), the safe area on that edge widens into a strip of at least 4.5rem. `Topbar`'s actions move into the strip below the camera and status bar, and the `TabBar` runs down it from the foot; `Topbar` stays at the top of the content as a slim header with the brand. While the device is partly open, dialogs move to the half before the fold, top and bottom drawers cover that half only, side drawers stop short of the fold, and toasts keep to the half after it. Nothing changes on the inner screen in portrait, on other devices, or in a browser.
