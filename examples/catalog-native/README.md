# Native catalog

The catalog site, every page and demo of it, inside a [Capacitor 8](https://capacitorjs.com)
shell with `@loidolt/theme-capacitor`. Use it to test every component the way a native user of an
app built on the theme would see it: safe areas, system text size, the keyboard, the share sheet,
haptics, dark mode and rotation, on a phone and on an iPad.

Nothing here forks the catalog. `svelte.config.js` points SvelteKit's routes, `$lib`, static
files and server hook at `examples/catalog/src`, and this package adds only three things:

- `src/hooks.client.ts`: one `setupCapacitor` call with every plugin the package supports, the
  catalog's own theme store and `goto` for deep links. It also writes the preset and scheme onto
  the preset preview frames, which the catalog's server hook does on the web.
- `src/app.html`: the catalog's template with `viewport-fit=cover`, so the page reaches under the
  status bar and home indicator and the safe-area insets apply.
- A single-page build. Capacitor's iOS server answers any path without an extension with the root
  `index.html`, so prerendered pages would hydrate under the wrong URL on a reload or deep link.
  Here `index.html` is the client-rendered shell for every route.

Like `examples/capacitor`, it is a workspace package outside the repository's checks: `npm run
check` and CI never build it, and it has no `test` script. The `ios/` project is committed;
`ios/App/App/public`, `ios/DerivedData` and Xcode's build output are ignored.

## Run

From the repository root, build the packages once:

```sh
npm run build:packages
```

Then, in `examples/catalog-native`:

```sh
npm run ios:sync   # build dist/ and copy it, and the plugins, into the iOS project
npm run ios:run    # sync, then build and launch on a simulator you pick
npm run ios:open   # the project in Xcode
```

`ios:run` goes through the Capacitor CLI. To build without it, as CI or a script would, sync
and then call Xcode directly, with a simulator id from `xcrun simctl list devices`:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -destination 'id=<simulator id>' -derivedDataPath ios/DerivedData build
```

The app lands in `ios/DerivedData/Build/Products/Debug-iphonesimulator/App.app`, ready for
`xcrun simctl install booted` and `xcrun simctl launch booted space.loidolt.theme.catalog`.

For live reload, run `npm run dev` and
`LDT_DEV=http://localhost:5376 npm run ios:sync`; sync again without it before a real build.

The launch is painted in the light theme's background. To test a dark-first app, sync with
`LDT_LAUNCH=dark npm run ios:sync`: the colour behind the web view before its first frame becomes
the dark theme's, so there is no light flash under a dark device. Like `LDT_DEV`, it is read at
sync time and lasts until the next sync.

Deep links use the `ldtcatalog://` scheme and open the matching page:

```sh
xcrun simctl openurl booted ldtcatalog://components/tab-bar
```

The first `openurl` on a simulator asks _Open in "Theme catalog"?_; tap Open once and later links
go straight in.

The page follows the system text size (Dynamic Type). It is read at launch and again whenever the
app returns to the foreground, so a size changed in Settings applies on switching back. A change
from Control Center over the running app only leaves it inactive, not backgrounded, so it applies
after switching away and back, or a relaunch.

`Info.plist` sets `UIFileSharingEnabled` and `LSSupportsOpeningDocumentsInPlace`, so files the
demos save show in the Files app under _On My iPhone › Theme catalog_.
