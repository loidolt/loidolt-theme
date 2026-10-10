import type { Snippet } from 'svelte';

/** Action colour set — anything the user can press. */
export type ActionVariant = 'default' | 'primary' | 'quiet' | 'danger' | 'ghost' | 'text';

/** Status colour set — anything that reports state. */
export type StatusVariant = 'info' | 'success' | 'warning' | 'error';

/** Badge spans both sets: neutral, brand accent, or a status. */
export type BadgeVariant = 'default' | 'accent' | StatusVariant;

/** Shared control scale. Dialogs extend it with `xl` and `full`. */
export type ControlSize = 'sm' | 'md' | 'lg';
/** `full` takes the viewport less a gutter — for editors and previews that need the room. */
export type DialogSize = ControlSize | 'xl' | 'full';

/**
 * Badges default to `inline`: a compact chip sized to the text it annotates, for table cells and
 * running copy. The `ControlSize` steps match the button scale so a badge standing in a row of
 * controls shares their height instead of floating at half of it.
 */
export type BadgeSize = 'inline' | ControlSize;

/** Column sort state. The values are `aria-sort`'s, so they go straight onto the `<th>`. */
export type SortDirection = 'ascending' | 'descending' | 'none';

/** Horizontal text alignment for a table column. */
export type ColumnAlign = 'start' | 'center' | 'end';

export type Placement = 'top' | 'right' | 'bottom' | 'left';
export type Alignment = 'start' | 'center' | 'end';
export type Orientation = 'horizontal' | 'vertical';
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** A selectable value with a human label. Used by Select, RadioGroup, Tabs and menus. */
export interface Option<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/** A labelled run of options: an `<optgroup>` in `Select`, a group heading in list popups. */
export interface OptionGroup<T extends string = string> {
  label: string;
  options: Option<T>[];
  /** Disables every option in the group. */
  disabled?: boolean;
}

/** An option with a secondary line, for choices that need a sentence of explanation. */
export interface ChoiceOption<T extends string = string> extends Option<T> {
  description?: string;
}

/** `Option` is the single vocabulary for choice lists; `NavItem` is kept as a readable alias. */
export type NavItem<T extends string = string> = Option<T>;

/**
 * One `Tabs` tab. The icon leads the label, and sits above it in the `rail` variant, where the
 * label is short; `description` says more on hover and to assistive technology.
 */
export interface TabItem<T extends string = string> extends Option<T> {
  icon?: Snippet;
  description?: string;
}

/** One step in a breadcrumb trail. The final crumb is the current page and takes no `href`. */
export interface Crumb {
  label: string;
  href?: string;
}

/** One `Accordion` panel: its heading and the value that identifies it. */
export interface Disclosure<T extends string = string> {
  value: T;
  title: string;
  disabled?: boolean;
}

/** A `DropdownMenu` row. Renders as a link when `href` is set. */
export interface MenuItem<T extends string = string> extends Option<T> {
  type?: 'item';
  href?: string;
  /** Trailing hint. Defaults to `shortcut` when that is set. */
  hint?: string;
  /**
   * The keyboard shortcut this action also has elsewhere in the app, in `aria-keyshortcuts`
   * syntax (`'Control+D'`). Announced with the item and shown as its hint. The menu does not
   * bind the key — your app does.
   */
  shortcut?: string;
  /** Styles the row as destructive. Pair it with a confirmation for anything irreversible. */
  destructive?: boolean;
  /** Leading visual. */
  icon?: Snippet;
  /** Draw a separator above this item. */
  separatorBefore?: boolean;
}

/** Rows under an optional heading, announced as one group. */
export interface MenuGroup<T extends string = string> {
  type: 'group';
  label?: string;
  items: MenuEntry<T>[];
  separatorBefore?: boolean;
}

/** A toggle that stays in the menu, e.g. "Show grid". Reported through `onCheckedChange`. */
export interface MenuCheckboxItem<T extends string = string> {
  type: 'checkbox';
  value: T;
  label: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  separatorBefore?: boolean;
}

/** A one-of-many choice inside a menu, e.g. a sort order. Reported through `onValueChange`. */
export interface MenuRadioGroup<T extends string = string> {
  type: 'radio';
  /** Identifies the group in `onValueChange`. */
  name: string;
  label?: string;
  value: T | '';
  options: Option<T>[];
  separatorBefore?: boolean;
}

/** A nested menu that opens beside its row. */
export interface MenuSub<T extends string = string> {
  type: 'sub';
  label: string;
  icon?: Snippet;
  disabled?: boolean;
  items: MenuEntry<T>[];
  separatorBefore?: boolean;
}

/** Anything `DropdownMenu`'s `items` can hold. A plain `MenuItem` needs no `type`. */
export type MenuEntry<T extends string = string> =
  MenuItem<T> | MenuGroup<T> | MenuCheckboxItem<T> | MenuRadioGroup<T> | MenuSub<T>;

/**
 * Payload of Bits UI's `child` snippet: spread `props` onto your own element to take over
 * rendering of a trigger without nesting an extra button inside it.
 */
export interface TriggerChildProps {
  props: Record<string, unknown>;
}
