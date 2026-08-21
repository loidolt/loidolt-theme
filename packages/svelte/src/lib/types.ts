import type { Snippet } from 'svelte';

/** Action colour set — anything the user can press. */
export type ActionVariant = 'default' | 'primary' | 'quiet' | 'danger' | 'ghost' | 'text';

/** Status colour set — anything that reports state. */
export type StatusVariant = 'info' | 'success' | 'warning' | 'error';

/** Badge spans both sets: neutral, brand accent, or a status. */
export type BadgeVariant = 'default' | 'accent' | StatusVariant;

/** Shared control scale. Dialogs extend it with `xl`. */
export type ControlSize = 'sm' | 'md' | 'lg';
export type DialogSize = ControlSize | 'xl';

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

/** `Option` is the single vocabulary for choice lists; `NavItem` is kept as a readable alias. */
export type NavItem<T extends string = string> = Option<T>;

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
  href?: string;
  /** Trailing hint, e.g. a keyboard shortcut. */
  hint?: string;
  /** Leading visual. */
  icon?: Snippet;
  /** Draw a separator above this item. */
  separatorBefore?: boolean;
}

/**
 * Payload of Bits UI's `child` snippet: spread `props` onto your own element to take over
 * rendering of a trigger without nesting an extra button inside it.
 */
export interface TriggerChildProps {
  props: Record<string, unknown>;
}
