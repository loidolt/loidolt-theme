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

See the [design-system documentation](https://theme.loidolt.space) for customization guidance.
