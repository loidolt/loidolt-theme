# @loidolt/theme-capacitor

## 0.12.1

### Patch Changes

- [#75](https://github.com/loidolt/loidolt-theme/pull/75) [`ecdf7a1`](https://github.com/loidolt/loidolt-theme/commit/ecdf7a14ab2500a15a96775b8f8b430cac89acbd) Thanks [@loidolt](https://github.com/loidolt)! - Published through npm trusted publishing: the release job proves who it is to npm with a short-lived GitHub token instead of a stored one. No code changes.
- Updated dependencies [[`ecdf7a1`](https://github.com/loidolt/loidolt-theme/commit/ecdf7a14ab2500a15a96775b8f8b430cac89acbd)]:
  - @loidolt/theme-tokens@0.12.1
  - @loidolt/theme-svelte@0.12.1

## 0.12.0

### Minor Changes

- [#49](https://github.com/loidolt/loidolt-theme/pull/49) [`e8a4555`](https://github.com/loidolt/loidolt-theme/commit/e8a45557d45db822dec2ccc60becafd234b272a9) Thanks [@loidolt](https://github.com/loidolt)! - New package, `@loidolt/theme-capacitor`: adapters that carry the theme into Capacitor 8 iOS and Android apps. `setupCapacitor` wires them all in one call from the root layout, each turned on by the plugin you pass it, and every one is a no-op in a browser and on the server.

  - `syncNativeAppearance` styles the status and navigation bars from the live `surface` colour and gives the iOS keyboard the page's appearance, following every theme and preset change.
  - `handleBackButton` makes the Android back button close the open dialog, drawer, lightbox or menu before going back through history, then backgrounds the app.
  - `createNativeKeyboard` tracks the software keyboard, hides `TabBar` while typing, keeps the focused field in view, and lifts the bottom chrome above a keyboard that overlays the page.
  - `createHaptics` and `withHaptics` tick selection controls and give status toasts their notification pattern.
  - `persistTheme` backs `createTheme` with `Preferences`, so the choice survives iOS evicting `localStorage`.
  - `createAppLifecycle`, `handleDeepLinks`, `createNetworkStatus`, `openExternalLinks`, `hideSplashScreen`, `followSystemTextSize` and `bridgeClipboard` cover the rest of the app's native surface.
  - `@loidolt/theme-capacitor/styles.css` feeds the `--ldt-safe-*` knobs from Capacitor's injected safe-area variables, which older Android web views need, and `@loidolt/theme-capacitor/config` gives `capacitor.config.ts` the theme's launch colour and plugin defaults.

  `observeColorScheme` (and with it `createTokenColors`, charts and maps) now also hears `data-preset` changes, since a preset can recolour every role.

- [#60](https://github.com/loidolt/loidolt-theme/pull/60) [`db5c9e7`](https://github.com/loidolt/loidolt-theme/commit/db5c9e784f9d3720c3c49dd1ee5cc34bef39d024) Thanks [@loidolt](https://github.com/loidolt)! - Pick and save files with `createFiles`, also returned by `setupCapacitor` as `native.files`. `pick({ accept, multiple })` opens the system file picker with `@capawesome/capacitor-file-picker` in an app and a file input in a browser, and resolves `File` objects either way, so the code that handles a `FileInput`'s files handles these too; `accept` takes the same values as `<input accept>`, and dismissing the picker resolves `[]`. `save(file, { folder, overwrite })` writes to the device's Documents with `@capacitor/filesystem` (the app's folder in the iOS Files app, the shared Documents folder on Android), asks for storage access on the Android versions that need it, and downloads in a browser. `@capawesome/capacitor-file-picker` and `@capacitor/filesystem` are new optional peer dependencies.

- [#59](https://github.com/loidolt/loidolt-theme/pull/59) [`68be102`](https://github.com/loidolt/loidolt-theme/commit/68be10256f3a7876058dc30ce34aa9c1c1df3883) Thanks [@loidolt](https://github.com/loidolt)! - Share files, links and text with `createShare`, also returned by `setupCapacitor` as `native.share`. One call goes through the best channel the shell has: the native share sheet with `@capacitor/share` (a `File` or Blob is written to the cache with `@capacitor/filesystem` first), then the Web Share API, then a download for files or the clipboard for a link (`fallback: 'open'` opens it instead). It resolves with the channel used and whether the user cancelled, so closing the sheet is never an error, and `canShare()` tells a "Share" button from a "Download" one. `@capacitor/share` and `@capacitor/filesystem` are new optional peer dependencies.

- [#68](https://github.com/loidolt/loidolt-theme/pull/68) [`2968469`](https://github.com/loidolt/loidolt-theme/commit/2968469360c66de0e7324e1f27bd82aafbd72cc2) Thanks [@loidolt](https://github.com/loidolt)! - `themeConfig()` and `withTheme()` no longer set `SplashScreen.backgroundColor`. On iOS the plugin painted that one colour over `LaunchScreen.storyboard`, which hid a launch colour that follows dark mode, and Android 12 and newer ignore it at launch. The splash now shows the native launch screen's own colour; the README explains how to give it the theme's light and dark backgrounds. An app that wants the old behaviour can set `plugins.SplashScreen.backgroundColor` itself, and `withTheme` keeps it.

- [#70](https://github.com/loidolt/loidolt-theme/pull/70) [`254d271`](https://github.com/loidolt/loidolt-theme/commit/254d271a7da1763b98926da2c0c7662b0853c5f0) Thanks [@loidolt](https://github.com/loidolt)! - `TabBar` labels stay readable at large text sizes instead of ending in an ellipsis. A label grows with the text size up to 14px (about a quarter over its default), the item's side padding stops growing at 4px, and a label that still does not fit wraps onto further lines, hyphenated where the language allows, rather than being clipped. Five short labels now fit whole across a 375px phone at 200% text size.

  On iOS, `followSystemTextSize` now also writes the zoom to `<html>` as `--ldt-text-zoom`. Capacitor's TextZoom applies it there as `-webkit-text-size-adjust`, which WebKit scales after the stylesheet's `min()`, so without it the label grew past the cap; with it, the label takes the zoom into its own size and opts out of the adjustment, and stays at 14px. Android's web view zooms text its own way and gets no variable. Set `--ldt-text-zoom` yourself if you call `TextZoom.set` directly on iOS.

### Patch Changes

- [#72](https://github.com/loidolt/loidolt-theme/pull/72) [`4ed9868`](https://github.com/loidolt/loidolt-theme/commit/4ed9868dceabe3293f652cb7a4c3ccb0237f62d7) Thanks [@loidolt](https://github.com/loidolt)! - In a native shell a double tap no longer zooms the page, so two quick presses of a control are two presses. Pinch zoom stays.

- [#69](https://github.com/loidolt/loidolt-theme/pull/69) [`21c7a23`](https://github.com/loidolt/loidolt-theme/commit/21c7a23af22f5ae94b6972d2307304224a200616) Thanks [@loidolt](https://github.com/loidolt)! - `createFiles().pick()` deletes the copy the native picker makes of each picked file (on iOS, in `Library/Caches/<uuid>/`) once the file is read, when `Filesystem` is passed, so picked files no longer pile up in the app's cache. Only paths inside the cache directory are touched, and a failed delete never rejects `pick()`.

- [#67](https://github.com/loidolt/loidolt-theme/pull/67) [`27890bb`](https://github.com/loidolt/loidolt-theme/commit/27890bb8dc2ad3d6ee157cb5f8bfc651ed1eb707) Thanks [@loidolt](https://github.com/loidolt)! - Keep scrolled content from showing under the status bar in a native shell. `Topbar` scrolls away
  with the page, after which the page ran under the clock and the Dynamic Island; `styles.css` now
  paints a fixed strip as tall as the top safe area in `surface` under `data-native-platform`. The
  README's adapter table, which listed every adapter twice and dropped `createShare` from the
  second copy, is one table again.
- Updated dependencies [[`1b5678a`](https://github.com/loidolt/loidolt-theme/commit/1b5678aa6b552c96c3d74bd6f2cec0e97d81a625), [`e8a4555`](https://github.com/loidolt/loidolt-theme/commit/e8a45557d45db822dec2ccc60becafd234b272a9), [`a25b900`](https://github.com/loidolt/loidolt-theme/commit/a25b900a5e99317cf1034bc31772de2616f879b4), [`64f2b57`](https://github.com/loidolt/loidolt-theme/commit/64f2b577ac84803f8ffacc0fc328292b352b12ac), [`95f22c5`](https://github.com/loidolt/loidolt-theme/commit/95f22c5a29d10d0685e81515de36fbf7e5f9bede), [`a35eb76`](https://github.com/loidolt/loidolt-theme/commit/a35eb762a4bfd8ada0c235a6d30459f0c31d3ae7), [`157376e`](https://github.com/loidolt/loidolt-theme/commit/157376e13798aeed7d3d8307396054c6569c3818), [`4f60a5b`](https://github.com/loidolt/loidolt-theme/commit/4f60a5bf8f8ee0fe22d0b0af0034acc1b1311b31), [`faf3870`](https://github.com/loidolt/loidolt-theme/commit/faf387081d52dade60eb56ff95d27ea95a94ed79), [`f1c68a4`](https://github.com/loidolt/loidolt-theme/commit/f1c68a438cbb394adb63794ca4016e95c586612f), [`f912288`](https://github.com/loidolt/loidolt-theme/commit/f912288a6453e5a2015a86bb2bf902c593a66ada)]:
  - @loidolt/theme-svelte@0.12.0
  - @loidolt/theme-tokens@0.12.0
