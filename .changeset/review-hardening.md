---
'@loidolt/theme-tokens': minor
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Foundation review hardening.

Tokens:

- Added `dangerHover` semantic role (light `#7f1f1a`, dark `#e07a70`), asserted at WCAG AA against `onDanger` in both themes.
- Removed the unused `--loidolt-border-color` primitive (and `borders.color`): it duplicated `--loidolt-border` but was never overridden by the dark theme, so any consumer reaching for it would get a light-theme border stuck in dark mode. Use `--loidolt-border` instead.
- New test guarantees the generated CSS never emits a `var()` reference to an undeclared token.

Styles:

- Fixed three selectors that used pseudo-elements inside `:where()`, which is invalid and silently dropped: the `box-sizing` reset and the reduced-motion rule now reach `::before`/`::after`, and the branded `::selection` colors actually apply.
- The reduced-motion rule also zeroes `animation-delay`/`transition-delay`.
- `.ldt-button--danger` keeps its danger fill on hover (previously flipped to the neutral inverse surface).
- Disabled menu items no longer show the interactive hover highlight.
- Added a `./fonts` export so deep-slice consumers can load the `@font-face` rules without the full bundle.

Svelte:

- `Button` no longer uses native `disabled` for the `loading` state, so keyboard focus is not dropped mid-interaction; explicit `disabled` keeps native semantics. The default variant no longer emits a dead `ldt-button--default` class (same for `IconButton`).
- `NumberField` now disables its spin buttons together with the input, chains a consumer `onchange` instead of dropping it, and treats a cleared field as the documented low-bound fallback instead of clamping `Number('')` (0).
- `createToaster` tracks remaining time per toast, fixing pause/resume corruption when toasts were pushed at different moments; a toast that expires while paused now dismisses right after resume.

Second pass (API and infrastructure):

- `Button` and `Brand` props are now discriminated on `href`: button-only attributes on an anchor (and vice versa) are a type error instead of silently rendered junk.
- `Alert` `title` is optional and accepts a snippet for rich headings; body-only alerts no longer need a dummy heading.
- `Tabs` defaults its `value` at destructure time instead of in an `$effect` (SSR output and first client frame now agree with a bound parent), falls back to the first tab when the selected tab is removed, and forwards rest attributes; `NavMenu` forwards rest attributes to its trigger.
- `DropdownMenu` item hints are exposed to assistive tech (styled via the new `ldt-menu__hint` class) instead of being `aria-hidden`.
- New `borderSunken` semantic token for decorative rules on the sunken surface, with a dark value — the catalog's canvas grid now adapts to dark mode.
- Publishing: `prepack` scripts on the tokens and svelte packages guard against packing a stale `dist`; the catalog consumes the packages via `^0.1.0` ranges like a real consumer; README font-preload example is bundler-aware.
- Tests: server-render sweep over every exported component (new SSR vitest project), keyboard navigation for Tabs and DropdownMenu, first NavMenu coverage, axe over an open dropdown menu and popover, standalone axe cases for the layout components, and a full-barrel export parity check.

Badge sizing:

- Badges are now unmistakably inert next to controls. Previously a `.ldt-badge` was a square, stroked box with the same type as `.ldt-button`, so at a matched height the two were told apart only on hover. A badge now carries the pill silhouette (new `--loidolt-border-radius-pill` token — the system stays square everywhere else, which is what makes the shape read), a recessed `--loidolt-surface-sunken` fill instead of a raised one, the wider `--loidolt-font-tracking-wide` label tracking, and type that stays one step under button type at every size. `textMuted` over `surfaceSunken` is now asserted at WCAG AA in both themes.
- `Badge` takes a `size` prop (`inline | sm | md | lg`, new `BadgeSize` type). It defaults to `inline`, which keeps today's compact chip metrics for table cells and running copy; the `sm`/`md`/`lg` steps match `.ldt-button--sm` / `.ldt-button` / `.ldt-button--lg`, so a badge placed in a cluster of controls lines up with them instead of rendering at roughly half their height. The catalog's action rows (`Export` / `Cancel` / `Live`, and the overlay demo's selected-action badge) now pass `size="md"`.
