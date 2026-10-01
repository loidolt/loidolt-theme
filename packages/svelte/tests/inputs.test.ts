import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Avatar from '../src/lib/components/Avatar.svelte';
import Combobox from '../src/lib/components/Combobox.svelte';
import MultiSelect from '../src/lib/components/MultiSelect.svelte';
import OTPInput from '../src/lib/components/OTPInput.svelte';
import PasswordInput from '../src/lib/components/PasswordInput.svelte';
import Slider from '../src/lib/components/Slider.svelte';
import { filterEntries, flattenOptions, matchesQuery } from '../src/lib/internal/options.js';

const stock = [
  { value: 'birch', label: 'Birch ply' },
  {
    label: 'Acrylic',
    options: [
      { value: 'clear', label: 'Clear acrylic' },
      { value: 'smoke', label: 'Smoked acrylic' },
    ],
  },
  { label: 'Retired', disabled: true, options: [{ value: 'mdf', label: 'MDF' }] },
];

/** Bits hides the list from the accessibility tree until it has been positioned. */
const options = () => screen.queryAllByRole('option', { hidden: true });
const status = () => document.querySelector('.ldt-live-region')!;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('option helpers', () => {
  it('flattens groups, pushing a group disable down, and filters groups by their options', () => {
    expect(flattenOptions(stock).map((option) => [option.value, Boolean(option.disabled)])).toEqual(
      [
        ['birch', false],
        ['clear', false],
        ['smoke', false],
        ['mdf', true],
      ]
    );
    const kept = filterEntries(
      stock,
      (option) => option.value !== 'birch' && option.value !== 'mdf'
    );
    expect(kept).toHaveLength(1);
    expect(matchesQuery({ value: 'x', label: 'Crème brûlée' }, '  CREME ')).toBe(true);
  });
});

describe('Combobox', () => {
  it('filters as the user types, announces the count, and selects with the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Combobox, { label: 'Stock', options: stock, onValueChange });
    const input = screen.getByRole('combobox', { name: 'Stock' });

    await user.click(input);
    await user.type(input, 'acr');
    expect(options().map((option) => option.textContent?.trim())).toEqual([
      'Clear acrylic',
      'Smoked acrylic',
    ]);
    expect(screen.getAllByText('Acrylic', { selector: '.ldt-listbox__heading' })).toHaveLength(1);
    expect(status()).toHaveTextContent('2 results');

    await user.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('smoke');
    expect(input).toHaveValue('Smoked acrylic');
  });

  it('shows the empty and loading states, and snaps the text back to the selection on close', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Combobox, { label: 'Stock', options: stock, value: 'birch' });
    const input = screen.getByRole('combobox', { name: 'Stock' });
    expect(input).toHaveValue('Birch ply');

    await user.clear(input);
    await user.type(input, 'zzz');
    expect(screen.getByText('No results', { selector: '.ldt-listbox__empty' })).toBeInTheDocument();
    expect(status()).toHaveTextContent('No results');

    await rerender({ loading: true });
    expect(screen.getByText('Loading…', { selector: '.ldt-listbox__empty' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(input).toHaveValue('Birch ply');
  });

  it('hands the query to a server search, debounced, and skips local filtering', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onQueryChange = vi.fn();
    render(Combobox, {
      label: 'Stock',
      options: stock,
      filter: false,
      onQueryChange,
      queryDebounce: 200,
    });
    const input = screen.getByRole('combobox', { name: 'Stock' });
    await user.type(input, 'zz');
    expect(onQueryChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onQueryChange).toHaveBeenCalledExactlyOnceWith('zz');
    // Nothing matches "zz", but the server owns filtering, so every option stays.
    expect(options()).toHaveLength(4);
  });

  it('calls onQueryChange immediately without a debounce, and accepts a custom filter', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(Combobox, {
      label: 'Stock',
      options: stock,
      onQueryChange,
      filter: (option: { value: string }, query: string) => option.value.startsWith(query),
    });
    const input = screen.getByRole('combobox', { name: 'Stock' });
    await user.type(input, 'sm');
    expect(onQueryChange).toHaveBeenLastCalledWith('sm');
    expect(options().map((option) => option.textContent?.trim())).toEqual(['Smoked acrylic']);
  });

  it('opens from its button and marks a disabled group', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Combobox, { label: 'Stock', options: stock, onOpenChange, boxed: true });
    await user.click(screen.getByRole('button', { name: 'Show options' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    const mdf = options().find((option) => option.textContent?.includes('MDF'));
    expect(mdf).toHaveAttribute('data-disabled');
    expect(document.querySelector('.ldt-combobox')).toHaveClass('ldt-combobox--boxed');
  });
});

describe('MultiSelect', () => {
  it('adds chips, clears the search after each pick, and removes with Backspace', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(MultiSelect, { label: 'Stock', options: stock, onValueChange });
    const input = screen.getByRole('combobox', { name: 'Stock' });

    await user.click(input);
    await user.type(input, 'birch');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['birch']);
    expect(input).toHaveValue('');
    expect(screen.getByRole('list')).toHaveTextContent('Birch ply');

    await user.type(input, 'clear{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['birch', 'clear']);
    expect(status()).toHaveTextContent('2 selected');

    await user.keyboard('{Escape}');
    await user.click(input);
    await user.keyboard('{Escape}{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(['birch']);
  });

  it('removes a chip by its button and moves focus sensibly', async () => {
    const user = userEvent.setup();
    render(MultiSelect, { label: 'Stock', options: stock, value: ['birch', 'clear'] });
    await user.click(screen.getByRole('button', { name: 'Remove Birch ply' }));
    const next = screen.getByRole('button', { name: 'Remove Clear acrylic' });
    expect(next).toHaveFocus();
    await user.click(next);
    expect(screen.getByRole('combobox', { name: 'Stock' })).toHaveFocus();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('disables the remaining options once max is reached, and says so', async () => {
    const user = userEvent.setup();
    render(MultiSelect, { label: 'Stock', options: stock, value: ['birch'], max: 1 });
    await user.click(screen.getByRole('button', { name: 'Show options' }));
    const clear = options().find((option) => option.textContent?.includes('Clear acrylic'));
    expect(clear).toHaveAttribute('data-disabled');
    expect(status()).toHaveTextContent('Up to 1 can be chosen');
  });

  it('labels an unknown value by the value itself and supports a server search', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onkeydown = vi.fn();
    render(MultiSelect, {
      label: 'Stock',
      options: [],
      value: ['legacy'],
      filter: false,
      loading: true,
      onQueryChange,
      onkeydown,
    });
    expect(screen.getByRole('list')).toHaveTextContent('legacy');
    const input = screen.getByRole('combobox', { name: 'Stock' });
    await user.type(input, 'a');
    expect(onQueryChange).toHaveBeenCalledWith('a');
    expect(onkeydown).toHaveBeenCalled();
    expect(status()).toHaveTextContent('Loading');
  });
});

describe('Slider', () => {
  it('names the thumb, speaks the formatted value, and steps with the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(Slider, {
      label: 'Kerf',
      value: 2,
      min: 0,
      max: 10,
      formatValue: (value: number) => `${value} mm`,
      showValue: true,
      name: 'kerf',
      onValueChange,
      onValueCommit,
    });
    const thumb = screen.getByRole('slider', { name: 'Kerf' });
    expect(thumb).toHaveAttribute('aria-valuetext', '2 mm');
    thumb.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(onValueCommit).toHaveBeenLastCalledWith(3);
    expect(thumb).toHaveAttribute('aria-valuetext', '3 mm');
    expect(document.querySelector('.ldt-slider__value')).toHaveTextContent('3 mm');
    expect(document.querySelector('input[type="hidden"][name="kerf"]')).toHaveValue('3');
  });

  it('turns an array into a named range with ticks, vertically', async () => {
    render(Slider, {
      label: 'Thickness',
      value: [2, 8],
      max: 10,
      step: 2,
      ticks: true,
      orientation: 'vertical',
      disabled: true,
      children: createRawSnippet(() => ({ render: () => '<small>0–10</small>' })),
    });
    expect(screen.getByRole('slider', { name: 'Thickness, minimum' })).toHaveAttribute(
      'aria-valuenow',
      '2'
    );
    expect(screen.getByRole('slider', { name: 'Thickness, maximum' })).toBeInTheDocument();
    expect(document.querySelectorAll('.ldt-slider__tick')).toHaveLength(6);
    expect(document.querySelector('.ldt-slider')).toHaveClass('ldt-slider--vertical');
    expect(document.querySelector('.ldt-slider')).toHaveAttribute('data-disabled');
  });

  it('reports range changes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(Slider, { label: 'Range', value: [2, 8], max: 10, onValueChange, onValueCommit });
    screen.getByRole('slider', { name: 'Range, maximum' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith([2, 9]);
    expect(onValueCommit).toHaveBeenLastCalledWith([2, 9]);
  });
});

describe('Avatar', () => {
  it('names the whole avatar once and falls back to initials', () => {
    render(Avatar, { name: 'Ada Byron Lovelace' });
    const avatar = screen.getByRole('img', { name: 'Ada Byron Lovelace' });
    expect(within(avatar).getByText('AL')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is decorative without a name, and takes explicit initials, alt, size and a fallback', () => {
    const { container } = render(Avatar, { initials: 'LS', size: 'lg' });
    expect(container.querySelector('.ldt-avatar')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.ldt-avatar')).toHaveClass('ldt-avatar--lg');
    expect(container).toHaveTextContent('LS');

    render(Avatar, {
      name: 'Label Studio',
      alt: 'Label Studio workspace',
      size: 'sm',
      fallback: createRawSnippet(() => ({ render: () => '<span>★</span>' })),
    });
    expect(screen.getByRole('img', { name: 'Label Studio workspace' })).toHaveTextContent('★');
  });

  it('shows the image once it loads and reports the status', async () => {
    class LoadingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', LoadingImage);
    const onLoadingStatusChange = vi.fn();
    render(Avatar, {
      name: 'Ada Lovelace',
      src: 'https://example.test/ada.png',
      onLoadingStatusChange,
    });
    await vi.waitFor(() => expect(onLoadingStatusChange).toHaveBeenCalledWith('loaded'));
    flushSync();
    expect(document.querySelector('.ldt-avatar__image')).toHaveAttribute('alt', '');
  });
});

describe('PasswordInput', () => {
  it('reveals with a fixed name and a pressed state', async () => {
    const user = userEvent.setup();
    const onVisibleChange = vi.fn();
    render(PasswordInput, { 'aria-label': 'Password', onVisibleChange, boxed: true });
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    expect(toggle).toHaveAttribute('aria-controls', input.id);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAccessibleName('Show password');
    expect(onVisibleChange).toHaveBeenCalledWith(true);
  });

  it('accepts a custom toggle and a caller id', () => {
    render(PasswordInput, {
      id: 'new-password',
      'aria-label': 'New password',
      autocomplete: 'new-password',
      toggle: createRawSnippet((visible: () => boolean) => ({
        render: () => `<span>${visible() ? 'Hide' : 'Show'}</span>`,
      })),
    });
    expect(screen.getByLabelText('New password')).toHaveAttribute('id', 'new-password');
    expect(screen.getByRole('button')).toHaveTextContent('Show');
  });
});

describe('OTPInput', () => {
  // Bits re-dispatches `input` on timers up to 50ms after each change (to clear autofill state).
  // Let them run before the next test, or they fire into a torn-down document.
  afterEach(() => new Promise((resolve) => setTimeout(resolve, 60)));

  it('accepts digits only, groups cells, and reports completion', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(OTPInput, { label: 'Verification code', length: 4, groupSize: 2, onComplete });
    const input = screen.getByRole('textbox', { name: 'Verification code' });
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(document.querySelectorAll('.ldt-otp-input__cell')).toHaveLength(4);
    expect(document.querySelectorAll('.ldt-otp-input__gap')).toHaveLength(1);

    // Bits lays the real input over the cells with `pointer-events: none`; focus it directly.
    input.focus();
    await user.keyboard('1a234');
    expect(input).toHaveValue('1234');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('strips separators from a pasted code and can mask it', async () => {
    const onValueChange = vi.fn();
    render(OTPInput, {
      label: 'Recovery code',
      type: 'alphanumeric',
      mask: true,
      onValueChange,
    });
    const input = screen.getByRole('textbox', { name: 'Recovery code' });
    expect(input).toHaveAttribute('inputmode', 'text');
    await fireEvent.paste(input, {
      clipboardData: { getData: () => 'ab1-2c3' },
    });
    expect(onValueChange).toHaveBeenCalledWith('ab12c3');
    expect(document.querySelector('.ldt-otp-input')).toHaveTextContent('• • • • • •');
  });
});
