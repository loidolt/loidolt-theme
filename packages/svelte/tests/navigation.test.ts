import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import DropdownMenu from '../src/lib/components/DropdownMenu.svelte';
import NavMenu from '../src/lib/components/NavMenu.svelte';
import Tabs from '../src/lib/components/Tabs.svelte';

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

const tabPanel = createRawSnippet<[{ value: string }]>((args) => ({
  render: () => `<p>Panel ${args().value}</p>`,
}));

const tabs = [
  { value: 'design', label: 'Design' },
  { value: 'proof', label: 'Proof' },
  { value: 'export', label: 'Export' },
];

describe('Tabs', () => {
  it('selects the first tab by default, including for a bound parent', () => {
    render(Tabs, { label: 'Views', tabs, children: tabPanel });
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel design')).toBeVisible();
  });

  it('moves selection with arrow keys', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Tabs, { label: 'Views', tabs, children: tabPanel, onValueChange });

    await user.click(screen.getByRole('tab', { name: 'Design' }));
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('proof');
    expect(screen.getByRole('tab', { name: 'Proof' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to the first tab when the selected tab is removed', async () => {
    const { rerender } = render(Tabs, {
      label: 'Views',
      tabs,
      value: 'export',
      children: tabPanel,
    });
    expect(screen.getByRole('tab', { name: 'Export' })).toHaveAttribute('aria-selected', 'true');

    await rerender({ label: 'Views', tabs: tabs.slice(0, 2), value: 'export', children: tabPanel });
    expect(screen.getByText('Panel design')).toBeVisible();
  });

  it('forwards rest attributes to the root', () => {
    render(Tabs, { label: 'Views', tabs, children: tabPanel, 'data-testid': 'views' });
    expect(screen.getByTestId('views')).toBeInTheDocument();
  });
});

describe('DropdownMenu keyboard', () => {
  const items = [
    { value: 'rename', label: 'Rename' },
    { value: 'duplicate', label: 'Duplicate' },
    { value: 'delete', label: 'Delete', disabled: true },
  ];

  it('opens from the keyboard and moves the highlight with arrows', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(DropdownMenu, { trigger: text('Actions'), items, onSelect });

    screen.getByRole('button', { name: 'Actions' }).focus();
    // Opens the menu; bits-ui moves focus to the first item on the next tick.
    await user.keyboard('{ArrowDown}');
    await popupItem('Rename');

    await user.keyboard('{ArrowDown}');
    expect(await popupItem('Duplicate')).toHaveAttribute('data-highlighted');

    await user.keyboard('{ArrowUp}');
    expect(await popupItem('Rename')).toHaveAttribute('data-highlighted');

    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('duplicate');
  });

  it('exposes the shortcut hint to assistive tech instead of aria-hiding it', async () => {
    const user = userEvent.setup();
    render(DropdownMenu, {
      trigger: text('Actions'),
      items: [{ value: 'rename', label: 'Rename', hint: '⌘R' }],
    });
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const item = await popupItem('Rename');
    const hint = item.querySelector('.ldt-menu__hint');
    expect(hint).toHaveTextContent('⌘R');
    expect(hint).not.toHaveAttribute('aria-hidden');
  });
});

describe('NavMenu', () => {
  const items = [
    { value: 'overview', label: 'Overview' },
    { value: 'settings', label: 'Settings' },
  ];

  it('marks the active section on the trigger', () => {
    render(NavMenu, { label: 'Projects', items, active: true });
    const trigger = screen.getByRole('button', { name: /Projects/ });
    expect(trigger).toHaveAttribute('aria-current', 'page');
    expect(trigger).toHaveClass('ldt-nav-menu--active');
  });

  it('opens its menu and reports the chosen item', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(NavMenu, { label: 'Projects', items, onSelect });

    const trigger = screen.getByRole('button', { name: /Projects/ });
    expect(trigger).not.toHaveAttribute('aria-current');
    await user.click(trigger);
    await user.click(await popupItem('Settings'));
    expect(onSelect).toHaveBeenCalledWith('settings');
  });

  it('forwards rest attributes to the trigger without breaking the menu wiring', async () => {
    const user = userEvent.setup();
    render(NavMenu, { label: 'Projects', items, 'data-testid': 'nav-projects' });
    const trigger = screen.getByTestId('nav-projects');
    await user.click(trigger);
    expect(await popupItem('Overview')).toBeInTheDocument();
  });
});
