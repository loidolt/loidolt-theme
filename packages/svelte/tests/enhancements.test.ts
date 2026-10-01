import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Badge from '../src/lib/components/Badge.svelte';
import Dialog from '../src/lib/components/Dialog.svelte';
import DropdownMenu from '../src/lib/components/DropdownMenu.svelte';
import NumberField from '../src/lib/components/NumberField.svelte';
import Progress from '../src/lib/components/Progress.svelte';
import RadioGroup from '../src/lib/components/RadioGroup.svelte';
import Select from '../src/lib/components/Select.svelte';
import Skeleton from '../src/lib/components/Skeleton.svelte';
import Spinner from '../src/lib/components/Spinner.svelte';
import Toast from '../src/lib/components/Toast.svelte';
import ToastViewport from '../src/lib/components/ToastViewport.svelte';
import Tooltip from '../src/lib/components/Tooltip.svelte';
import { createToaster } from '../src/lib/toaster.svelte.js';
import type { MenuEntry } from '../src/lib/types.js';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

/** Floating content stays hidden from name computation in jsdom; match on text instead. */
async function popupItem(name: string, role = 'menuitem') {
  const label = await screen.findByText(name);
  const item = label.closest(`[role="${role}"]`);
  expect(item, `no [role="${role}"] around "${name}"`).not.toBeNull();
  return item as HTMLElement;
}

describe('Select groups', () => {
  it('renders groups as native optgroups', () => {
    render(Select, {
      label: 'Stock',
      options: [
        { value: 'birch', label: 'Birch ply' },
        { label: 'Acrylic', options: [{ value: 'clear', label: 'Clear acrylic' }] },
        { label: 'Retired', disabled: true, options: [{ value: 'mdf', label: 'MDF' }] },
      ],
    });
    const groups = document.querySelectorAll('optgroup');
    expect([...groups].map((group) => group.label)).toEqual(['Acrylic', 'Retired']);
    expect(groups[1]).toBeDisabled();
    expect(within(screen.getByRole('combobox')).getAllByRole('option')).toHaveLength(3);
  });
});

describe('DropdownMenu entries', () => {
  const items: MenuEntry[] = [
    {
      type: 'group',
      label: 'Edit',
      items: [
        { value: 'duplicate', label: 'Duplicate', shortcut: 'Control+D' },
        { value: 'rename', label: 'Rename', hint: 'F2', shortcut: 'F2' },
      ],
    },
    { type: 'checkbox', value: 'grid', label: 'Show grid', checked: true, separatorBefore: true },
    {
      type: 'radio',
      name: 'sort',
      label: 'Sort by',
      value: 'name',
      options: [
        { value: 'name', label: 'Name' },
        { value: 'date', label: 'Date' },
      ],
    },
    {
      type: 'sub',
      label: 'Export as',
      items: [
        { value: 'svg', label: 'SVG' },
        { value: 'pdf', label: 'PDF' },
      ],
    },
    { value: 'delete', label: 'Delete', destructive: true, separatorBefore: true },
  ];

  it('announces shortcuts and marks destructive rows', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(DropdownMenu, { trigger: text('Actions'), items, onSelect });
    await user.click(screen.getByRole('button', { name: 'Actions' }));

    const duplicate = await popupItem('Duplicate');
    expect(duplicate).toHaveAttribute('aria-keyshortcuts', 'Control+D');
    expect(duplicate).toHaveTextContent('Control+D');
    expect(await popupItem('Rename')).toHaveTextContent('F2');
    expect(screen.getByText('Edit').closest('[data-dropdown-menu-group]')).not.toBeNull();

    const remove = await popupItem('Delete');
    expect(remove).toHaveClass('ldt-menu__item--danger');
    await user.click(remove);
    expect(onSelect).toHaveBeenCalledWith('delete');
  });

  it('toggles checkbox items and chooses radio items without closing', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const onValueChange = vi.fn();
    render(DropdownMenu, { trigger: text('View'), items, onCheckedChange, onValueChange });
    await user.click(screen.getByRole('button', { name: 'View' }));

    const grid = await popupItem('Show grid', 'menuitemcheckbox');
    expect(grid).toHaveAttribute('aria-checked', 'true');
    await user.click(grid);
    expect(onCheckedChange).toHaveBeenCalledWith('grid', false);

    const date = await popupItem('Date', 'menuitemradio');
    expect(date).toHaveAttribute('aria-checked', 'false');
    await user.click(date);
    expect(onValueChange).toHaveBeenCalledWith('sort', 'date');
    // Still open: toggles and choices are made in place.
    expect(await popupItem('Name', 'menuitemradio')).toBeInTheDocument();
  });

  it('opens a submenu beside its row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(DropdownMenu, { trigger: text('File'), items, onSelect });
    await user.click(screen.getByRole('button', { name: 'File' }));
    const sub = await popupItem('Export as');
    expect(sub).toHaveAttribute('aria-haspopup', 'menu');
    await user.hover(sub);
    await user.click(await popupItem('PDF'));
    expect(onSelect).toHaveBeenCalledWith('pdf');
  });
});

describe('createToaster additions', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('offers status shortcuts, keeping errors until dismissed', () => {
    const toaster = createToaster({ duration: 1000 });
    toaster.success('Saved');
    toaster.info('Syncing', { description: 'Three files' });
    toaster.warning('Low stock');
    toaster.error('Export failed');
    expect(toaster.toasts.map((toast) => toast.variant)).toEqual([
      'success',
      'info',
      'warning',
      'error',
    ]);
    vi.advanceTimersByTime(1000);
    expect(toaster.toasts.map((toast) => toast.title)).toEqual(['Export failed']);

    toaster.error('Retrying', { duration: 500 });
    vi.advanceTimersByTime(500);
    expect(toaster.toasts.map((toast) => toast.title)).toEqual(['Export failed']);
  });

  it('updates a toast in place and restarts its timer on a new duration', () => {
    const toaster = createToaster();
    const id = toaster.info('Uploading…');
    expect(toaster.update(id, { title: 'Uploaded', variant: 'success', duration: 300 })).toBe(true);
    expect(toaster.toasts[0]).toMatchObject({ id, title: 'Uploaded', variant: 'success' });
    vi.advanceTimersByTime(300);
    expect(toaster.toasts).toHaveLength(0);
    expect(toaster.update(id, { title: 'Gone' })).toBe(false);
  });

  it('keeps an updated duration paused while paused, and rejects a bad one', () => {
    const toaster = createToaster();
    const id = toaster.push({ title: 'Working' });
    toaster.pause();
    toaster.update(id, { duration: 200 });
    vi.advanceTimersByTime(1000);
    expect(toaster.toasts).toHaveLength(1);
    toaster.resume();
    vi.advanceTimersByTime(200);
    expect(toaster.toasts).toHaveLength(0);

    const other = toaster.push({ title: 'Other' });
    expect(() => toaster.update(other, { duration: -1 })).toThrow(RangeError);
  });
});

describe('Toast actions', () => {
  it('runs the action, then dismisses unless told not to', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const { unmount } = render(Toast, {
      title: 'Sheet deleted',
      action: { label: 'Undo', onAction },
      onDismiss,
      duration: 5000,
    });
    expect(document.querySelector('.ldt-toast')).not.toHaveAttribute('duration');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
    unmount();

    render(Toast, {
      title: 'Sync paused',
      action: { label: 'Resume', onAction, dismiss: false },
      onDismiss,
    });
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('accepts a custom action area and a viewport position', () => {
    render(ToastViewport, {
      position: 'top-center',
      children: createRawSnippet(() => ({ render: () => '<div>toasts</div>' })),
    });
    expect(screen.getByRole('log')).toHaveClass('ldt-toast-viewport--top-center');
    render(Toast, { title: 'Ready', actions: text('Open') });
    expect(document.querySelector('.ldt-toast__actions')).toHaveTextContent('Open');
  });
});

describe('Dialog header', () => {
  it('keeps the title as the accessible name behind a custom header', async () => {
    render(Dialog, {
      open: true,
      title: 'Proof sheet',
      description: 'Check before cutting.',
      header: text('Custom heading'),
      headerActions: text('Pop out'),
      size: 'full',
      children: text('Body'),
    });
    const dialog = await screen.findByRole('dialog', { name: 'Proof sheet' });
    expect(dialog).toHaveClass('ldt-dialog--full');
    expect(within(dialog).getByText('Proof sheet')).toHaveClass('ldt-sr-only');
    expect(within(dialog).getByText('Custom heading')).toBeInTheDocument();
    expect(dialog.querySelector('.ldt-dialog__actions')).toHaveTextContent('Pop out');
  });
});

describe('Badge additions', () => {
  it('caps counts, adds context, and can announce changes', () => {
    render(Badge, { count: 140, label: 'unread messages', live: true, dot: true });
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('99+ unread messages');
    expect(badge.querySelector('.ldt-badge__dot')).toHaveAttribute('aria-hidden', 'true');
    render(Badge, { count: 7, max: 9 });
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

describe('RadioGroup descriptions', () => {
  it('describes each option by its own sentence', () => {
    render(RadioGroup, {
      label: 'Finish',
      options: [
        { value: 'raw', label: 'Raw', description: 'Straight off the laser.' },
        { value: 'oiled', label: 'Oiled' },
      ],
    });
    const raw = screen.getByRole('radio', { name: 'Raw' });
    expect(raw).toHaveAccessibleDescription('Straight off the laser.');
    expect(screen.getByRole('radio', { name: 'Oiled' })).not.toHaveAttribute('aria-describedby');
  });
});

describe('NumberField additions', () => {
  it('can be emptied to null and steps from the low bound', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(NumberField, { label: 'Copies', value: 3, min: 1, nullable: true, onValueChange });
    const input = screen.getByRole('spinbutton', { name: 'Copies' });
    await user.clear(input);
    input.blur();
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await user.click(screen.getByRole('button', { name: 'Increase Copies' }));
    expect(onValueChange).toHaveBeenLastCalledWith(1);
  });

  it('locks the steppers when read-only and can hide them', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(NumberField, { label: 'Sheets', value: 2, readonly: true, onValueChange });
    const increase = screen.getByRole('button', { name: 'Increase Sheets' });
    expect(increase).toHaveAttribute('aria-disabled', 'true');
    await user.click(increase);
    expect(onValueChange).not.toHaveBeenCalled();

    render(NumberField, { label: 'Rows', value: 2, hideSteppers: true });
    expect(screen.queryByRole('button', { name: 'Increase Rows' })).not.toBeInTheDocument();
    expect(document.querySelector('.ldt-number-field--bare')).not.toBeNull();
  });
});

describe('Tooltip arrow', () => {
  it('draws an arrow inside the open tooltip', async () => {
    render(Tooltip, { open: true, content: 'Snap to grid', trigger: text('?'), arrow: true });
    flushSync();
    expect(await screen.findByText('Snap to grid')).toBeInTheDocument();
    expect(document.querySelector('.ldt-tooltip__arrow')).not.toBeNull();
  });
});

describe('Progress additions', () => {
  it('speaks and shows a formatted value, with status and size', () => {
    render(Progress, {
      label: 'Cutting',
      value: 3,
      max: 12,
      variant: 'success',
      size: 'lg',
      showValue: true,
      formatValue: (value: number, max: number) => `${value} of ${max} sheets`,
    });
    const bar = screen.getByRole('progressbar', { name: 'Cutting' });
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 12 sheets');
    expect(bar).toHaveClass('ldt-progress--success', 'ldt-progress--lg');
    expect(document.querySelector('.ldt-progress-field__value')).toHaveTextContent(
      '3 of 12 sheets'
    );
  });

  it('defaults to a whole percentage and says nothing while indeterminate', () => {
    render(Progress, { value: 1, max: 3, showValue: true });
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuetext');
    expect(document.querySelector('.ldt-progress-field__value')).toHaveTextContent('33%');
    render(Progress, { label: 'Waiting', showValue: true });
    expect(screen.getByRole('progressbar', { name: 'Waiting' })).not.toHaveAttribute(
      'aria-valuenow'
    );
  });
});

describe('Skeleton and Spinner shapes', () => {
  it('stands in with the metrics of what it replaces', () => {
    const { container } = render(Skeleton, { variant: 'text', lines: 3 });
    const lines = container.querySelectorAll('.ldt-skeleton--text');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toHaveStyle({ width: '60%' });
    render(Skeleton, { variant: 'avatar' });
    expect(document.querySelector('.ldt-skeleton--avatar')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sizes the spinner on request', () => {
    render(Spinner, { size: 'lg' });
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('ldt-spinner--lg');
  });
});
