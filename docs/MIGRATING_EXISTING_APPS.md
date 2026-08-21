# Migrating existing applications

Topostack and Label Studio are the visual source material for this package. Adoption should be a
small, behavior-preserving extraction rather than an application redesign.

## 1. Add the foundation

Install `@loidolt/theme-svelte` and import its stylesheet before application-specific CSS:

```css
@import '@loidolt/theme-svelte/styles.css';
@import './application.css';
```

Delete duplicated `@font-face`, reset, and root palette declarations after verifying computed
values. Existing selectors may temporarily map old variables to the new contract. Prefer the
semantic tier — it names the role a colour plays, so a later dark mode needs no further edits:

```css
:root {
  --paper: var(--loidolt-background);
  --panel: var(--loidolt-surface);
  --deep: var(--loidolt-text);
  --muted: var(--loidolt-text-muted);
  --line: var(--loidolt-border);
  --orange: var(--loidolt-accent);
}
```

The primitives (`--loidolt-color-paper`, `--loidolt-color-deep`, …) remain available for cases
where an application genuinely wants a fixed value rather than a role.

## 2. Replace shared chrome first

Migrate `Topbar`, `Brand`, and `ContextBar`, then compose `Workspace` and `Sidebar`. Keep project
state, generation, persistence, authentication, and route behavior in the application. The theme
owns only presentation and local interaction contracts.

```svelte
<Topbar>
  {#snippet brand()}<Brand name="Label Studio" />{/snippet}
  {#snippet navigation()}<!-- application mode controls -->{/snippet}
  {#snippet actions()}<!-- application commands -->{/snippet}
</Topbar>
<ContextBar section="Design" title={document.name} detail={status} />
```

## 3. Replace controls incrementally

Start with `Button`, `Field`, `Input`, `Select`, and `Switch`. Preserve existing values and event
handlers; the components support bindable state and explicit change callbacks. Use `Field` to
connect labels, hints, and validation messages consistently.

Change callbacks are camelCase (`onValueChange`, `onCheckedChange`, `onOpenChange`, `onSelect`,
`onDismiss`), which leaves the native `oninput`/`onchange`/`onclick` names free — pass those
through as well and both fire. Every component also exposes `bind:ref` when an application needs
the DOM node (focus management, measurement, third-party integrations).

## 4. Keep domain UI local

Map canvases, vector selection handles, layer editors, fabrication previews, export bridges,
document models, and auth state do not belong in the theme. Style them with public tokens and
promote a pattern only after at least two applications need the same interface and behavior.

## Verification

- Compare the existing and migrated application at desktop and narrow viewport widths.
- Toggle a `data-theme` block that redefines the semantic tier to confirm nothing in the
  application still reaches past it to a primitive.
- Navigate every migrated control using only the keyboard.
- Confirm focus returns correctly after closing menus and dialogs.
- Check error, disabled, loading, and empty states before removing legacy CSS.
- Remove old selectors only after the application has no remaining references.
