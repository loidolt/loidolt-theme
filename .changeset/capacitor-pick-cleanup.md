---
'@loidolt/theme-capacitor': patch
---

`createFiles().pick()` deletes the copy the native picker makes of each picked file (on iOS, in `Library/Caches/<uuid>/`) once the file is read, when `Filesystem` is passed, so picked files no longer pile up in the app's cache. Only paths inside the cache directory are touched, and a failed delete never rejects `pick()`.
