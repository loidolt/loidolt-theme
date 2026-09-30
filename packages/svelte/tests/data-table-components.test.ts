import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DataTable from '../src/lib/components/DataTable.svelte';
import { createDataTable } from '../src/lib/data-table.svelte.js';
import DataTableHarness from './fixtures/DataTableHarness.svelte';

const bodyRows = () =>
  within(screen.getByRole('table', { name: 'Sheets' }))
    .getAllByRole('row')
    .slice(1)
    .filter((row) => !row.classList.contains('ldt-data-table__spacer'));
const names = () =>
  bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent?.trim());

/** A menu row by its text, ignoring the same text in table cells. */
async function popupItem(name: string, role = 'menuitemcheckbox') {
  const labels = await screen.findAllByText(name);
  const item = labels.map((label) => label.closest(`[role="${role}"]`)).find(Boolean);
  expect(item, `no [role="${role}"] around "${name}"`).toBeTruthy();
  return item as HTMLElement;
}

/**
 * Closes the open menu and waits for the page to take clicks again: Bits leaves
 * `pointer-events: none` on <body> for a short delay after a menu closes, and a click inside that
 * window fails or not depending on the runner's speed.
 */
async function closeMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.keyboard('{Escape}');
  await waitFor(() => expect(document.body.style.pointerEvents).not.toBe('none'));
}

afterEach(() => vi.useRealTimers());

describe('DataTable', () => {
  it('pages, sorts from the header, and reports its position in the whole result', async () => {
    const user = userEvent.setup();
    render(DataTableHarness);
    const table = screen.getByRole('table', { name: 'Sheets' });
    expect(table).toHaveAttribute('aria-rowcount', '13');
    expect(names()).toEqual(['Sheet 1', 'Sheet 2', 'Sheet 3', 'Sheet 4', 'Sheet 5']);
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '2');

    await user.click(screen.getByRole('button', { name: 'Layers' }));
    const layers = screen.getByRole('columnheader', { name: 'Layers' });
    expect(layers).toHaveAttribute('aria-sort', 'ascending');
    await user.click(screen.getByRole('button', { name: 'Layers' }));
    expect(layers).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: 'Stock' })).not.toHaveAttribute('aria-sort');

    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '7');
    expect(screen.getByRole('status')).toHaveTextContent('6–10 of 12');
    expect(document.querySelector('td[data-hide-below="compact"]')).not.toBeNull();
  });

  it('searches across columns and filters one column, from the page start', async () => {
    const user = userEvent.setup();
    render(DataTableHarness);
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'cork');
    expect(names()).toEqual(['Sheet 3', 'Sheet 6', 'Sheet 9', 'Sheet 12']);
    expect(screen.getByRole('status')).toHaveTextContent('1–4 of 4');

    await user.type(screen.getByRole('searchbox', { name: 'Name filter' }), '12');
    expect(names()).toEqual(['Sheet 12']);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    expect(names()).toHaveLength(5);
  });

  it('debounces the search', async () => {
    vi.useFakeTimers();
    const table = createDataTable({
      data: [{ name: 'Birch' }, { name: 'Cork' }],
      columns: [{ id: 'name', header: 'Name' }],
    });
    const { default: DataTableSearch } =
      await import('../src/lib/components/DataTableSearch.svelte');
    // testing-library cannot infer a generic component's type parameter from its props.
    render(DataTableSearch, { table, debounce: 300 } as never);
    await fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'co' } });
    expect(table.search).toBe('');
    vi.advanceTimersByTime(300);
    expect(table.search).toBe('co');
  });

  it('filters by facets with counts, and clears them', async () => {
    const user = userEvent.setup();
    render(DataTableHarness);
    await user.click(screen.getByRole('button', { name: 'Stock' }));
    const acrylic = await popupItem('acrylic');
    expect(acrylic).toHaveTextContent('4');
    await user.click(acrylic);
    await user.click(await popupItem('cork'));
    await closeMenu(user);
    expect(screen.getByRole('status')).toHaveTextContent('of 8');
    expect(screen.getByRole('button', { name: /Stock/ })).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: /Stock/ }));
    await user.click(await popupItem('Clear filter', 'menuitem'));
    expect(screen.getByRole('status')).toHaveTextContent('of 12');
  });

  it('hides columns from its menu, keeping required ones', async () => {
    const user = userEvent.setup();
    render(DataTableHarness);
    await user.click(screen.getByRole('button', { name: 'Columns' }));
    expect(screen.queryByText('Layers', { selector: '[role="menuitemcheckbox"] span' })).toBeNull();
    await user.click(await popupItem('Stock'));
    await closeMenu(user);
    expect(screen.queryByRole('columnheader', { name: 'Stock' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Columns' }));
    await user.click(await popupItem('Show all', 'menuitem'));
    expect(screen.getByRole('columnheader', { name: 'Stock' })).toBeInTheDocument();
  });

  it('selects rows page by page, with an indeterminate header', async () => {
    const user = userEvent.setup();
    render(DataTableHarness, { options: { selection: 'multiple' } });
    const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' });
    await user.click(screen.getAllByRole('checkbox', { name: 'Select row' })[0]);
    expect(all).toHaveProperty('indeterminate', true);
    expect(bodyRows()[0]).toHaveAttribute('data-selected');
    await user.click(all);
    expect(screen.getByRole('status')).toHaveTextContent('5 selected');
    await user.click(all);
    expect(screen.getByRole('status')).not.toHaveTextContent('selected');
  });

  it('selects one row with radios in single mode', async () => {
    const user = userEvent.setup();
    render(DataTableHarness, { options: { selection: 'single' } });
    const radios = screen.getAllByRole('radio', { name: 'Select row' });
    await user.click(radios[1]);
    await user.click(radios[2]);
    expect(radios[1]).not.toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
  });

  it('changes rows per page', async () => {
    const user = userEvent.setup();
    render(DataTableHarness);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '10');
    expect(names()).toHaveLength(10);
  });

  it('shows placeholders while loading and an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    const { unmount } = render(DataTableHarness, { loading: true });
    expect(screen.getByRole('table', { name: 'Sheets' })).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelectorAll('.ldt-skeleton')).toHaveLength(15);
    unmount();

    render(DataTableHarness);
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'nothing');
    expect(screen.getByRole('heading', { name: 'No results' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 of 0');
  });

  it('edits a cell in place: Enter saves, Escape restores', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(DataTableHarness, { editable: true, onEdit });
    await user.click(screen.getByRole('button', { name: 'Edit Name: Sheet 1' }));
    const input = screen.getByRole('textbox', { name: 'Edit Name' });
    await vi.waitFor(() => expect(input).toHaveFocus());
    await user.clear(input);
    await user.type(input, 'Bracket{Enter}');
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }), 'name', 'Bracket');
    const cell = screen.getByRole('button', { name: 'Edit Name: Bracket' });
    await vi.waitFor(() => expect(cell).toHaveFocus());

    await user.click(cell);
    await user.type(screen.getByRole('textbox', { name: 'Edit Name' }), ' two{Escape}');
    expect(screen.getByRole('button', { name: 'Edit Name: Bracket' })).toBeInTheDocument();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('renders only the rows in view when virtual', () => {
    render(DataTableHarness, {
      count: 300,
      options: { pageSize: Infinity },
      virtual: { rowHeight: 40, overscan: 2 },
    });
    // jsdom has no layout: the window falls back to one 20-row screenful plus overscan.
    expect(bodyRows().length).toBe(24);
    const spacer = document.querySelector('.ldt-data-table__spacer td') as HTMLElement;
    expect(spacer.style.height).toBe(`${(300 - 24) * 40}px`);
    expect(screen.queryByRole('navigation', { name: 'Table pages' })).not.toBeInTheDocument();
  });

  it('accepts custom rows and cells', () => {
    const table = createDataTable({
      data: [{ name: 'Birch' }],
      columns: [
        {
          id: 'name',
          header: 'Name',
          cell: createRawSnippet((row: () => { name: string }) => ({
            render: () => `<strong>${row().name}!</strong>`,
          })),
        },
      ],
    });
    render(DataTable, { table, caption: 'Custom' } as never);
    expect(screen.getByText('Birch!')).toBeInTheDocument();

    const other = createDataTable({
      data: [{ name: 'Cork' }],
      columns: [{ id: 'name', header: 'Name' }],
    });
    render(DataTable, {
      table: other,
      caption: 'Rows',
      row: createRawSnippet((row: () => { id: string }) => ({
        render: () => `<tr><td>row ${row().id}</td></tr>`,
      })),
    } as never);
    expect(screen.getByText('row 0')).toBeInTheDocument();
  });
});
