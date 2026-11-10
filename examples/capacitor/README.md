# Capacitor example

A minimal [Capacitor 8](https://capacitorjs.com) app on `@loidolt/theme-svelte` and
`@loidolt/theme-capacitor`, for trying the native adapters in the iOS Simulator. Plain Vite and
Svelte, with a small History API router so the `TabBar` and deep links have real paths.

It is a workspace package, but outside the repository's checks: `npm run check` and CI never
build it, and it has no `test` script. The iOS side needs Xcode with an iOS Simulator runtime.
The `ios/` project is committed; Swift packages resolve on the first build, and
`ios/App/App/public`, `ios/DerivedData` and Xcode's build output are ignored.

## Run

From the repository root, build the packages once:

```sh
npm run build:packages
```

Then, in `examples/capacitor`:

```sh
npm run dev        # the frontend alone, in a browser: theme-capacitor stays inert
npm run ios:sync   # build dist/ and copy it, and the plugins, into the iOS project
npm run ios:run    # sync, then build and launch on a simulator you pick
npm run ios:open   # the project in Xcode
```

`LDT_DEV=http://localhost:5175 npm run ios:sync` points the app at the Vite dev server (run
`npm run dev` alongside) for live reload; sync again without it before a real build.
`LDT_LAUNCH=dark npm run ios:sync` paints the launch screen and splash in the dark theme.

`[ldt]` lines go to the app's console, so a run can be followed from a terminal:

```sh
xcrun simctl launch --console-pty booted space.loidolt.theme.example
```

## What it shows

One screen per area, under one `setupCapacitor` call in `src/App.svelte` with every plugin the
package supports passed in, and `capacitor.config.ts` built with `withTheme` from
`@loidolt/theme-capacitor/config`.

- **Chrome**: `ThemeToggle` and `PresetPicker`, the status bar icon style they produce, the
  resolved safe-area insets (rotate to see the side ones), and a `Dialog` and a `Drawer`. The
  choice is stored with `Preferences`, so it survives a relaunch even when WebKit's storage is
  cleared.
- **Share**: a link, text, a generated PDF and three files through the native share sheet, with
  the outcome and what is in `CACHE/ldt-share`.
- **Files**: `pick()` with PDFs, images, single and multiple; `save()` to Documents, with the
  outcome, the folder's contents and an overwrite switch. `Info.plist` sets
  `UIFileSharingEnabled` and `LSSupportsOpeningDocumentsInPlace`, so saved files show in the Files
  app under _On My iPhone › Theme example_.
- **Type**: fields at the bottom of the page, with the keyboard state the stylesheet sees.
- **System**: an external link (in-app browser), a copy button, the network status, a looping
  tone that pauses in the background, the deep link scheme and the text size.

Deep links use the `ldtexample://` scheme (`CFBundleURLTypes` in `Info.plist`):

```sh
xcrun simctl openurl booted ldtexample://share
```

To seed the pickers, `xcrun simctl addmedia booted photo.png` adds to Photos; for Files, copy into
the simulator's _On My iPhone_ folder, the `File Provider Storage` directory of the
`group.com.apple.FileProvider.LocalStorage` container
(`xcrun simctl get_app_container booted com.apple.DocumentsApp groups`).
