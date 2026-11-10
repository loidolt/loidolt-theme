# @loidolt/theme-capacitor

[Capacitor](https://capacitorjs.com) adapters that carry the Loidolt theme into native iOS and
Android apps. The components already render well on a phone; these make them behave like the
platform around them.

- **The chrome matches the theme.** Status bar and navigation bar icons turn light on a dark
  surface and dark on a light one, read from the live colours, so a preset or your own theme
  decides them. The iOS keyboard takes the page's appearance.
- **Safe areas on every web view.** Android web views before Chromium 140 report
  `env(safe-area-inset-*)` as 0; the stylesheet feeds the theme's `--ldt-safe-*` knobs from the
  values Capacitor injects instead, so `Topbar`, `AppShell`, `TabBar`, `Drawer` and toasts clear
  the bars on both platforms.
- **Back closes what is open.** The Android back button closes the open dialog, drawer, lightbox
  or menu first, then goes back through history, then backgrounds the app.
- **The keyboard is part of the layout.** `TabBar` steps aside while typing, the focused field is
  kept in view, and when the keyboard overlays the page the bottom chrome lifts above it.
- **Haptics in the theme's vocabulary.** Switches, checkboxes, tabs and the tab bar tick; status
  toasts get the matching success, warning or error pattern.
- **Native storage, native links, native text size.** The theme choice survives iOS evicting
  `localStorage`; links that leave the app open in the in-app browser in the theme's colour; text
  follows Dynamic Type and Android's font scale; copy buttons work on Android.
- **Inert on the web.** Every adapter checks for a native shell first, so the same root layout
  ships to the browser and to the server unchanged.

Plugins are passed in, never imported: install only the ones you want, and each adapter turns on
when you hand it its plugin. Their typings are checked against the real plugins in this
repository's test suite.

## Install

```sh
npm install @loidolt/theme-capacitor @capacitor/core
```

`@capacitor/core` 8 is a peer dependency. Add whichever plugins you want adapters for:

```sh
npm install @capacitor/app @capacitor/keyboard @capacitor/haptics @capacitor/preferences @capacitor/splash-screen
```

| Plugin                     | Turns on                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| `@capacitor/core`          | Status and navigation bar styling (`SystemBars` is bundled in core)      |
| `@capacitor/app`           | Android back button, foreground/background, deep links, text-size resume |
| `@capacitor/keyboard`      | Keyboard tracking and layout, keyboard appearance                        |
| `@capacitor/haptics`       | Haptics on controls and status toasts                                    |
| `@capacitor/preferences`   | Native persistence for the theme and preset                              |
| `@capacitor/splash-screen` | Lifting the splash once the theme and fonts are in                       |
| `@capacitor/network`       | Reactive connectivity, with offline and back-online toasts               |
| `@capacitor/browser`       | External links in the in-app browser                                     |
| `@capacitor/text-zoom`     | Following the system text size                                           |
| `@capacitor/clipboard`     | Copy buttons on Android                                                  |
| `@capacitor/status-bar`    | Only for Android apps that opt out of edge-to-edge                       |

## Set up

Three pieces: the Capacitor config, the viewport, and one call in the root layout.

**1. `capacitor.config.ts`** — the launch background in the theme's colour (no white flash), the
safe-area variables on, and a splash screen that waits for the theme:

```ts
import type { CapacitorConfig } from '@capacitor/cli';
import { withTheme } from '@loidolt/theme-capacitor/config';

export default withTheme<CapacitorConfig>({
  appId: 'space.loidolt.topostack',
  appName: 'Topostack',
  webDir: 'build',
});
```

Everything you set wins over the theme's defaults, down to single plugin options. `withTheme(config,
{ scheme: 'dark' })` paints the launch dark; `themeConfig()` returns the defaults on their own.

**2. `app.html`** — draw under the bars, and import the stylesheet after the theme's:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

```css
@import '@loidolt/theme-svelte/styles.css';
@import '@loidolt/theme-capacitor/styles.css';
```

**3. The root layout:**

```svelte
<script lang="ts">
  import { App } from '@capacitor/app';
  import { Haptics } from '@capacitor/haptics';
  import { Keyboard } from '@capacitor/keyboard';
  import { Preferences } from '@capacitor/preferences';
  import { SplashScreen } from '@capacitor/splash-screen';
  import { goto } from '$app/navigation';
  import { setupCapacitor } from '@loidolt/theme-capacitor';
  import { theme, toaster } from '$lib/app';

  const native = setupCapacitor({
    plugins: { App, Haptics, Keyboard, Preferences, SplashScreen },
    theme, // createTheme(): stored natively, restored before the splash lifts
    toaster, // createToaster(): status toasts buzz; use native.toaster to push
    navigate: goto, // deep links
  });

  let { children } = $props();
</script>

{@render children()}
```

Any adapter can be switched off (`backButton: false`) or tuned (`backButton: { atRoot: 'exit' }`).
`native.keyboard`, `native.network` and `native.lifecycle` are reactive state for your own markup,
and `native.ready` settles once the theme is restored and the splash is gone.

## Adapters

Each piece is also exported on its own, for apps that want only one or wire them differently.
Every one returns a teardown (or a store with `destroy()`), and is a no-op outside a native shell.

| Export                 | Does                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `syncNativeAppearance` | Bar icon styles from the `surface` role (configurable per bar), legacy Android status bar colour, iOS keyboard appearance |
| `handleBackButton`     | Android back: closes the top layer, then `onBack`, then history, then `atRoot` (`minimize`, `exit`, `none`)               |
| `closeTopLayer`        | Closes the innermost open overlay the way Escape does; returns whether something took it                                  |
| `createNativeKeyboard` | `visible` and `height`, `data-keyboard="open"`, `--ldt-keyboard-height` and `--ldt-keyboard-inset` on `<html>`            |
| `createHaptics`        | `impact(weight)`, `selection()`, `notify(variant)`, and `install()` for delegated feedback on controls                    |
| `withHaptics`          | Wraps a toaster so status toasts play the matching notification pattern                                                   |
| `persistTheme`         | Restores and mirrors a `createTheme` store through `Preferences`; `ready` settles once restored                           |
| `createAppLifecycle`   | Reactive `active`; pauses playing media in the background; `onPause` and `onResume`                                       |
| `handleDeepLinks`      | Universal links, app links and custom schemes into the app router (`deepLinkPath` maps the URL)                           |
| `createNetworkStatus`  | Reactive `connected` and `type`; optional offline and back-online toasts                                                  |
| `openExternalLinks`    | Other-origin links open in the in-app browser with a themed toolbar                                                       |
| `hideSplashScreen`     | Lifts the splash after `until`, the fonts and a painted frame; no fade under reduced motion                               |
| `followSystemTextSize` | Applies the system text size, and re-reads it on resume                                                                   |
| `bridgeClipboard`      | Routes `navigator.clipboard.writeText` through the Clipboard plugin                                                       |
| `markNativePlatform`   | `data-native-platform="ios"` or `"android"` on `<html>`, for platform-specific CSS                                        |
| `nativePlatform`       | `'ios'`, `'android'` or `null`                                                                                            |

### Back button and overlays

`closeTopLayer` sends Escape from the focused element, which every overlay in
`@loidolt/theme-svelte` — and any Bits UI layer — already closes on. An open layer that refuses
Escape (a confirmation that must be answered) also stops the back press, so it is never skipped
past to the page behind. For a surface of your own built with the `escapeKey` attachment, pass
`preventDefault: true` so the back button can tell it handled the press.

### Keyboard

With the default `native` resize mode the web view shrinks for the keyboard and nothing else is
needed. With `keyboardResize: 'none'` the keyboard draws over the page, and `--ldt-keyboard-inset`
becomes the bottom safe area, so `AppShell`'s last row, toasts, floating bars and drawers lift
above it. `--ldt-keyboard-height` is there for anything of your own.

### Haptics

`install()` ticks on activation of switches, checkboxes, radios, tabs, toggle buttons, options
and `TabBar` links — the moments a native control ticks. Plain buttons are left alone on purpose;
opt one in with `data-haptic` (`data-haptic="medium"` or `"heavy"` for weight). Pass
`enabled: () => settings.vibration` to honour an in-app setting.

### Styles

`styles.css` is zero-specificity throughout, so your own CSS always wins, and inert in a browser:

- `--ldt-safe-*` from Capacitor's injected `--safe-area-inset-*`, then `env()`.
- While the keyboard is up: the bottom safe area becomes `--ldt-keyboard-inset`, and `TabBar` is
  hidden.
- Under `data-native-platform`: no tap highlight, and long-pressing a control does not select its
  label or open the link callout.
