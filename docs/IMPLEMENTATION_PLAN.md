# Theme Library Remediation Plan

Source: full design-system review, 2026-08-20 (4 parallel review passes: tokens/styles, components A–M, components N–Z, packaging/DX/tests/docs; plus verified `npm run check` green and a visual pass of the catalog).

This plan is self-contained — it assumes no prior conversation context. Work phases in order; Phases 1–2 contain breaking API changes and must land before any consumer adopts v1. Run `npm run check` after each phase. Add a changeset for every public package change.

**Verdict driving this plan:** strong bones (cascade layers + `:where()` reset, verified tree-shaking, clean Svelte 5 idioms, accurate README, ~20 KB CSS) but 7 critical defects, a batch of breaking API-shape decisions best made pre-v1, and an accessibility/typography debt list.

---

## Phase 1 — Token architecture (breaking, do first)

Everything about theming, dark mode, and branding hangs off this. Cheap now, expensive after adoption.

### 1.1 Fix the CSS variable name generator (CRITICAL)

`packages/tokens/scripts/generate-css.mjs:7` — camelCase→kebab conversion applies only to the leaf key, not intermediate keys accumulated into `prefix` during recursion. `typography.lineHeight` emits `--loidolt-font-lineHeight-tight/normal/relaxed` (see `packages/tokens/dist/tokens.css:31-33` after a build), while `packages/styles/src/base.css:9` references `var(--loidolt-font-line-height-normal)` and `base.css:44` references `var(--loidolt-font-line-height-tight)`. Neither exists — every tokenized line-height silently falls back to `normal` in all consuming apps.

- Fix: build the full joined variable path, then kebab-case the whole string.
- Add a regression test: parse every `var(--loidolt-*)` reference in `packages/styles/src/*.css` and assert each is defined in the generated CSS. This test would have caught the bug.

### 1.2 Grow the semantic token layer so dark mode is actually possible (CRITICAL)

README (lines 69-70) claims a future mode can be added without changing component props. Today the semantic tier is 5 hardcoded aliases in `generate-css.mjs:23-29` (`background`, `surface`, `foreground`, `primary`, `border`), and `packages/styles/src/components.css` consumes **primitives** directly nearly everywhere: `--loidolt-color-deep` (components.css:7,21), `--loidolt-color-panel` (:225,299,383,413), plus `-white`, `-muted`, `-line-soft`, etc. `--loidolt-surface` is never used at all. Overriding the aliases restyles ~nothing.

- Define a real semantic map **in `packages/tokens/src/index.ts`** (not as generator string literals): surface, surface-alt, text, text-muted, border, border-soft, accent, on-accent, danger, scrim, shadow-color, and whatever else components.css actually needs. Export it so TS consumers can reference it and the generator can't drift.
- Generator: emit token-to-token links as `var()` references, not resolved hex. Today `borders.color: colors.line` (index.ts:62) emits a literal `#c8c1b1` (tokens.css:55), so overriding `--loidolt-color-line` doesn't propagate.
- Rewrite `components.css` to consume **only** semantic variables.
- Tokenize the baked-in colors: shadows (`tokens/src/index.ts:65-67`, `rgb(32 35 29 / …)` literals) and the overlay scrim (`components.css:401`, `rgb(32 35 29 / 0.72)`) — derive from `--loidolt-shadow-color` / a scrim token, e.g. via `color-mix()`.
- Tokenize the z-index scale (magic 60/61/70/80/90/1000 at components.css:370,398,404,448,483 and accessibility.css:24) as `--loidolt-z-*`.
- Document the two-prefix convention (`--loidolt-*` = public tokens, `--ldt-*` = per-component knobs like `--ldt-dialog-width`, `--ldt-sidebar-width`, `--ldt-gap`) in the README — it's a fine convention, currently invisible.

### 1.3 Tokens package exports (MAJOR)

`packages/tokens/package.json:9-14` — the `.` export has only `types` + `import`; `require('@loidolt/theme-tokens')` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. Add `"default": "./dist/index.js"` (theme-svelte's map already does this correctly).

### 1.4 Tokens test decoupled from build order (MAJOR)

`packages/tokens/src/index.test.ts:17` reads `../dist/tokens.css`; fresh-clone `npm test` fails with ENOENT. Extract the generator's serialization into an exported function, test it in-memory, and assert full key parity between the `tokens` object and generated variables. Fold in the 1.1 regression test here.

---

## Phase 2 — Component API shape (breaking, batch before v1)

### 2.1 Typed rest props everywhere (CRITICAL-adjacent, mechanical)

Every component types rest as `[key: string]: unknown` (Alert:16, AppShell:15, Badge:13, Brand:17, Button:29, Card:19, Checkbox:17, ContextBar:17, Field:21, IconButton:17, Input:14, Label:9, and the N–Z set). Zero attribute/event type safety; typos type-check.

- Use `svelte/elements`: `interface Props extends HTMLButtonAttributes { … }` (`HTMLInputAttributes` for Input, `HTMLAttributes<HTMLDivElement>` for surfaces, anchor attributes for Brand/Button link branch).
- Removes hand-typed `onclick` (Button.svelte:28) and `oninput` (Input.svelte:13).
- Delete unused `CommonProps` (types.ts:20-24); merge duplicate `Option`/`NavItem` types (types.ts:8-18).

### 2.2 `ref` escape hatch on every component (MAJOR)

Nothing exposes the DOM node. Add `ref = $bindable(null)` + `bind:this` across the board (highest value: Input, Checkbox, Button, IconButton, Dialog content).

### 2.3 One change-callback convention (MAJOR, breaking)

Current 4-way split: `oninput(event)` (Input), `onchange(value)` (NumberField.svelte:19, Switch.svelte:16), `onselect(value)` (DropdownMenu, NavMenu), `onValueChange`/`onOpenChange` (Tabs.svelte:19, Popover.svelte:13), `ondismiss` (Toast). The lowercase ones shadow native DOM attribute names with non-DOM signatures.

- Standardize on Bits-style camelCase: `onValueChange`, `onCheckedChange`, `onOpenChange` — cannot collide with DOM handlers forwarded via rest.

### 2.4 Fix spread-order handler clobbering (MAJOR, real bug)

`Switch.svelte:33-34` and `NumberField.svelte:44-45` spread `{...rest}` **after** internal handlers — a consumer-passed `onclick`/`onchange` silently replaces `toggle`/clamping. Spread rest first, declare internal handlers after (or compose).

### 2.5 Open up the Bits UI wrappers (MAJOR)

Dialog, DropdownMenu, Popover, Tooltip, Tabs, NavMenu:

- Forward `...rest` to Content (Dialog.svelte:18-30 and DropdownMenu.svelte:14-22 currently forward nothing — no `id`, `data-*`, ARIA, `trapFocus`, `interactOutsideBehavior`, `escapeKeydownBehavior`, `onOpenAutoFocus`).
- Un-hardcode triggers: Dialog.svelte:39-41 locks `ldt-button`; DropdownMenu.svelte:26-28 and Popover.svelte:30 lock `ldt-button ldt-button--quiet`; Tooltip.svelte:24 locks icon-button classes (a Button inside its trigger snippet = nested buttons, invalid HTML). Add `triggerClass` and expose Bits' `child` snippet so consumers can supply their own element.
- Make DropdownMenu `open` a `$bindable` (currently not controllable/closable programmatically).
- Expose `sideOffset`/`side`/`align` (hardcoded 6 at Popover.svelte:34, DropdownMenu.svelte:30, Tooltip.svelte:28).
- DropdownMenu: add a `children` snippet alternative to the items-array API (no separators, groups, checkbox/radio items, icons, or links today — forces forks). Wrap `GroupHeading` in `MenuPrimitive.Group` (DropdownMenu.svelte:31-32 — standalone heading isn't associated with items; affects NavMenu `groupLabel` too).
- Tooltip: drop forced `aria-label={content}` (Tooltip.svelte:23-25) — it clobbers the trigger's accessible name; only set when explicitly passed, let Bits' `aria-describedby` work. Export an app-level `TooltipProvider` (per-instance Provider at Tooltip.svelte:21 defeats skip-delay grouping).
- Dialog: only set inline `--ldt-dialog-width` when `size` prop given (inline style currently unbeatable, Dialog.svelte:31,46). Drop redundant `changed()` double-writes of bound state (Dialog.svelte:32-35, Popover.svelte:23-26, Tabs).

### 2.6 Unify vocabulary (breaking)

- Variants: Button `default|primary|quiet|danger|ghost` / Badge `default|accent|success|warning|error` / Alert `info|success|warning|error`. Pick one action set + one status set. Note `ldt-alert--info` has **no CSS rule** (Alert.svelte:21 emits it; components.css:322-328 has only success/warning/error) — either add the rule or skip modifier for default like Badge does. Give Toast the status variants it lacks.
- Sizes: Button `sm|md|lg` vs Dialog `sm|md|lg|xl`; IconButton/Input none. Shared scale; give IconButton `size`/`variant` (Dialog.svelte:56 hand-assembles ghost icon-button classes, proving need).
- `label` prop means four things: aria-label (IconButton), visible label (Field), group heading (DropdownMenu), trigger text (NavMenu). One meaning per name.
- `boxed` exists for Input/Select/Textarea, not NumberField — add it.
- Fold TextButton into `Button variant="text"` (TextButton lacks onclick/href/loading/size and fights `ldt-button` base styles it half-undoes).
- Document per-component `class` target; today: root usually, `<label>` on Checkbox (Checkbox.svelte:21-28 — input unreachable, consider `inputClass`), portaled Content on Dialog/DropdownMenu, inner `<table>` on Table (scrollable wrapper unreachable — see 4.5).

---

## Phase 3 — Point bugs (non-breaking, quick wins)

1. **SSR ids (CRITICAL):** `utils.ts:5-7` `uid()` uses `Math.random()`; Field.svelte:5 and RadioGroup.svelte:7 use it as default id/name → hydration mismatches, broken label wiring, radio groups can split pre-hydration. Replace with Svelte 5 `$props.id()`; delete `uid`.
2. **Workspace grid (CRITICAL):** `Workspace.svelte:19-21` + components.css:598-608 — `.ldt-workspace` unconditionally sets `grid-template-columns: <sidebar-width> minmax(0,1fr)`; omitting the optional `sidebar` snippet puts main in the narrow fixed column. Add `ldt-workspace--sidebar` modifier toggled by the component (mirror existing `--inspector` pattern); base grid single-column.
3. **NumberField NaN (CRITICAL):** NumberField.svelte:22-25,34,52 — cleared input → `value` undefined → `undefined - 1 = NaN` → clamp keeps NaN, field wedges. Guard in `set()`: NaN/undefined → `min` (or 0 when unbounded). Also omit invalid `min="-Infinity"`/`max="Infinity"` HTML attributes (lines 5-6,40-41): `Number.isFinite(min) ? min : undefined`.
4. **Release workflow auth (CRITICAL):** `.github/workflows/release.yml:19-31` — setup-node's `registry-url` npmrc expects `NODE_AUTH_TOKEN`; publish step only sets `NPM_TOKEN`; first publish 401s. Either add `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` to the changesets step, or (preferred — `id-token: write` and `provenance=true` already set) switch to npm Trusted Publishing/OIDC and drop the token. Also add `concurrency: { group: release, cancel-in-progress: false }`, a fork guard (`if: github.repository == 'loidolt/loidolt-theme'`), and `timeout-minutes`. Confirm repo setting "Allow GitHub Actions to create pull requests" is on.
5. **Svelte peer floor (MAJOR):** `packages/svelte/package.json:35-37` declares `svelte: ^5.0.0` but bits-ui@^2.19 peers `^5.33.0`. Raise to at least `^5.33.0`.
6. **Input redundant handler:** Input.svelte:16-19 manual `value =` alongside `bind:value` is a no-op — drop `handleInput`, forward `oninput` directly.
7. **Button loading live region:** Button.svelte:45 conditionally-mounted `role="status"` span won't announce (content present at live-region insertion is ignored by most SRs) and duplicates `loadingText`. Render the span persistently and toggle its text, or drop it in favor of `aria-busy` + visible `loadingText`.
8. **Tabs default selection:** Tabs.svelte:7 — `value = $bindable()` with no fallback renders zero panels. Default to `tabs[0]?.value`.

---

## Phase 4 — Accessibility pass

1. **Contrast (MAJOR):** orange `#ca5425` as text on paper `#ebe7dc` ≈ 3.5:1, used at 10px in `.ldt-eyebrow` (utilities.css:36-42), `.ldt-menu__label` (components.css:460-466), `.ldt-brand__meta` (:547), `.ldt-contextbar__section` (:581) — fails AA. White-on-orange primary buttons/badges ≈ 4.4:1 — marginal fail at sm/xs sizes. Muted `#716d61` on paper ≈ 4.2:1 at 10px. Fix: use existing `orangeDark #a9441d` for text-on-light, darken muted, and/or bump xs sizes.
2. **Input focus ring (MAJOR):** components.css:132-139 `.ldt-input:focus { outline: 0 }` beats the `:where(:focus-visible)` rule in accessibility.css; 1px border-color swap is below WCAG 2.4.13 expectations. Keep an outline or thicken the indicator.
3. **Toast live regions + lifecycle (MAJOR):** ToastViewport.svelte:12-16 `aria-live="polite"` wraps Toasts with `role="status"` — nested live regions, double announcements. Pick one (viewport as sole region is simplest). Move dismiss button after content in DOM order (Toast.svelte:25-30). Ship a `toaster` store (queue, auto-dismiss timer, pause-on-hover) or explicitly document the hand-rolled pattern — nothing exists today. Give the dismiss IconButton ghost/sm styling (Toast.svelte:25-27 renders full-size bordered button in a compact toast).
4. **NavMenu active state (MAJOR):** `.ldt-nav-menu` / `.ldt-nav-menu__active` exist in no stylesheet; no `aria-current`; the class lands on DropdownMenu popup Content, not the trigger. Style it, wire `aria-current`, and target the right element.
5. **Table (MAJOR):** Table.svelte:12 scrollable `role="region"` needs `tabindex="0"` for keyboard scroll; also expose the wrapper for class/rest (currently only inner `<table>` reachable).
6. **Progress (MAJOR):** Progress.svelte:23 clamp `aria-valuenow` like the visual bar; guard `max <= 0` (Infinity% today); add indeterminate mode (`value={undefined}` → omit `aria-valuenow`, animate).
7. **Checkbox accessible name (MAJOR):** children optional with no `label`/`aria-label` fallback → unnamed control. Add prop or require children.
8. **Heading levels:** hardcoded `<h3>` (Alert.svelte:25, Card.svelte:25), `<h2>` (Panel.svelte:23, Section.svelte:24-28), `<h1>` (PageHeader.svelte:24). Add `headingLevel` prop or title snippets.
9. **Hardcoded English defaults:** "Optional" (Field.svelte:31), "Loading" (Button/Spinner), "Sidebar" (Sidebar.svelte:6,21 — also redundant role-in-name on `<aside>`), "Sections" (Tabs.svelte:9), "Notifications" (ToastViewport.svelte:5), "Data table" (Table.svelte:12), "Dismiss notification" (Toast.svelte:8), Topbar.svelte:21 `aria-label="Primary"` (no prop at all). Make all overridable props.
10. **Misc:** Switch has no form participation (add hidden input or document); Select placeholder `<option value={undefined} disabled>` unrecoverable + no label prop + no change callback; Separator needs vertical orientation (`aria-orientation` + modifier); AppShell header snippet unwrapped while footer gets `<footer>` (AppShell.svelte:20-22); Checkbox `indeterminate` should be `$bindable`; NumberField spin buttons drop focus when disabled at bounds (use `aria-disabled` + no-op); Card `<article>` → `<div>`/configurable.

---

## Phase 5 — Typography & performance

1. **Bold/italic never render (MAJOR):** fonts.css registers only Jost 500 + Archivo 400; base.css:10 sets `font-synthesis: none` globally → `<strong>`, `font-weight: 700`, italics all render as body text in every consumer. Ship bold (and italic) faces per family, or scope/drop `font-synthesis: none`.
2. **WOFF1 → WOFF2 (MAJOR):** both fonts are genuine WOFF1 (~33 KB total); WOFF2 ≈ 30% smaller, universal support. Convert; update `format()` in fonts.css:3,11. Add README preload guidance using the existing `./fonts/*` export.
3. `html { font-size: 16px }` (base.css:8) overrides user browser preference → `100%`. `100vh` (base.css:15, components.css:517) → `100dvh`.
4. Drop `!important` inside layers: components.css:211 (`box-shadow: none !important` — scope the selector instead) and audit the reduced-motion block (accessibility.css:40-49) — layered `!important` beats consumer unlayered `!important` (importance reverses layer order).
5. Remove dead `loidolt.reset` layer name (index.css:1) or populate it. Add `"style": "./src/index.css"` to styles package.json for non-exports-aware tooling. Make deep style slices (`/base`, `/components`, `/utilities`) either `@import` tokens themselves or document the dependency.
6. `text-rendering: optimizeLegibility` (base.css:11) — known mobile perf cost; reconsider.
7. Single hardcoded `@media (max-width: 760px)` (components.css:659) — tokenize/document breakpoint.

---

## Phase 6 — Tests, CI, docs, catalog

1. **Component tests:** coverage is 3/37 (Button, Switch, Dialog; axe on Button/Switch/Alert). Priority additions: the full form layer (Input, Select, NumberField incl. NaN regression, Checkbox, RadioGroup, Textarea), the `Field` snippet contract (`{ id, describedBy, invalid }` — the README's flagship pattern), overlays (Popover, DropdownMenu, Tooltip incl. accessible-name regression, Tabs), Toast dismiss, Table, Workspace with/without sidebar.
2. **Package-shape tests:** nothing imports the barrel or built dist. Add publint + arethetypeswrong to CI; a smoke test importing from `dist`.
3. **CI/workflows:** dedupe triple build on main push (ci.yml check + release.yml check + release script's build); consider Node 22/24 matrix; add `engines` to the three published package.jsons; document that local `npm run release` fails due to `provenance=true` (CI-only publishing).
4. **Lint/format interop:** add `eslint-config-prettier` / `svelte.configs['flat/prettier']` to eslint.config.js. Deduplicate tsconfigs via `extends` (svelte + catalog copy root options; `ignoreDeprecations` pasted 3×).
5. **Catalog:** demo `Label` (only undemoed component); replace hardcoded "37 Components" stat and `meta="Theme 0.1"` with derived values; add a theming/override demo (proves the Phase 1 semantic layer), an invalid-Field state demo, and later a dark-mode toggle.
6. **Docs:** README — SSR-safety note, required Svelte/Node versions, document `cx` and exported types, `--ldt-*` vs `--loidolt-*` convention, font preload. Fix root `npm run dev -- --port X` arg-forwarding (nested `npm run` swallows args — root script should forward with `npm run dev -w @loidolt/theme-catalog --`).
7. **Nits:** add `"./package.json"` export to all packages; `sideEffects: ["**/*.css"]` glob (nested `dist/styles.css`); `git+` prefix on repository URLs; remove stale Playwright entries from .gitignore or add actual e2e; label component reuses `ldt-field__label` (Label.svelte:12) — give it own `ldt-label` class; ContextBar actions use generic `ldt-cluster` — add `ldt-contextbar__actions`; ToastViewport renders empty landmark — render conditionally; Skeleton width/height accept numbers.

---

## Verification checklist (run after each phase)

- `npm run check` (build, typecheck, tests, lint, format, catalog build)
- Phase 1: grep generated `tokens.css` — no camelCase var names; every `var(--loidolt-*)` in styles resolves; token parity test green
- Phase 2: `npm pack --dry-run` + publint clean; catalog compiles against new APIs
- Phase 4: axe suite green across all components; manual contrast spot-check of eyebrow/menu labels
- Phase 6: fresh-clone `npm install && npm test` passes without prior build
