---
'@loidolt/theme-tauri': minor
'@loidolt/theme-svelte': minor
---

`@loidolt/theme-tauri` now handles the window around the app. Pass `getCurrentWindow` from `@tauri-apps/api/window` (uncalled, so the layout stays browser-safe) and the app's `createTheme` store to `setupTauri`:

```ts
setupTauri({ plugins: { window: getCurrentWindow }, theme, chrome: { titleBar: 'overlay' } });
```

- The window background follows the page's live `background` colour through every theme and preset change, and its native light or dark appearance follows the theme, handing back to the OS for `system` (`syncWindowAppearance`).
- No white flash on launch: start the window hidden (`"visible": false` in `tauri.conf.json`) with `windowBackground()` as its `backgroundColor`, and `setupTauri` shows it once the window has its colours and the fonts are in (`showWindow`). `desktop.ready` settles after that.
- Under a macOS overlay title bar (`"titleBarStyle": "Overlay"`), `chrome: { titleBar: 'overlay' }` clears the window buttons through `--ldt-safe-top` (a 28px strip) or, with `trafficLights: 'beside'`, `--ldt-safe-left` on the top bar, and gives the room back in full screen (`insetWindowChrome`).

The window calls need `core:window:allow-set-background-color`, `allow-set-theme`, `allow-show` and, for dragging, `allow-start-dragging` in the capability file; a refused call is swallowed.

`Topbar` takes `dragRegion`, which sets `data-tauri-drag-region` on the bar and its regions so it drags a Tauri window like a title bar, while its buttons, links and fields stay clickable. A plain attribute everywhere else.
