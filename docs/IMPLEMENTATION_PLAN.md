# Engineering roadmap

This document records the current engineering posture of the design system. Completed migration
notes and line-number audits are intentionally kept out of it because they become misleading as
the component library evolves.

## Current architecture

- `packages/tokens` owns typed primitives, semantic roles, and generated light/dark CSS.
- `packages/styles` owns layered foundations and domain-split component styles.
- `packages/svelte` owns Svelte 5 components plus theme, media-query, and toaster helpers.
- `packages/svelte/src/lib/internal` holds parts shared between components (media controls,
  list rows, editable cells). They are never exported, so the catalog integrity check — which
  pairs every file in `components/` with an export, a demo and a registry entry — ignores them.
- Pure logic (data-table filtering and sorting, media URL parsing, signature geometry, contrast
  arithmetic) lives in plain modules beside the rune factories, so most behaviour is tested
  without rendering.
- `packages/charts`, `packages/maps` and `packages/docs` are optional packages built on
  `theme-svelte`. Each has a `/core` entry of plain TypeScript (option builders, style
  generators, geometry, routing, the markdown renderer) that runs on the server and in workers,
  and components that load their heavy peer (ECharts, MapLibre, Shiki, Mermaid, deck.gl) in
  the browser only. Their styles live in `packages/styles` with everything else.
- Canvas and WebGL paint from the same tokens as the DOM: `createTokenColors` in `theme-svelte`
  reads the resolved semantic roles off the page and reports theme changes.
- `examples/catalog` is the documentation and integration application. Its registry documents
  components from every package, and the integrity check pairs each package's components with
  exports, demos, registry entries and README lists.
- Changesets keep the six public packages on a coordinated version.

## Quality gates

- TypeScript and Svelte diagnostics, ESLint, and Prettier.
- Browser-like component tests plus a separate server-rendering suite.
- Enforced statement, branch, function, and line coverage floors.
- Chromium axe scans and keyboard-interaction smoke tests against the built catalog. WebGL runs
  on SwiftShader, and every request off the machine is stubbed, so map tests need no network.
- Palette tests: chart series hold 3:1 against every surface and stay distinct, ramps are
  monotonic, and map labels and syntax colours hold 4.5:1, in both themes.
- Catalog integrity checks across sources, exports, demos, registry entries, and generated props.
- Static catalog build, package dry-runs, `publint`, and published-type validation.

## Maintenance priorities

- Review low-severity npm advisories as upstream releases become available; do not force unsafe
  downgrades merely to make the audit count zero.
- Upgrade TypeScript, jsdom, testing-library, and Node type majors independently.
- Expand real-browser coverage when a component adds focus, form, or overlay behavior.
- Keep package-local READMEs and the live catalog aligned with public APIs.
- Track MapLibre and deck.gl together: deck.gl's interleaved mode does not yet support MapLibre
  6, so `DeckOverlay` defaults to an overlaid canvas.
- OpenFreeMap has no SLA; apps that need one pass their own tile URL or style.

## Verification

Run the same checks used in CI before release:

```sh
npm run check
```
