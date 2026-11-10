# Tauri example

A minimal [Tauri 2](https://tauri.app) app on `@loidolt/theme-svelte` and `@loidolt/theme-tauri`,
for trying the desktop adapters in a real window. Plain Vite and Svelte, no router.

It is a workspace package, but outside the repository's checks: `npm run check` and CI never
build its Rust side, which needs a Rust toolchain (1.94.0, pinned in
`src-tauri/rust-toolchain.toml`) and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

## Run

From the repository root, build the packages once:

```sh
npm run build:packages
```

Then, in `examples/tauri`:

```sh
npm run dev          # the frontend alone, in a browser: theme-tauri stays inert
npm run tauri:dev    # the same frontend in a Tauri window
npm run tauri:build  # a release bundle in src-tauri/target/release/bundle
```

`npx tauri build --debug --no-bundle` compiles a debug binary without packaging it, which is the
quickest check that the Rust side builds.

## What it shows

- `setupTauri({ plugins: { os } })` in the root component, with `@tauri-apps/plugin-os` passed in
  (and `tauri-plugin-os` registered in `src-tauri/src/lib.rs`, allowed in
  `src-tauri/capabilities/default.json`).
- `desktop.notifications`, with `@tauri-apps/plugin-notification` passed in (`tauri-plugin-notification`
  registered and `notification:default` allowed): a button asks for permission on the click and
  sends "Export finished" three seconds later, so you can switch away and see it arrive. In a
  browser the same button goes through the Web Notifications API, or a toast without it.
- The platform badge reads `desktop.platform`: `null` in a browser, the OS in a window.
- `@loidolt/theme-tauri/styles.css` after the theme's stylesheet.
- Window chrome: `getCurrentWindow` and the `createTheme` store passed to `setupTauri`, with
  `chrome: { titleBar: 'overlay' }`. In `src-tauri/tauri.conf.json` the window starts hidden
  (`"visible": false`) in the theme's launch colour (`"backgroundColor"`, which is
  `windowBackground('light')`), with an overlay title bar (`"titleBarStyle": "Overlay"`,
  `"hiddenTitle": true`). `setupTauri` paints the window in the theme and then shows it, so it
  opens without a white flash; switch the theme and the window background and appearance follow.
- On macOS the page clears the window buttons through `--ldt-safe-top`, which full screen gives
  back, and `<Topbar dragRegion>` moves the window. The window permissions this needs are in
  `src-tauri/capabilities/default.json`.
