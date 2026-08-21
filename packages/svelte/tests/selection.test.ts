import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Accordion from '../src/lib/components/Accordion.svelte';
import ThemeToggle from '../src/lib/components/ThemeToggle.svelte';
import ToggleGroup from '../src/lib/components/ToggleGroup.svelte';
import { createTheme } from '../src/lib/theme.svelte.js';

const panel = createRawSnippet<[{ value: string }]>((args) => ({
  render: () => `<p>Body for ${args().value}</p>`,
}));

const items = [
  { value: 'materials', title: 'Materials' },
  { value: 'tolerances', title: 'Tolerances' },
  { value: 'finishing', title: 'Finishing', disabled: true },
];

describe('Accordion', () => {
  it('opens a panel and closes the previous one', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Accordion, { items, children: panel, onValueChange });

    await user.click(screen.getByRole('button', { name: 'Materials' }));
    expect(screen.getByRole('button', { name: 'Materials' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Body for materials')).toBeVisible();
    expect(onValueChange).toHaveBeenLastCalledWith('materials');

    await user.click(screen.getByRole('button', { name: 'Tolerances' }));
    expect(screen.getByText('Body for tolerances')).toBeVisible();
    // Single mode: the first panel closes rather than stacking.
    expect(screen.getByText('Body for materials')).not.toBeVisible();
  });

  it('keeps several panels open in multiple mode', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Accordion, { items, children: panel, multiple: true, onValueChange });

    await user.click(screen.getByRole('button', { name: 'Materials' }));
    await user.click(screen.getByRole('button', { name: 'Tolerances' }));

    expect(screen.getByText('Body for materials')).toBeVisible();
    expect(screen.getByText('Body for tolerances')).toBeVisible();
    expect(onValueChange).toHaveBeenLastCalledWith(['materials', 'tolerances']);
  });

  it('honours an initially open panel', () => {
    render(Accordion, { items, children: panel, value: 'tolerances' });
    expect(screen.getByText('Body for tolerances')).toBeVisible();
  });

  it('will not open a disabled item', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Accordion, { items, children: panel, onValueChange });

    await user.click(screen.getByRole('button', { name: 'Finishing' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('puts the triggers at the requested heading level', () => {
    render(Accordion, { items, children: panel, headingLevel: 2 });
    expect(screen.getByRole('heading', { name: 'Materials', level: 2 })).toBeInTheDocument();
  });
});

const modes = [
  { value: 'select', label: 'Select' },
  { value: 'draw', label: 'Draw' },
  { value: 'measure', label: 'Measure' },
];

describe('ToggleGroup', () => {
  /**
   * Bits exposes single mode as a radio group and multiple mode as pressable buttons — the
   * correct mapping in both cases, and the reason these queries differ by mode.
   */
  it('presses one option at a time', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(ToggleGroup, { options: modes, label: 'Tool', onValueChange });

    await user.click(screen.getByRole('radio', { name: 'Draw' }));
    expect(screen.getByRole('radio', { name: 'Draw' })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith('draw');

    await user.click(screen.getByRole('radio', { name: 'Measure' }));
    expect(screen.getByRole('radio', { name: 'Draw' })).not.toBeChecked();
  });

  it('accumulates values in multiple mode', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(ToggleGroup, { options: modes, label: 'Layers', multiple: true, onValueChange });

    await user.click(screen.getByRole('button', { name: 'Draw' }));
    await user.click(screen.getByRole('button', { name: 'Measure' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['draw', 'measure']);
  });

  it('names the group and moves with the arrow keys', async () => {
    const user = userEvent.setup();
    render(ToggleGroup, { options: modes, label: 'Tool', value: 'select' });

    expect(screen.getByRole('radiogroup', { name: 'Tool' })).toBeInTheDocument();
    screen.getByRole('radio', { name: 'Select' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Draw' })).toHaveFocus();
  });

  it('carries size and orientation onto the group', () => {
    const { container } = render(ToggleGroup, {
      options: modes,
      label: 'Tool',
      size: 'sm',
      orientation: 'vertical',
    });

    const group = container.querySelector('.ldt-toggle-group');
    expect(group).toHaveClass('ldt-toggle-group--sm');
    expect(group).toHaveAttribute('data-orientation', 'vertical');
  });

  it('leaves the default size unmodified', () => {
    const { container } = render(ToggleGroup, { options: modes, label: 'Tool' });
    expect(container.querySelector('.ldt-toggle-group')?.className).toBe('ldt-toggle-group');
  });
});

describe('ThemeToggle', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('reflects and changes the theme preference', async () => {
    const user = userEvent.setup();
    const theme = createTheme({ storageKey: null });
    render(ThemeToggle, { theme });

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(theme.preference).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    theme.destroy();
  });

  it('ignores a second press on the pressed option', async () => {
    const user = userEvent.setup();
    const theme = createTheme({ storageKey: null });
    render(ThemeToggle, { theme });

    await user.click(screen.getByRole('radio', { name: 'Light' }));
    // A toggle group deselects on a repeat press; "no colour scheme" is not a state.
    await user.click(screen.getByRole('radio', { name: 'Light' }));

    expect(theme.preference).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    theme.destroy();
  });

  it('can drop the system option', () => {
    const theme = createTheme({ storageKey: null });
    render(ThemeToggle, { theme, showSystem: false });

    expect(screen.queryByRole('radio', { name: 'System' })).not.toBeInTheDocument();
    theme.destroy();
  });

  it('takes localised labels', () => {
    const theme = createTheme({ storageKey: null });
    render(ThemeToggle, { theme, label: 'Farbschema', lightLabel: 'Hell', darkLabel: 'Dunkel' });

    expect(screen.getByRole('radiogroup', { name: 'Farbschema' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Hell' })).toBeInTheDocument();
    theme.destroy();
  });
});
