---
'@loidolt/theme-capacitor': minor
---

Share files, links and text with `createShare`, also returned by `setupCapacitor` as `native.share`. One call goes through the best channel the shell has: the native share sheet with `@capacitor/share` (a `File` or Blob is written to the cache with `@capacitor/filesystem` first), then the Web Share API, then a download for files or the clipboard for a link (`fallback: 'open'` opens it instead). It resolves with the channel used and whether the user cancelled, so closing the sheet is never an error, and `canShare()` tells a "Share" button from a "Download" one. `@capacitor/share` and `@capacitor/filesystem` are new optional peer dependencies.
