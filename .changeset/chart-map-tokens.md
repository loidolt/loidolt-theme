---
'@loidolt/theme-tokens': minor
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add data-visualisation and basemap colour tokens, and a way to use tokens on a canvas.

- Tokens: eight categorical chart colours (`--loidolt-chart-1`…`-8`), sequential and diverging ramps, gain/loss colours and `--loidolt-map-*` basemap roles, each with a dark value and checked for contrast in both themes. `roleVar`, `roleValue`, `resolveRoles`, `chartRoles`/`mapRoles` and `chartColors()`/`mapColors()` resolve them in JavaScript. A trailing number in a token name is now its own segment (`chart1` → `--loidolt-chart-1`); no existing name changes.
- Svelte: `createTokenColors()` reads semantic roles off the page as hex for canvas and WebGL renderers and follows theme changes; `readRoleColor`, `colorSchemeOf`, `observeColorScheme` and `normalizeColor` are the pieces it is built from.
- Styles: a `loidolt.vendor` cascade layer between `base` and `components` for third-party stylesheets a loidolt package ships with.
