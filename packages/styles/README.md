# @loidolt/theme-styles

Fonts, foundations, component classes, accessibility rules, and layout utilities for the Loidolt
design system.

```sh
npm install @loidolt/theme-styles
```

```css
@import '@loidolt/theme-styles';
```

Deep entry points include `/tokens`, `/base`, `/components`, `/utilities`, `/accessibility`,
`/fonts`, `/dark`, and `/dark-auto`. Every slice except `/tokens` expects the token custom
properties to be loaded first.

`/core` is the whole stylesheet without the styles for media, charts, maps, long-form prose and
docs, for an app that uses only the Svelte components. Add an extra back through
`/components/*`, inside the components layer:

```css
@import '@loidolt/theme-styles/core';
@import '@loidolt/theme-styles/components/prose' layer(loidolt.components);
```

Built-in style presets live under `/presets/*`: `loidolt`, `soft` and `compact`, each with
`-dark` and `-dark-auto` companions. They apply under `data-preset="<name>"`.

## Without Svelte or a bundler

For a page that cannot resolve `@import`s, such as a generated, self-contained HTML report, the
package ships prebuilt stylesheets in `dist/` with every import inlined and no reference to any
other file:

| File                  | Contents                                                                                     | Size    |
| --------------------- | -------------------------------------------------------------------------------------------- | ------- |
| `standalone.css`      | Tokens, base, every component group, utilities, accessibility, and dark mode via `dark-auto` | ~130 kB |
| `standalone-core.css` | The same without media, charts, maps, prose and docs                                         | ~95 kB  |
| `fonts-embedded.css`  | Jost and Archivo as base64 WOFF2 data URIs (SIL Open Font License)                           | ~30 kB  |

Paste one into a `<style>` element (or read it from
`node_modules/@loidolt/theme-styles/dist/` in the script that writes the page), then write the
markup the Svelte components render: `ldt-` classes such as `ldt-card`, `ldt-card__title` and
`ldt-badge--success`, with the same ARIA attributes. Copying a component's rendered HTML from the
catalog is the quickest way to get it right.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      /* contents of @loidolt/theme-styles/standalone.css */
    </style>
  </head>
  <body>
    <main class="ldt-container ldt-stack">
      <div class="ldt-stat">
        <p class="ldt-stat__value">128</p>
        <p class="ldt-stat__label">Files processed</p>
      </div>
      <span class="ldt-badge ldt-badge--success">Ready</span>
    </main>
  </body>
</html>
```

- **Dark mode** follows `prefers-color-scheme`. Set `data-theme="dark"` or `data-theme="light"`
  on `<html>` to pin a scheme.
- **Presets**: append the resolved preset file and its dark-auto companion from
  `@loidolt/theme-tokens/css/presets/<name>` and `<name>-dark-auto`, then set
  `data-preset="<name>"` on `<html>`.
- **Fonts**: the standalone files have no `@font-face`, so the stacks fall back to installed and
  system fonts and nothing waits for a download. Put `fonts-embedded.css` first to use the brand
  faces.
- **Fewer components**: start from `standalone-core.css` and append any `components/*.css` file
  (each is self-contained) wrapped in `@layer loidolt.components { … }`.

See the [design-system documentation](https://theme.loidolt.space) for customization guidance.
