import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../src/lib/components/EmptyState.svelte';
import Table from '../src/lib/components/Table.svelte';
import TableHeader from '../src/lib/components/TableHeader.svelte';
import TableHarness from './fixtures/TableHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

const rows = [
  { name: 'bracket.svg', sheets: 3 },
  { name: 'panel.svg', sheets: 12 },
];

describe('Table sorting', () => {
  it('reports sort state on the cell, where aria-sort belongs', () => {
    render(TableHarness, { rows });

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
    // Exactly one column may claim a sort, or screen readers report two sorted columns.
    expect(screen.getByRole('columnheader', { name: 'Sheets' })).toHaveAttribute(
      'aria-sort',
      'none'
    );
  });

  it('toggles direction on the sorted column', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(TableHarness, { rows, onSort });

    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSort).toHaveBeenLastCalledWith('name', 'descending');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending'
    );

    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSort).toHaveBeenLastCalledWith('name', 'ascending');
  });

  it('asks for ascending when an unsorted column is pressed', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(TableHarness, { rows, onSort });

    await user.click(screen.getByRole('button', { name: 'Sheets' }));
    expect(onSort).toHaveBeenLastCalledWith('sheets', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'none');
  });

  it('sorts from the keyboard', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(TableHarness, { rows, onSort });

    screen.getByRole('button', { name: 'Sheets' }).focus();
    await user.keyboard('{Enter}');
    expect(onSort).toHaveBeenLastCalledWith('sheets', 'ascending');
  });

  it('leaves a plain header inert and unsorted', () => {
    render(TableHeader, { children: text('Notes') });

    const header = screen.getByRole('columnheader', { name: 'Notes' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('carries column alignment onto the cell', () => {
    render(TableHarness, { rows });
    expect(screen.getByRole('columnheader', { name: 'Sheets' })).toHaveAttribute(
      'data-align',
      'end'
    );
  });
});

describe('Table empty and sticky states', () => {
  it('shows the empty snippet instead of rows', () => {
    render(TableHarness, { rows: [] });

    expect(screen.getByText('No cut files yet')).toBeInTheDocument();
    // The header stays: a table with no rows still has to say what it would have shown.
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  });

  it('drops the empty row once there is data', async () => {
    const { rerender } = render(TableHarness, { rows: [] });
    await rerender({ rows });

    expect(screen.queryByText('No cut files yet')).not.toBeInTheDocument();
    expect(screen.getByText('bracket.svg')).toBeInTheDocument();
  });

  it('spans the empty cell across the declared columns', () => {
    const { container } = render(TableHarness, { rows: [] });
    expect(container.querySelector('.ldt-table__empty td')).toHaveAttribute('colspan', '2');
  });

  it('spans the row maximum when no column count is given', () => {
    const { container } = render(Table, {
      caption: 'Files',
      children: text('<tbody></tbody>'),
      empty: text('<p>Nothing</p>'),
    });
    // 1000 is the HTML maximum for colspan, so this cell is as wide as any row can be.
    expect(container.querySelector('.ldt-table__empty td')).toHaveAttribute('colspan', '1000');
  });

  it('marks the sticky variant on both the wrapper and the table', () => {
    const { container } = render(TableHarness, { rows, sticky: true });

    expect(container.querySelector('.ldt-table-wrap')).toHaveClass('ldt-table-wrap--sticky');
    expect(container.querySelector('.ldt-table')).toHaveClass('ldt-table--sticky');
  });

  it('stays unsticky by default', () => {
    const { container } = render(TableHarness, { rows });
    expect(container.querySelector('.ldt-table-wrap')).not.toHaveClass('ldt-table-wrap--sticky');
  });
});

describe('EmptyState', () => {
  it('renders a heading, description and actions', () => {
    render(EmptyState, {
      title: 'No projects',
      description: 'Create one to get going.',
      actions: text('<button>New project</button>'),
    });

    expect(screen.getByRole('heading', { name: 'No projects', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Create one to get going.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument();
  });

  it('takes a heading level so it slots into any outline', () => {
    render(EmptyState, { title: 'No projects', headingLevel: 2 });
    expect(screen.getByRole('heading', { name: 'No projects', level: 2 })).toBeInTheDocument();
  });

  it('hides a decorative icon from assistive tech', () => {
    const { container } = render(EmptyState, { title: 'No projects', icon: text('▧') });
    expect(container.querySelector('.ldt-empty-state__icon')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });
});
