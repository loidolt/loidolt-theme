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
- `examples/catalog` is the documentation and integration application.
- Changesets keep the three public packages on a coordinated version.

## Quality gates

- TypeScript and Svelte diagnostics, ESLint, and Prettier.
- Browser-like component tests plus a separate server-rendering suite.
- Enforced statement, branch, function, and line coverage floors.
- Chromium axe scans and keyboard-interaction smoke tests against the built catalog.
- Catalog integrity checks across sources, exports, demos, registry entries, and generated props.
- Static catalog build, package dry-runs, `publint`, and published-type validation.

## Maintenance priorities

- Review low-severity npm advisories as upstream releases become available; do not force unsafe
  downgrades merely to make the audit count zero.
- Upgrade TypeScript, jsdom, testing-library, and Node type majors independently.
- Expand real-browser coverage when a component adds focus, form, or overlay behavior.
- Keep package-local READMEs and the live catalog aligned with public APIs.

## Verification

Run the same checks used in CI before release:

```sh
npm run check
```
