---
'@loidolt/theme-capacitor': minor
---

Pick and save files with `createFiles`, also returned by `setupCapacitor` as `native.files`. `pick({ accept, multiple })` opens the system file picker with `@capawesome/capacitor-file-picker` in an app and a file input in a browser, and resolves `File` objects either way, so the code that handles a `FileInput`'s files handles these too; `accept` takes the same values as `<input accept>`, and dismissing the picker resolves `[]`. `save(file, { folder, overwrite })` writes to the device's Documents with `@capacitor/filesystem` (the app's folder in the iOS Files app, the shared Documents folder on Android), asks for storage access on the Android versions that need it, and downloads in a browser. `@capawesome/capacitor-file-picker` and `@capacitor/filesystem` are new optional peer dependencies.
