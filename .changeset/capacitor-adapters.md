---
'@loidolt/theme-capacitor': minor
'@loidolt/theme-svelte': patch
---

New package, `@loidolt/theme-capacitor`: adapters that carry the theme into Capacitor 8 iOS and Android apps. `setupCapacitor` wires them all in one call from the root layout, each turned on by the plugin you pass it, and every one is a no-op in a browser and on the server.

- `syncNativeAppearance` styles the status and navigation bars from the live `surface` colour and gives the iOS keyboard the page's appearance, following every theme and preset change.
- `handleBackButton` makes the Android back button close the open dialog, drawer, lightbox or menu before going back through history, then backgrounds the app.
- `createNativeKeyboard` tracks the software keyboard, hides `TabBar` while typing, keeps the focused field in view, and lifts the bottom chrome above a keyboard that overlays the page.
- `createHaptics` and `withHaptics` tick selection controls and give status toasts their notification pattern.
- `persistTheme` backs `createTheme` with `Preferences`, so the choice survives iOS evicting `localStorage`.
- `createAppLifecycle`, `handleDeepLinks`, `createNetworkStatus`, `openExternalLinks`, `hideSplashScreen`, `followSystemTextSize` and `bridgeClipboard` cover the rest of the app's native surface.
- `@loidolt/theme-capacitor/styles.css` feeds the `--ldt-safe-*` knobs from Capacitor's injected safe-area variables, which older Android web views need, and `@loidolt/theme-capacitor/config` gives `capacitor.config.ts` the theme's launch colour and plugin defaults.

`observeColorScheme` (and with it `createTokenColors`, charts and maps) now also hears `data-preset` changes, since a preset can recolour every role.
