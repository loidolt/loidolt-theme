import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import ActiveFilterChips from '../src/lib/components/ActiveFilterChips.svelte';
import FilterPanel from '../src/lib/components/FilterPanel.svelte';
import Toolbar from '../src/lib/components/Toolbar.svelte';
import FilterChipsHarness from './fixtures/FilterChipsHarness.svelte';

const html = (value: string) => createRawSnippet(() => ({ render: () => value }));

describe('Toolbar', () => {
  it('is a labelled group by default, with an end cluster', () => {
    render(Toolbar, {
      label: 'Sheet tools',
      children: html('<button>Filter</button>'),
      end: html('<button>Grid</button>'),
    });
    const group = screen.getByRole('group', { name: 'Sheet tools' });
    expect(group).not.toHaveAttribute('aria-orientation');
    expect(group.querySelector('.ldt-toolbar__end')).toHaveTextContent('Grid');
  });

  it('becomes a roving toolbar on request', async () => {
    const user = userEvent.setup();
    render(Toolbar, {
      label: 'Format',
      roving: true,
      orientation: 'vertical',
      children: html(
        '<div><button data-roving-item>Bold</button><button data-roving-item>Italic</button></div>'
      ),
    });
    const toolbar = screen.getByRole('toolbar', { name: 'Format' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    expect(toolbar).toHaveClass('ldt-toolbar--vertical');
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('tabindex', '-1');
    bold.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
  });
});

describe('ActiveFilterChips', () => {
  it('removes one filter at a time and keeps focus in the group', async () => {
    const user = userEvent.setup();
    render(FilterChipsHarness);
    const group = screen.getByRole('group', { name: 'Active filters' });

    await user.click(screen.getByRole('button', { name: 'Remove filter Stock: Birch' }));
    expect(screen.getByText('2 filters')).toBeInTheDocument();
    // The chip that moved into the removed one's place takes focus.
    expect(screen.getByRole('button', { name: 'Remove filter Owner: Me' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Remove filter Owner: Me' }));
    expect(screen.getByRole('button', { name: 'Remove filter Status: Ready' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Remove filter Status: Ready' }));
    expect(screen.getByText('0 filters')).toBeInTheDocument();
    expect(group).not.toBeInTheDocument();
  });

  it('clears everything, and shows notes even without chips', async () => {
    const user = userEvent.setup();
    render(FilterChipsHarness);
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.getByText('0 filters')).toBeInTheDocument();

    const onRemove = vi.fn();
    render(ActiveFilterChips, {
      items: [],
      onRemove,
      children: html('<span>Date range ignored here</span>'),
    });
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent(
      'Date range ignored here'
    );
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
  });
});

describe('FilterPanel', () => {
  it('takes closed controls out of reach and offers Clear all when filters are set', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { rerender } = render(FilterPanel, {
      id: 'sheet-filters',
      activeCount: 2,
      onClear,
      children: html('<label>Stock <input /></label>'),
    });
    const region = screen.getByRole('region', { name: 'Filters' });
    expect(region).toHaveAttribute('id', 'sheet-filters');
    expect(region).toHaveAttribute('data-state', 'closed');
    // Svelte sets the `inert` property; jsdom does not reflect it to the attribute as browsers do.
    const clip = region.querySelector('.ldt-filter-panel__clip') as HTMLElement;
    expect(clip.inert).toBe(true);

    await rerender({ open: true });
    expect(region).toHaveAttribute('data-state', 'open');
    expect(clip.inert).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onClear).toHaveBeenCalledOnce();

    await rerender({ activeCount: 0 });
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
  });
});
