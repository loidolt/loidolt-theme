import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Breadcrumbs from '../src/lib/components/Breadcrumbs.svelte';
import DropdownMenu from '../src/lib/components/DropdownMenu.svelte';
import Pagination from '../src/lib/components/Pagination.svelte';
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

/**
 * bits-ui moves the highlight in a microtask after the keydown, so an assertion taken straight
 * after `user.keyboard` reads the previous frame under load.
 */
async function expectHighlighted(name: string) {
  const item = await popupItem(name);
  await waitFor(() => expect(item).toHaveAttribute('data-highlighted'));
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
    await user.keyboard('{ArrowDown}');

    /*
     * Two waits, and both are load-bearing. bits-ui moves focus to the first item a tick after
     * the menu opens, and arms the roving-focus key handling a little after that: an arrow key
     * sent in between lands on a focused item and moves nothing. Under a loaded test run that
     * window is wide enough to hit, which is what made this test flaky before the settle.
     */
    const first = await popupItem('Rename');
    await waitFor(() => expect(first).toHaveFocus());
    await new Promise((resolve) => setTimeout(resolve, 60));

    await user.keyboard('{ArrowDown}');
    await expectHighlighted('Duplicate');

    await user.keyboard('{ArrowUp}');
    await expectHighlighted('Rename');

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

describe('Breadcrumbs', () => {
  const trail = [
    { label: 'Projects', href: '/projects' },
    { label: 'Terrain', href: '/projects/terrain' },
    { label: 'Contours' },
  ];

  it('marks the last crumb as the current page and leaves it unlinked', () => {
    render(Breadcrumbs, { items: trail });

    const current = screen.getByText('Contours');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).toBe('SPAN');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  });

  it('never links the final crumb even when it carries an href', () => {
    render(Breadcrumbs, {
      items: [
        { label: 'Projects', href: '/' },
        { label: 'Here', href: '/here' },
      ],
    });
    expect(screen.queryByRole('link', { name: 'Here' })).not.toBeInTheDocument();
  });

  it('names its landmark', () => {
    render(Breadcrumbs, { items: trail, label: 'File path' });
    expect(screen.getByRole('navigation', { name: 'File path' })).toBeInTheDocument();
  });

  it('carries the separator as a custom property rather than as text', () => {
    render(Breadcrumbs, { items: trail, separator: '›' });
    // In the DOM only as a `::before` value — nothing to select, copy, or read aloud.
    expect(screen.getByRole('navigation')).toHaveStyle({ '--ldt-breadcrumb-separator': '"›"' });
    expect(screen.queryByText('›')).not.toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('marks the current page and moves with the next button', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(Pagination, { count: 95, perPage: 10, onPageChange });

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute('aria-current');
  });

  it('jumps to a page from its button', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(Pagination, { count: 95, perPage: 10, onPageChange });

    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it('hides the ellipsis from assistive tech', () => {
    const { container } = render(Pagination, { count: 500, perPage: 10 });
    const ellipsis = container.querySelector('.ldt-pagination__ellipsis');
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
  });

  it('names its landmark and its page buttons', () => {
    render(Pagination, {
      count: 30,
      perPage: 10,
      label: 'Search results',
      pageLabel: (page: number) => `Result page ${page}`,
    });

    expect(screen.getByRole('navigation', { name: 'Search results' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Result page 2' })).toBeInTheDocument();
  });
});
