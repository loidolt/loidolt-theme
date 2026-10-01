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

Built-in style presets live under `/presets/*`: `loidolt`, `soft` and `compact`, each with
`-dark` and `-dark-auto` companions. They apply under `data-preset="<name>"`.

See the [design-system documentation](https://theme.loidolt.space) for customization guidance.
