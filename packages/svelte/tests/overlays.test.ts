import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import AlertDialog from '../src/lib/components/AlertDialog.svelte';
import DropdownMenu from '../src/lib/components/DropdownMenu.svelte';
import Popover from '../src/lib/components/Popover.svelte';
import Tabs from '../src/lib/components/Tabs.svelte';
import Tooltip from '../src/lib/components/Tooltip.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

/**
 * Floating content keeps `visibility: hidden` until Floating UI measures it, and jsdom never
 * lays anything out. That hides the subtree from accessible-name computation, so inside a
 * portaled popup we match on text and walk up to the role instead of querying by name.
 */
async function popupItem(name: string, role = 'menuitem') {
  const label = await screen.findByText(name);
  const item = label.closest(`[role="${role}"]`);
  expect(item, `no [role="${role}"] around "${name}"`).not.toBeNull();
  return item as HTMLElement;
}

describe('Popover', () => {
  it('opens from its trigger and closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Popover, {
      trigger: text('Project details'),
      children: text('<p>Crater Lake</p>'),
      onOpenChange,
    });

    await user.click(screen.getByRole('button', { name: 'Project details' }));
    expect(screen.getByText('Crater Lake')).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Crater Lake')).not.toBeInTheDocument();
  });

  it('lets the trigger class be replaced', () => {
    render(Popover, {
      trigger: text('Details'),
      children: text('body'),
      triggerClass: 'custom-trigger',
    });
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toHaveClass('custom-trigger');
    expect(trigger).not.toHaveClass('ldt-button');
  });

  it('forwards rest props to the portaled content', async () => {
    const user = userEvent.setup();
    render(Popover, {
      trigger: text('Details'),
      children: text('body'),
      'data-testid': 'details-popover',
    });
    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByTestId('details-popover')).toHaveClass('ldt-popover');
  });
});

describe('DropdownMenu', () => {
  const items = [
    { value: 'new', label: 'New document' },
    { value: 'archive', label: 'Archive', separatorBefore: true },
  ];

  it('reports the selected item', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(DropdownMenu, { trigger: text('File'), items, onSelect });

    await user.click(screen.getByRole('button', { name: 'File' }));
    await user.click(await popupItem('Archive'));
    expect(onSelect).toHaveBeenCalledWith('archive');
  });

  it('associates the group heading with its items', async () => {
    const user = userEvent.setup();
    render(DropdownMenu, { trigger: text('File'), items, groupLabel: 'Document' });

    await user.click(screen.getByRole('button', { name: 'File' }));
    const heading = await screen.findByText('Document');
    const group = heading.closest('[data-dropdown-menu-group]');

    // A standalone heading is not associated with anything; it has to label its own group.
    expect(group).not.toBeNull();
    expect(group).toHaveAttribute('aria-labelledby', heading.id);
    expect(group?.querySelectorAll('[role="menuitem"]')).toHaveLength(items.length);
  });

  it('renders links for items that carry an href', async () => {
    const user = userEvent.setup();
    render(DropdownMenu, {
      trigger: text('File'),
      items: [{ value: 'docs', label: 'Documentation', href: '/docs' }],
    });
    await user.click(screen.getByRole('button', { name: 'File' }));
    expect(await popupItem('Documentation')).toHaveAttribute('href', '/docs');
  });
});

describe('Tooltip', () => {
  it('leaves the trigger accessible name alone', async () => {
    render(Tooltip, { content: 'Precise settings', trigger: text('Settings') });
    const trigger = screen.getByRole('button', { name: 'Settings' });
    // Forcing `aria-label={content}` here used to clobber the trigger's own name.
    expect(trigger).not.toHaveAttribute('aria-label');
  });

  it('names an icon-only trigger when asked explicitly', () => {
    render(Tooltip, { content: 'Precise settings', trigger: text('⚙'), triggerLabel: 'Settings' });
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('describes the trigger when open', async () => {
    const user = userEvent.setup();
    render(Tooltip, { content: 'Precise settings', trigger: text('Settings'), delayDuration: 0 });
    await user.hover(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByText('Precise settings')).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'tokens', label: 'Tokens' },
  ];

  it('selects the first tab so a panel always renders', () => {
    render(Tabs, { tabs, children: createRawSnippet(() => ({ render: () => 'Panel' })) });
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tabpanel').length).toBeGreaterThan(0);
  });

  it('reports value changes once per switch', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Tabs, {
      tabs,
      onValueChange,
      children: createRawSnippet(() => ({ render: () => 'Panel' })),
    });
    await user.click(screen.getByRole('tab', { name: 'Tokens' }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('tokens');
  });
});

describe('Tabs orientation', () => {
  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'tokens', label: 'Tokens' },
  ];

  it('propagates the orientation Bits keys its data attributes off', () => {
    const { container } = render(Tabs, {
      tabs,
      orientation: 'vertical',
      children: createRawSnippet(() => ({ render: () => 'Panel' })),
    });
    expect(container.querySelector('.ldt-tabs')).toHaveAttribute('data-orientation', 'vertical');
    expect(container.querySelector('.ldt-tabs__list')).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
  });

  it('ships styles for that orientation rather than leaving the prop inert', () => {
    const css = readFileSync(
      path.join(process.cwd(), '..', 'styles', 'src', 'components.css'),
      'utf8'
    );
    for (const selector of ['.ldt-tabs', '.ldt-tabs__list', '.ldt-tabs__trigger']) {
      expect(css, selector).toContain(`${selector}[data-orientation='vertical']`);
    }
  });
});

describe('AlertDialog', () => {
  const open = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    return screen.getByRole('alertdialog', { name: 'Delete terrain.svg?' });
  };

  const props = (extra: Record<string, unknown>) => ({
    title: 'Delete terrain.svg?',
    description: 'This cannot be undone.',
    trigger: text('<span>Delete</span>'),
    confirmLabel: 'Delete file',
    confirmVariant: 'danger' as const,
    ...extra,
  });

  it('confirms through its action button and closes', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(AlertDialog, props({ onConfirm }));

    const dialog = await open(user);
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');

    await user.click(screen.getByRole('button', { name: 'Delete file' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('cancels without confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(AlertDialog, props({ onConfirm, onCancel }));

    await open(user);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('offers no dismiss affordance beyond the two answers', () => {
    render(AlertDialog, { title: 'Discard changes?', open: true });

    // No close "×": a confirmation you can dismiss by missing is not a confirmation.
    const buttons = screen.getAllByRole('button').map((button) => button.textContent?.trim());
    expect(buttons).toEqual(['Cancel', 'Confirm']);
  });

  it('colours the confirm button by variant', () => {
    render(AlertDialog, { title: 'Delete?', open: true, confirmVariant: 'danger' });
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveClass('ldt-button--danger');
  });

  it('leaves the default variant unmodified, like Button does', () => {
    render(AlertDialog, { title: 'Continue?', open: true, confirmVariant: 'default' });
    expect(screen.getByRole('button', { name: 'Confirm' }).className).toBe('ldt-button');
  });
});
