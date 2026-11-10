---
'@loidolt/theme-capacitor': patch
---

Keep scrolled content from showing under the status bar in a native shell. `Topbar` scrolls away
with the page, after which the page ran under the clock and the Dynamic Island; `styles.css` now
paints a fixed strip as tall as the top safe area in `surface` under `data-native-platform`. The
README's adapter table, which listed every adapter twice and dropped `createShare` from the
second copy, is one table again.
