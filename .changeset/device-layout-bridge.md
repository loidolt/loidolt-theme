---
'@loidolt/theme-capacitor': minor
---

New `createDeviceLayout`, turned on by `setupCapacitor`: it tells a page where iOS puts its vertical bar and which parts of the display are reserved, so an app that draws its own bars can follow the system's layout on iPhone Duo.

A web page can't read these itself, so the package now has a small native iOS half, `DeviceLayout`, that `npx cap sync ios` adds to the app. It reads UIKit's vertical bar edge, its reserved regions (the camera, and the fold while the device is partly open) and the hinge (iOS 27.1), and the adapter writes them on `<html>`:

- `data-bar-edge="left"` or `"right"` while bars belong on that side, with `--ldt-bar-start`, how far down the strip controls can begin.
- `data-fold` with `--ldt-fold-start` and `--ldt-fold-end` while the device is partly open: the band to keep controls out of, where taps may not register.
- `data-hinge`: `closed`, `partially-open` or `fully-open`.

`current` holds the full report, and `foldOf` and `barStartOf` read it. Nothing is written on other devices, before iOS 27.1, in a browser, or in an app that hasn't run `cap sync` since installing this version. Building the app needs Xcode 27.1 or later.
