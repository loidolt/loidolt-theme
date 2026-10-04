---
'@loidolt/theme-styles': minor
---

Add `@loidolt/theme-styles/core`: the whole stylesheet without the styles for media, charts, maps, long-form prose and docs, for apps that use only the Svelte components. Each component stylesheet is also published as `@loidolt/theme-styles/components/<name>`, so an app can add one extra back inside the components layer. `index.css` is now `core.css` plus those extras, so the full stylesheet is unchanged.
