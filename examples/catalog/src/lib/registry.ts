/**
 * What each component is for, and what a reader has to know that the prop table cannot say.
 * The prop tables themselves are generated from source — see `scripts/extract-props.mjs`.
 */
export interface Entry {
  /** URL segment and demo file name. */
  slug: string;
  /** Exported component name, and the key into the generated prop data. */
  name: string;
  group: Group;
  /** One line: what it is, and when to reach for it. */
  summary: string;
  /** Things worth knowing before using it — accessibility contracts, gotchas, related parts. */
  notes?: string[];
}

export const GROUPS = [
  'Actions',
  'Forms',
  'Surfaces',
  'Data',
  'Feedback',
  'Overlays',
  'Navigation',
  'Layout',
  'Theme',
] as const;

export type Group = (typeof GROUPS)[number];

export const entries: Entry[] = [
  {
    slug: 'button',
    name: 'Button',
    group: 'Actions',
    summary: 'Every pressable action, in six variants and three sizes.',
    notes: [
      'With `href` it renders an `<a>` and accepts anchor attributes; without one, a `<button>`. Button-only attributes on a link are a type error rather than silent junk.',
      '`loading` disables the press and announces through a persistently-mounted live region — a region mounted alongside its message is silent in most screen readers.',
      '`variant="text"` replaces the former `TextButton`.',
    ],
  },
  {
    slug: 'icon-button',
    name: 'IconButton',
    group: 'Actions',
    summary: 'A square button for a single glyph, named by its `label`.',
    notes: [
      '`label` becomes the accessible name. An icon button without one is an unnamed control.',
      'The icon itself is yours: the system ships no icon set and imposes no icon library.',
    ],
  },
  {
    slug: 'toggle-group',
    name: 'ToggleGroup',
    group: 'Actions',
    summary: 'A segmented control for a short, always-visible set of choices.',
    notes: [
      'Single mode is a radio group in behaviour and in markup; multiple mode is a row of pressed buttons.',
      'Reach for `Select` instead once the options stop being worth showing at all times.',
    ],
  },

  {
    slug: 'field',
    name: 'Field',
    group: 'Forms',
    summary: 'Label, description, and error wiring for one control.',
    notes: [
      'The `children` snippet receives `{ id, describedBy, invalid }` — spread those onto your control and the wiring is complete.',
      'Ids come from `$props.id()`, so server and client markup agree and hydration never re-labels a control.',
    ],
  },
  {
    slug: 'fieldset',
    name: 'Fieldset',
    group: 'Forms',
    summary: 'The same wiring for a group of related controls.',
    notes: [
      'The description and error hang off the `<fieldset>`: grouping context is announced once on entry, so a shared message stays shared.',
      'No `aria-invalid` — `role="group"` does not support it. The error carries `role="alert"`, and each invalid control marks itself.',
    ],
  },
  {
    slug: 'label',
    name: 'Label',
    group: 'Forms',
    summary: 'A standalone label for a control that `Field` does not wrap.',
  },
  {
    slug: 'input',
    name: 'Input',
    group: 'Forms',
    summary: 'The text input, in underlined and `boxed` forms.',
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    group: 'Forms',
    summary: 'Multi-line text, sharing the input treatment.',
  },
  {
    slug: 'number-field',
    name: 'NumberField',
    group: 'Forms',
    summary: 'A number input with clamped spin buttons.',
    notes: [
      'Clearing the field cannot wedge it: an empty value clamps back to `min`, or to zero when unbounded.',
      'At a bound the spin button goes `aria-disabled` rather than `disabled`, so it keeps focus instead of dropping it.',
    ],
  },
  {
    slug: 'select',
    name: 'Select',
    group: 'Forms',
    summary: 'A native select over an `Option[]`.',
    notes: ['The placeholder stays selectable unless the field is `required`.'],
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    group: 'Forms',
    summary: 'A checkbox with its label, including an indeterminate state.',
    notes: ['`class` lands on the `<label>`; use `inputClass` to reach the input.'],
  },
  {
    slug: 'radio-group',
    name: 'RadioGroup',
    group: 'Forms',
    summary: 'One choice from a small set, as native radios in a fieldset.',
  },
  {
    slug: 'switch',
    name: 'Switch',
    group: 'Forms',
    summary: 'An immediate on/off control for a setting that applies at once.',
    notes: [
      'Use it for settings that take effect immediately; a checkbox is right for something a submit button confirms.',
    ],
  },

  {
    slug: 'card',
    name: 'Card',
    group: 'Surfaces',
    summary: 'A titled block of content with an optional footer.',
  },
  {
    slug: 'panel',
    name: 'Panel',
    group: 'Surfaces',
    summary: 'A framed region for tool content — heavier than a card, quieter than a dialog.',
  },
  {
    slug: 'section',
    name: 'Section',
    group: 'Surfaces',
    summary: 'A titled page region with an actions slot.',
  },
  {
    slug: 'page-header',
    name: 'PageHeader',
    group: 'Surfaces',
    summary: 'The heading block at the top of a page.',
  },
  {
    slug: 'separator',
    name: 'Separator',
    group: 'Surfaces',
    summary: 'A rule between content, horizontal or vertical.',
  },
  {
    slug: 'badge',
    name: 'Badge',
    group: 'Surfaces',
    summary: 'A status chip that never reads as pressable.',
    notes: [
      'Defaults to `size="inline"`, scaled to the text it annotates. Standing in a row of controls, give it their size instead.',
      'The pill silhouette is the system’s only rounded corner, which is exactly what keeps it from reading as a button.',
    ],
  },

  {
    slug: 'table',
    name: 'Table',
    group: 'Data',
    summary: 'A scrollable data table with sorting, sticky headers, and an empty state.',
    notes: [
      'The scroll region carries `tabindex="0"`: without it a scrollable region is unreachable by keyboard.',
      '`sticky` needs a bounded container — set `--ldt-table-height`, or the page scrolls and nothing sticks.',
      'Pass `empty` only when there are no rows; the component cannot see inside `children` to count them.',
    ],
  },
  {
    slug: 'table-header',
    name: 'TableHeader',
    group: 'Data',
    summary: 'A `<th>` that can sort.',
    notes: [
      '`aria-sort` sits on the cell, where the spec puts it, while the press target is a real button inside it.',
      'Exactly one column should report a sort; leave every other at `none`.',
    ],
  },
  {
    slug: 'empty-state',
    name: 'EmptyState',
    group: 'Data',
    summary: 'The "nothing here yet" case, with a way out of it.',
    notes: ['An empty state without a next step is just a blank screen — give it an action.'],
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    group: 'Data',
    summary: 'Page controls over a total item count.',
    notes: [
      '`count` is the number of items, not the number of pages.',
      'The ellipsis is `aria-hidden`: read between page numbers it is noise, and the buttons either side already say where the trail jumps.',
    ],
  },

  {
    slug: 'alert',
    name: 'Alert',
    group: 'Feedback',
    summary: 'A persistent message about the state of the page.',
  },
  {
    slug: 'toast',
    name: 'Toast',
    group: 'Feedback',
    summary: 'A transient message about something that just happened.',
    notes: [
      '`createToaster()` owns the queue, the timers, and pause-on-hover.',
      '`ToastViewport` is the single live region — `Toast` carries no `role="status"`, so nothing is announced twice.',
    ],
  },
  {
    slug: 'toast-viewport',
    name: 'ToastViewport',
    group: 'Feedback',
    summary: 'The fixed live region toasts are announced from.',
  },
  {
    slug: 'progress',
    name: 'Progress',
    group: 'Feedback',
    summary: 'A determinate or indeterminate progress bar.',
    notes: ['`value={undefined}` is the indeterminate mode: no `aria-valuenow`, animated bar.'],
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    group: 'Feedback',
    summary: 'A small activity indicator.',
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    group: 'Feedback',
    summary: 'A placeholder block for content still loading.',
  },

  {
    slug: 'dialog',
    name: 'Dialog',
    group: 'Overlays',
    summary: 'A modal for a task the page cannot hold.',
    notes: [
      '`class` targets the portaled content, not the trigger. `triggerClass` styles the trigger, and `triggerChild` replaces it outright.',
      'Focus, portalling, dismissal, and the escape key come from Bits UI.',
    ],
  },
  {
    slug: 'alert-dialog',
    name: 'AlertDialog',
    group: 'Overlays',
    summary: 'A decision that has to be answered before anything else continues.',
    notes: [
      'No close affordance and no outside-click dismissal: a confirmation you can dismiss by missing is not one.',
      'Focus opens on Cancel, so a stray Enter cannot confirm a destructive action.',
      'Confirming closes the dialog. Work that has to keep it open can set the bindable `open` back to `true`.',
    ],
  },
  {
    slug: 'drawer',
    name: 'Drawer',
    group: 'Overlays',
    summary: 'A modal panel anchored to an edge — the narrow-viewport form of a sidebar.',
    notes: [
      '`--ldt-drawer-size` is the measure across the anchored edge, always capped so the scrim stays reachable.',
      'Same primitive as `Dialog`: focus is trapped, Escape closes, the page behind is inert.',
    ],
  },
  {
    slug: 'popover',
    name: 'Popover',
    group: 'Overlays',
    summary: 'Non-modal content anchored to a trigger.',
  },
  {
    slug: 'dropdown-menu',
    name: 'DropdownMenu',
    group: 'Overlays',
    summary: 'A menu of actions, from an items array or your own snippet.',
    notes: [
      'Shortcut hints are exposed to assistive tech, not `aria-hidden` — a shortcut nobody can hear may as well not exist.',
      'For checkbox items, radio items, or submenus, drop to the re-exported `DropdownMenuPrimitive`.',
    ],
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    group: 'Overlays',
    summary: 'A short hint attached to a control.',
    notes: [
      'Wrap the app once in `TooltipProvider` so skip-delay grouping works across every tooltip.',
      'The tooltip describes its trigger; it does not name it. Never put the only copy of a control’s name in one.',
    ],
  },
  {
    slug: 'tooltip-provider',
    name: 'TooltipProvider',
    group: 'Overlays',
    summary: 'App-level tooltip grouping and delays.',
  },

  {
    slug: 'topbar',
    name: 'Topbar',
    group: 'Navigation',
    summary: 'The application bar: brand, navigation, actions.',
  },
  {
    slug: 'brand',
    name: 'Brand',
    group: 'Navigation',
    summary: 'The product name and its context line.',
  },
  {
    slug: 'nav-menu',
    name: 'NavMenu',
    group: 'Navigation',
    summary: 'A topbar section that opens a menu of destinations.',
    notes: ['`active` marks the trigger with `aria-current="page"`, not just a class.'],
  },
  {
    slug: 'breadcrumbs',
    name: 'Breadcrumbs',
    group: 'Navigation',
    summary: 'The trail back up a hierarchy.',
    notes: [
      'The last crumb is the current page: never a link, and marked `aria-current="page"`.',
      'The separator is generated content, so it is never selected, copied, or read aloud.',
    ],
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    group: 'Navigation',
    summary: 'Switching between panels of one page.',
    notes: [
      'Defaults to the first tab, and falls back to it if the selected tab disappears — removing a tab cannot blank every panel.',
    ],
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    group: 'Navigation',
    summary: 'Collapsible sections, one at a time or many.',
    notes: [
      'Keep `headingLevel` in step with the surrounding outline: panels sit one level below the heading that introduces them.',
    ],
  },
  {
    slug: 'context-bar',
    name: 'ContextBar',
    group: 'Navigation',
    summary: 'The strip under the topbar saying where you are.',
  },

  {
    slug: 'app-shell',
    name: 'AppShell',
    group: 'Layout',
    summary: 'Header, main, footer — the outermost frame.',
    notes: ['`mainId` is the target for a skip link; the default is `main`.'],
  },
  {
    slug: 'workspace',
    name: 'Workspace',
    group: 'Layout',
    summary: 'The sidebar / canvas / inspector grid.',
    notes: [
      'Columns follow the panes that are actually rendered — no sidebar snippet, no sidebar column.',
      '`sidebarOpen` and `inspectorOpen` collapse a pane by leaving it unrendered, so nothing collapsed stays in the tab order.',
    ],
  },
  {
    slug: 'sidebar',
    name: 'Sidebar',
    group: 'Layout',
    summary: 'A complementary column beside the canvas.',
    notes: [
      '`label` only matters when several complementary regions need telling apart — for a single sidebar it just repeats the role.',
    ],
  },

  {
    slug: 'theme-toggle',
    name: 'ThemeToggle',
    group: 'Theme',
    summary: 'A compact icon button that cycles light / dark / system, wired to `createTheme()`.',
    notes: [
      'The icon and accessible name show the active preference; each press advances to the next one.',
      'Keep system in the cycle unless you have a reason not to: it lets the theme continue following the device preference.',
    ],
  },
];

export const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));

export const grouped = GROUPS.map((group) => ({
  group,
  items: entries.filter((entry) => entry.group === group),
})).filter((section) => section.items.length > 0);
