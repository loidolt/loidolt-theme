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
- Running in the background: `tauri-plugin-single-instance` registered first in
  `src-tauri/src/lib.rs`, focusing the window and emitting each second launch (and, on macOS, files
  opened from the Finder) for `singleInstance`; `tauri-plugin-deep-link` with the
  `theme-example://` scheme in `tauri.conf.json` for `deepLinks` (on macOS only a built bundle
  registers it); and a tray icon (the `tray-icon` feature of `tauri`) whose menu shows the window,
  pauses and resumes, and quits. Run `npm run tauri:dev`, then launch the binary again with a file
  path after it (`src-tauri/target/debug/theme-tauri-example notes.md`) to see the second launch
  arrive in the first window.
- The platform badge reads `desktop.platform`: `null` in a browser, the OS in a window.
- `@loidolt/theme-tauri/styles.css` after the theme's stylesheet.
