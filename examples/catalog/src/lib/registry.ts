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
  'Media',
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
    slug: 'list-row',
    name: 'ListRow',
    group: 'Actions',
    summary: 'A pressable row: hover surface, optional selected state, link or button by `href`.',
    notes: [
      '`selected` maps to `aria-current` on links and `aria-pressed` on buttons.',
      'The row is transparent until hovered — it belongs in lists and rails, not as a standalone button.',
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
      '`nullable` lets the field be empty: clearing it yields `null` instead of the low bound. Type the bound variable as `number | null`.',
      '`readonly` locks the steppers too; `hideSteppers` drops them for dense tables. The arrow keys still step.',
    ],
  },
  {
    slug: 'select',
    name: 'Select',
    group: 'Forms',
    summary: 'A native select over an `Option[]`.',
    notes: [
      'The placeholder stays selectable unless the field is `required`.',
      'Pass `{ label, options }` entries to group options under native `<optgroup>` headings.',
    ],
  },
  {
    slug: 'combobox',
    name: 'Combobox',
    group: 'Forms',
    summary: 'A searchable single choice: type to narrow a long list, then pick with the keyboard.',
    notes: [
      "Options may be grouped under headings, as `{ label, options }` entries. A group's `disabled` disables every option in it.",
      'Typing filters on the label, ignoring case and accents. For a server search, set `filter={false}` and fetch in `onQueryChange`, with `queryDebounce` to spare the server; show `loading` meanwhile.',
      'The result count is announced as the list narrows, through a live region that stays mounted.',
      'Closing the list restores the selected label, so half-typed text never passes for the value.',
      'Rest props land on the text input, so it wires into `Field` like any control.',
    ],
  },
  {
    slug: 'multi-select',
    name: 'MultiSelect',
    group: 'Forms',
    summary: 'A searchable multiple choice whose picks show as removable chips.',
    notes: [
      'The search clears after each pick so the next one can be typed straight away.',
      'Backspace in the empty search removes the last chip. Removing a chip with its button moves focus to the next chip, or back to the input.',
      'Once `max` is reached the remaining options disable, and screen readers are told why.',
      'Chips are square because they are pressable; the pill shape is reserved for badges.',
    ],
  },
  {
    slug: 'slider',
    name: 'Slider',
    group: 'Forms',
    summary: 'A value, or a range between two thumbs, chosen along a track.',
    notes: [
      'Pass an array to `value` for a range; each entry gets a thumb, named from `label` by `thumbLabel`.',
      '`formatValue` feeds both the visible readout and `aria-valuetext`, so put the units there.',
      'Use `onValueCommit` to save: it fires once when a drag ends, while `onValueChange` fires throughout.',
      'On touch screens each thumb has an invisible 44px target, so its drawn size stays compact.',
    ],
  },
  {
    slug: 'password-input',
    name: 'PasswordInput',
    group: 'Forms',
    summary: 'A password field with a button that reveals what was typed.',
    notes: [
      'The reveal button keeps one name and reports its state with `aria-pressed`. Changing the name as well would announce the state twice.',
      'Defaults to `autocomplete="current-password"`; set `new-password` on sign-up and reset forms so password managers offer to generate one.',
    ],
  },
  {
    slug: 'otp-input',
    name: 'OTPInput',
    group: 'Forms',
    summary: 'A one-time code entered into a row of square cells.',
    notes: [
      'One real input sits under the cells, so paste, autofill from SMS (`autocomplete="one-time-code"`) and screen readers all see a single field.',
      'Spaces and dashes are removed from a pasted code. `type="numeric"` accepts digits and opens the number pad.',
      '`onComplete` fires with the code once every cell is filled — the moment to submit.',
    ],
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
    notes: [
      "An option's `description` renders under its label and is read after it through `aria-describedby`, not as part of its name.",
    ],
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
    slug: 'file-input',
    name: 'FileInput',
    group: 'Forms',
    summary: 'A file picker in the system\'s input clothes — Input cannot be `type="file"`.',
    notes: ['`onFiles` fires only when at least one file is chosen; `onchange` still forwards.'],
  },
  {
    slug: 'swatch-group',
    name: 'SwatchGroup',
    group: 'Forms',
    summary: 'A palette as a real radio group — one pressed swatch, arrow-key movement.',
    notes: [
      'Each swatch is a native radio with a visually hidden input, so keyboard and form semantics come from the platform.',
      'Name every color via `label` when the value alone would not identify it.',
    ],
  },

  {
    slug: 'card',
    name: 'Card',
    group: 'Surfaces',
    summary: 'A titled block of content with an optional footer.',
    notes: [
      'With `href` the whole card is one block-level link — the hover accent border says so.',
      'The content region is always full width, so intrinsic-less children (viewBox-only SVGs) fill the card even when a consumer centers it.',
    ],
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
    slug: 'thumbnail',
    name: 'Thumbnail',
    group: 'Surfaces',
    summary: 'A framed media box: fixed ratio, sunken or paper surface, contained content.',
    notes: [
      '`surface="paper"` stays white in every theme so artwork previews read true.',
      'Pass `children` instead of `src` for inline SVG or canvas content.',
      '`ratio` also takes the named frames (`photo`, `video`, `square`, `portrait`, `wide`). While the image loads the frame shimmers; if it fails, `fallback` (or an empty frame that still carries the alt text) takes its place.',
      '`srcset` and `sizes` serve responsive images; `overlay` layers a badge or duration over the corner.',
    ],
  },
  {
    slug: 'stat',
    name: 'Stat',
    group: 'Surfaces',
    summary: 'A dashboard tile: one hero number over a utility label, optionally a link.',
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    group: 'Surfaces',
    summary: 'A person or account, as a photo with initials to fall back on.',
    notes: [
      'The avatar has one accessible name, from `alt` or `name`, whether the photo or the initials are showing. Leave both unset when adjacent text already names the person.',
      'Sizes follow the control heights, so an avatar sits level with buttons of the same size.',
      '`delayMs` holds the initials back briefly, so a photo that loads quickly never flashes them first.',
    ],
  },
  {
    slug: 'badge',
    name: 'Badge',
    group: 'Surfaces',
    summary: 'A status chip that never reads as pressable.',
    notes: [
      'Defaults to `size="inline"`, scaled to the text it annotates. Standing in a row of controls, give it their size instead.',
      'The pill silhouette is the system’s only rounded corner, which is exactly what keeps it from reading as a button.',
      '`count` shows a number, capped at `max` as `99+`. Add `label` for the visually hidden context ("4" is heard as "4 unread comments"), and `live` when the count changes while the user watches.',
      "`dot` leads with a marker in the badge's colour.",
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
      'A trailing action cell takes `class="ldt-table__actions"`: right-aligned, nowrap, inline forms.',
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
    slug: 'data-table',
    name: 'DataTable',
    group: 'Data',
    summary:
      'A table driven by `createDataTable()`: sorting, search, filters, paging, selection and in-place editing.',
    notes: [
      'State lives in `createDataTable()`, not the component, so the search, filter, column and pagination parts all drive the same table — and you can read or change it from code.',
      'Pass `data` through a getter (`get data() { return rows; }`) to keep the table in step with changing rows.',
      'Paged or virtual, the table reports `aria-rowcount` and each row its `aria-rowindex`, so screen readers announce "row 27 of 43" rather than "row 2 of 8".',
      "`selection: 'multiple'` adds a checkbox column with a select-all that is indeterminate when some rows on the page are selected. `'single'` uses radios.",
      '`editable` columns become buttons that turn into a field: Enter or leaving saves through `onCellEdit`, Escape restores the old value.',
      '`hideBelow` drops a column on narrow screens while keeping it searchable and sortable. `virtual` renders only the rows in view; rows must have a fixed height and the wrapper needs `sticky` with `--ldt-table-height`.',
      'For server data set `manual` and `rowCount`, and fetch in the `on…Change` callbacks.',
    ],
  },
  {
    slug: 'data-table-search',
    name: 'DataTableSearch',
    group: 'Data',
    summary:
      'A search field bound to a data table — across every searchable column, or one `column`.',
    notes: [
      'Debounced by 200ms; raise `debounce` for a server search. The field re-syncs when the table is reset or cleared elsewhere.',
    ],
  },
  {
    slug: 'data-table-faceted-filter',
    name: 'DataTableFacetedFilter',
    group: 'Data',
    summary: 'A menu of checkboxes that filters a column to the chosen values, with counts.',
    notes: [
      'Counts come from rows passing every other filter, so each choice shows what picking it would add.',
      "Choices default to the column's `filterOptions`, else the distinct values in the data.",
    ],
  },
  {
    slug: 'data-table-column-visibility',
    name: 'DataTableColumnVisibility',
    group: 'Data',
    summary: "A menu that shows and hides a data table's columns.",
    notes: ['Columns with `hideable: false` are left out of the menu.'],
  },
  {
    slug: 'data-table-pagination',
    name: 'DataTablePagination',
    group: 'Data',
    summary: "A data table's footer: the visible range, rows per page, and the page trail.",
    notes: [
      'The range line is a polite status region, so paging or filtering is announced.',
      'Pass `pageSizes={[]}` to hide the rows-per-page picker.',
    ],
  },
  {
    slug: 'active-filter-chips',
    name: 'ActiveFilterChips',
    group: 'Data',
    summary: 'The filters narrowing a list, each removable on its own, with Clear all.',
    notes: [
      'Renders nothing when there are no filters and no `children`, so it can stay in the layout unconditionally.',
      'Removing a chip moves focus to the chip that took its place, else the one before, else the group, so keyboard users never land back on `<body>`.',
      'Label chips the way a user would say the filter aloud: "Status: Ready", not "ready".',
    ],
  },
  {
    slug: 'code-block',
    name: 'CodeBlock',
    group: 'Data',
    summary:
      'A monospace block for tokens and URLs — select-all by default, one-press copy on request.',
    notes: [
      'Copy success is announced through a persistently mounted status region.',
      'Clipboard access can be denied; the text stays selectable either way.',
    ],
  },
  {
    slug: 'comment-list',
    name: 'CommentList',
    group: 'Data',
    summary:
      'A message thread: author, meta line, pre-wrapped body, with optional numbered markers.',
    notes: [
      '`meta` is a preformatted string — the theme adds no timestamps or separators of its own.',
      '`activeId` is kept in view as it changes; `onItemHover` fires only for markered items, for syncing a canvas pin.',
    ],
  },
  {
    slug: 'record-stepper',
    name: 'RecordStepper',
    group: 'Data',
    summary:
      "Previous/next through an ordered set with an 'n of N' readout — Pagination's sibling for one-at-a-time review.",
    notes: ['`index` is 0-based; the readout and `format` receive it 1-based.'],
  },
  {
    slug: 'filmstrip',
    name: 'Filmstrip',
    group: 'Data',
    summary: 'A selectable rail of thumbnails — listbox semantics and scroll-into-view built in.',
    notes: [
      'Vertical rails flip horizontal on their own when the workspace container goes compact.',
      'Options are individually tabbable; a roving tabindex is deliberately deferred.',
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
      '`action` adds one follow-up button, such as Undo. It runs `onAction` and then dismisses the toast unless `dismiss: false`. Give an actionable toast time to be reached — at least ten seconds, or `duration: 0`.',
      '`toaster.update(id, patch)` changes a toast in place ("Uploading…" becoming "Uploaded"). `toaster.success/info/warning/error` are shortcuts; `error` stays until dismissed unless given a `duration`.',
    ],
  },
  {
    slug: 'toast-viewport',
    name: 'ToastViewport',
    group: 'Feedback',
    summary: 'The fixed live region toasts are announced from.',
    notes: ['`position` places the stack at any corner or at the top or bottom centre.'],
  },
  {
    slug: 'progress',
    name: 'Progress',
    group: 'Feedback',
    summary: 'A determinate or indeterminate progress bar.',
    notes: [
      '`value={undefined}` is the indeterminate mode: no `aria-valuenow`, animated bar.',
      '`formatValue` feeds both the visible `showValue` text and `aria-valuetext`, so "9 of 12 sheets" is heard instead of 75%.',
      '`variant` colours the bar by outcome; `size` sets its thickness.',
    ],
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    group: 'Feedback',
    summary: 'A small activity indicator.',
    notes: [
      'Without `size` it follows the surrounding font size, which suits a spinner inside a button.',
    ],
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    group: 'Feedback',
    summary: 'A placeholder block for content still loading.',
    notes: [
      '`variant` takes the shape of what it replaces: `text` (with `lines`), `title`, `avatar`, `button`, `card`.',
    ],
  },

  {
    slug: 'status-dot',
    name: 'StatusDot',
    group: 'Feedback',
    summary: 'A colored dot that reports state where a Badge is too loud, named by `label`.',
    notes: ['`label` is required: color alone must never carry the state.'],
  },
  {
    slug: 'live-region',
    name: 'LiveRegion',
    group: 'Feedback',
    summary: 'A status region that speaks changes to screen readers without moving focus.',
    notes: [
      'Mount it once and change `message`. A region inserted together with its text is silent in most screen readers.',
      'Pair it with `createAnnouncer()`, which clears the region between messages so a repeated message is still announced, and empties it again after `clearAfter` so no stale text lingers.',
      '`politeness="assertive"` interrupts the user — keep it for errors that need immediate attention.',
    ],
  },
  {
    slug: 'marker',
    name: 'Marker',
    group: 'Feedback',
    summary: 'A numbered accent chip — dot form for lists, pin form for points on a canvas.',
  },

  {
    slug: 'dialog',
    name: 'Dialog',
    group: 'Overlays',
    summary: 'A modal for a task the page cannot hold.',
    notes: [
      '`class` targets the portaled content, not the trigger. `triggerVariant`/`triggerSize` pick the button clothes; an explicit `triggerClass` wins wholesale, and `triggerChild` replaces the trigger outright.',
      'Focus, portalling, dismissal, and the escape key come from Bits UI.',
      '`header` replaces the visible title block; `title` is still required and stays the accessible name, visually hidden. `headerActions` sit beside the close button. `size="full"` takes the viewport less a gutter.',
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
      '`triggerVariant`/`triggerSize` pick the trigger button clothes; an explicit `triggerClass` wins wholesale.',
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
      '`triggerVariant`/`triggerSize` pick the trigger button clothes; an explicit `triggerClass` wins wholesale.',
    ],
  },
  {
    slug: 'popover',
    name: 'Popover',
    group: 'Overlays',
    summary: 'Non-modal content anchored to a trigger.',
    notes: [
      'The default trigger wears the quiet button; `triggerVariant`/`triggerSize` change that, and an explicit `triggerClass` wins wholesale.',
    ],
  },
  {
    slug: 'dropdown-menu',
    name: 'DropdownMenu',
    group: 'Overlays',
    summary: 'A menu of actions, from an items array or your own snippet.',
    notes: [
      'Shortcut hints are exposed to assistive tech, not `aria-hidden` — a shortcut nobody can hear may as well not exist.',
      'For checkbox items, radio items, or submenus, drop to the re-exported `DropdownMenuPrimitive`.',
      "`items` also takes `type: 'group'` (a heading over rows), `'checkbox'` (a toggle, reported through `onCheckedChange`), `'radio'` (one of many, through `onValueChange`) and `'sub'` (a nested menu) entries. Toggles and choices keep the menu open.",
      '`shortcut` sets `aria-keyshortcuts` and shows as the hint. The menu does not bind the key; your app does.',
      '`destructive` styles an item as danger. Pair it with a confirmation for anything irreversible.',
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
      '`arrow` points the tooltip at its trigger.',
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
    notes: [
      'Plain nav links take the `.ldt-topbar__link` class; the router marks the active page with `aria-current="page"`.',
    ],
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
    slug: 'skip-link',
    name: 'SkipLink',
    group: 'Navigation',
    summary:
      'The first focusable element on a page: jumps keyboard users past repeated navigation.',
    notes: [
      'Hidden until focused. Place it first in `<body>`, before the top bar.',
      'Activation also moves focus to the target (adding `tabindex="-1"` when it is not focusable), so the next Tab continues from the content rather than the top of the page.',
    ],
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
    slug: 'segmented-nav',
    name: 'SegmentedNav',
    group: 'Navigation',
    summary:
      "A segmented control whose options are real links — ToggleGroup's shape for navigation.",
    notes: [
      '`aria-current="page"` is both the semantic and the pressed style.',
      'Use ToggleGroup when the choice changes state on the page; use this when it navigates.',
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
      'The `header` snippet renders a full-width row above the panes — the home for a ContextBar or toolbar.',
      '`mainClass` styles the main pane without reaching into `.ldt-workspace__main` from outside.',
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
    slug: 'floating-bar',
    name: 'FloatingBar',
    group: 'Layout',
    summary:
      'A toolbar pinned to a corner of a positioned container — zoom controls, canvas actions.',
    notes: [
      'The parent must be `position: relative`; the bar is a pointer-events island above stage content.',
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
  {
    slug: 'aspect-ratio',
    name: 'AspectRatio',
    group: 'Layout',
    summary:
      'A box that keeps its shape — `video`, `photo`, `square`, `portrait`, `wide` or any ratio.',
    notes: [
      'Uses native `aspect-ratio`, so the space is reserved before the image or video inside has loaded, and the page does not jump.',
      'Images, videos and iframes placed directly inside fill the box.',
    ],
  },
  {
    slug: 'toolbar',
    name: 'Toolbar',
    group: 'Layout',
    summary:
      'A labelled row of list controls — search, filters, view options — with an end cluster.',
    notes: [
      'By default it is a labelled `group`: Tab moves between controls. That is right when it holds a text field or a control that owns its arrow keys, such as a `ToggleGroup`.',
      '`roving` makes it an ARIA `toolbar` with one tab stop; arrow keys move between the controls marked `data-roving-item`.',
    ],
  },
  {
    slug: 'filter-panel',
    name: 'FilterPanel',
    group: 'Layout',
    summary: 'A filter area that expands under its toggle, on an auto-fit grid.',
    notes: [
      'The toggle is yours: a `Button` with `aria-expanded` and `aria-controls` pointing at the panel `id`.',
      'Closed, the controls are `inert` — out of the tab order and the accessibility tree — while the height still animates.',
      'Set `--ldt-min` to change the column width. "Clear all" appears when `activeCount` is above zero and `onClear` is given.',
    ],
  },
  {
    slug: 'video-player',
    name: 'VideoPlayer',
    group: 'Media',
    summary:
      "A video with this system's controls: seek, volume, speed, captions, picture-in-picture and full screen.",
    notes: [
      'Every control is a native element — buttons, range inputs, a select — so keyboard and screen-reader support come from the platform. The seek bar speaks positions as words ("1 minute 5 seconds of 4 minutes").',
      'Shortcuts work while focus is in the player: Space or K plays, the arrows seek and change volume, M mutes, F goes full screen, C toggles captions.',
      'Provide `tracks` with captions for any video with speech (WCAG 1.2.2).',
      'An `.m3u8` source plays as HLS — natively in Safari, elsewhere through hls.js once you register it with `setHlsLoader()`. hls.js is an optional peer, so apps that never stream do not ship it.',
      '`controls="native"` hands over to the browser\'s controls; `autoplay` implies `muted`, as browsers require.',
    ],
  },
  {
    slug: 'audio-player',
    name: 'AudioPlayer',
    group: 'Media',
    summary: 'Audio with a title, artist, artwork and the shared control bar.',
    notes: ['The title names the player for assistive tech; artwork is decorative.'],
  },
  {
    slug: 'media-embed',
    name: 'MediaEmbed',
    group: 'Media',
    summary: 'A YouTube or Vimeo video behind a click-to-load facade.',
    notes: [
      'Nothing is requested from the provider until the user presses play, and then only from its no-tracking host (`youtube-nocookie.com`, Vimeo with `dnt=1`).',
      'No thumbnail is fetched from the provider by default, since that request alone would reveal the visit; pass a `poster` of your own, or `embedThumbnail()` if the request is acceptable.',
      'Once loaded, focus moves into the player so keyboard users carry on where the button was. `title` names both the button and the iframe.',
    ],
  },
  {
    slug: 'media-grid',
    name: 'MediaGrid',
    group: 'Media',
    summary: 'A gallery of images, videos, audio and embeds that opens each in a `Lightbox`.',
    notes: [
      'One tab stop for the whole gallery: arrow keys, Home and End move between tiles.',
      'Tiles for video and audio say so, visibly and in their accessible names.',
      '`variant="masonry"` keeps each image\'s own shape in columns; `minColumnWidth` sets how narrow a column may get.',
    ],
  },
  {
    slug: 'lightbox',
    name: 'Lightbox',
    group: 'Media',
    summary: 'A full-screen viewer for a list of media, with zoom, swipe and thumbnails.',
    notes: [
      'Arrow keys, Home and End move between items; + and − zoom an image, 0 resets it. Pinch, Ctrl + wheel and double-click zoom too, and dragging pans a zoomed image.',
      'Swipe to move on when the image is not zoomed. The next and previous images are loaded ahead of time.',
      'Each move is announced once ("Canyon relief, cork, 2 of 6") through a live region; the visible counter is hidden from assistive tech so it is not read twice.',
      'Videos, audio and embeds play in place with their own controls.',
    ],
  },
  {
    slug: 'media-carousel',
    name: 'MediaCarousel',
    group: 'Media',
    summary: 'A slideshow showing one item at a time, following the WAI-ARIA carousel pattern.',
    notes: [
      'Slides are named groups ("2 of 5: Canyon relief"). The slide area is a polite live region while the user drives it, and silent while it rotates on its own.',
      '`autoplay` pauses while the pointer or focus is inside, always offers a pause button (WCAG 2.2.2), and starts paused when the user prefers reduced motion.',
    ],
  },
];

export const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));

export const grouped = GROUPS.map((group) => ({
  group,
  items: entries.filter((entry) => entry.group === group),
})).filter((section) => section.items.length > 0);
