---
'@loidolt/theme-styles': minor
---

Use the styles without Svelte or a bundler. `@loidolt/theme-styles/standalone.css` is the whole
stylesheet with every `@import` inlined and the `dark-auto` theme included, so it can be pasted
into a single `<style>` element, for example in a generated, self-contained HTML report.
`standalone-core.css` is the same without the media, charts, maps, prose and docs styles, and
`fonts-embedded.css` carries Jost and Archivo as data URIs (about 30 kB) for pages that should
match the web UI's type exactly; without it the font stacks fall back to system fonts. Write the
same `ldt-` markup the components render, set `data-theme` to pin a scheme, and append a preset
file with `data-preset` to restyle. The catalog's new CSS only page walks through it.
