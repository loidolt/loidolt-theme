import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Checkbox from '../src/lib/components/Checkbox.svelte';
import Input from '../src/lib/components/Input.svelte';
import NumberField from '../src/lib/components/NumberField.svelte';
import RadioGroup from '../src/lib/components/RadioGroup.svelte';
import Select from '../src/lib/components/Select.svelte';
import Textarea from '../src/lib/components/Textarea.svelte';
import FieldHarness from './fixtures/FieldHarness.svelte';
import FieldsetHarness from './fixtures/FieldsetHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

describe('Field', () => {
  it('wires label, description and error to the control it wraps', async () => {
    render(FieldHarness, {
      label: 'Contact email',
      description: 'Used only for delivery updates.',
      error: 'Enter a complete address',
    });

    const input = screen.getByLabelText('Contact email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const describedBy = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(describedBy).toHaveLength(2);
    for (const id of describedBy) {
      expect(document.getElementById(id)).toBeInTheDocument();
    }
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a complete address');
  });

  it('omits aria-describedby when there is nothing to describe', () => {
    render(FieldHarness, { label: 'Sheet name' });
    expect(screen.getByLabelText('Sheet name')).not.toHaveAttribute('aria-describedby');
  });

  it('generates ids that are stable rather than random', () => {
    const first = render(FieldHarness, { label: 'One' });
    const id = screen.getByLabelText('One').id;
    expect(id).toBeTruthy();
    // The same instance must keep its id across re-renders, or label wiring breaks.
    first.rerender({ label: 'One', description: 'Now described.' });
    expect(screen.getByLabelText('One').id).toBe(id);
  });

  it('marks optional fields with overridable text', () => {
    render(FieldHarness, { label: 'Project note', optional: true });
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });
});

describe('Input', () => {
  it('forwards native attributes and input events without an extra handler', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    render(Input, { placeholder: 'name@studio.com', type: 'email', oninput });
    const input = screen.getByPlaceholderText('name@studio.com');
    expect(input).toHaveAttribute('type', 'email');
    await user.type(input, 'a');
    expect(oninput).toHaveBeenCalled();
    expect(input).toHaveValue('a');
  });
});

describe('Textarea', () => {
  it('applies the boxed modifier', () => {
    render(Textarea, { boxed: true, 'aria-label': 'Notes' });
    expect(screen.getByLabelText('Notes')).toHaveClass('ldt-textarea--boxed');
  });
});

describe('Checkbox', () => {
  it('reports changes and names itself from its children', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Checkbox, { children: text('Alignment guides'), onCheckedChange });
    const box = screen.getByRole('checkbox', { name: 'Alignment guides' });
    await user.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('falls back to the label prop for its accessible name', () => {
    render(Checkbox, { label: 'Alignment guides' });
    expect(screen.getByRole('checkbox', { name: 'Alignment guides' })).toBeInTheDocument();
  });

  it('exposes the input through inputClass', () => {
    render(Checkbox, { label: 'Guides', inputClass: 'reachable' });
    expect(screen.getByRole('checkbox')).toHaveClass('reachable');
  });
});

describe('RadioGroup', () => {
  const options = [
    { value: 'design', label: 'Design' },
    { value: 'proof', label: 'Proof' },
  ];

  it('shares one generated name across every input', () => {
    render(RadioGroup, { options, label: 'Workspace mode' });
    const names = screen.getAllByRole('radio').map((radio) => (radio as HTMLInputElement).name);
    expect(new Set(names).size).toBe(1);
    expect(names[0]).toBeTruthy();
  });

  it('reports the chosen value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(RadioGroup, { options, label: 'Workspace mode', onValueChange });
    await user.click(screen.getByRole('radio', { name: 'Proof' }));
    expect(onValueChange).toHaveBeenCalledWith('proof');
  });
});

describe('Select', () => {
  const options = [
    { value: 'svg', label: 'SVG vector' },
    { value: 'pdf', label: 'PDF document' },
  ];

  it('lets the user return to the placeholder when the field is optional', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Select, { options, placeholder: 'Choose a format', label: 'Format', onValueChange });

    const select = screen.getByRole('combobox', { name: 'Format' });
    await user.selectOptions(select, 'pdf');
    expect(onValueChange).toHaveBeenLastCalledWith('pdf');

    await user.selectOptions(select, '');
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(select).toHaveValue('');
  });

  it('locks the placeholder once the field is required', () => {
    render(Select, { options, placeholder: 'Choose a format', label: 'Format', required: true });
    expect(screen.getByRole('combobox', { name: 'Format' }).querySelector('option')).toBeDisabled();
  });
});

describe('NumberField', () => {
  it('falls back to the low bound instead of wedging on NaN', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(NumberField, { label: 'Layer count', min: 1, max: 40, value: 12, onValueChange });

    const input = screen.getByLabelText('Layer count');
    await user.clear(input);
    await user.tab();

    expect(onValueChange).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByRole('button', { name: 'Increase Layer count' }));
    expect(onValueChange).toHaveBeenLastCalledWith(2);
  });

  it('omits infinite bounds from the HTML attributes', () => {
    render(NumberField, { label: 'Offset' });
    const input = screen.getByLabelText('Offset');
    expect(input).not.toHaveAttribute('min');
    expect(input).not.toHaveAttribute('max');
  });

  it('keeps the spin buttons focusable at the bounds', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(NumberField, { label: 'Layers', min: 1, max: 3, value: 1, onValueChange });

    const decrease = screen.getByRole('button', { name: 'Decrease Layers' });
    expect(decrease).toHaveAttribute('aria-disabled', 'true');
    expect(decrease).not.toBeDisabled();
    await user.click(decrease);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('does not let a consumer handler replace the clamping', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const onValueChange = vi.fn();
    render(NumberField, { label: 'Layers', min: 1, max: 3, value: 1, onchange, onValueChange });

    await user.click(screen.getByRole('button', { name: 'Increase Layers' }));
    expect(onValueChange).toHaveBeenCalledWith(2);
  });

  it('chains a consumer onchange after clamping instead of dropping it', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const onValueChange = vi.fn();
    render(NumberField, { label: 'Layers', min: 1, max: 9, value: 1, onchange, onValueChange });

    const input = screen.getByLabelText('Layers');
    await user.clear(input);
    await user.type(input, '4');
    await user.tab();

    expect(onValueChange).toHaveBeenLastCalledWith(4);
    expect(onchange).toHaveBeenCalledOnce();
  });

  it('disables the spin buttons together with the input', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(NumberField, {
      label: 'Layers',
      min: 1,
      max: 9,
      value: 5,
      disabled: true,
      onValueChange,
    });

    expect(screen.getByLabelText('Layers')).toBeDisabled();
    const increase = screen.getByRole('button', { name: 'Increase Layers' });
    expect(increase).toBeDisabled();
    await user.click(increase);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('Fieldset', () => {
  it('names the group and wires a shared description', () => {
    render(FieldsetHarness, {
      legend: 'Output formats',
      description: 'At least one is required.',
    });

    const group = screen.getByRole('group', { name: 'Output formats' });
    expect(group).toHaveAccessibleDescription('At least one is required.');
  });

  it('announces a group-level error once, not once per control', () => {
    render(FieldsetHarness, { legend: 'Output formats', error: 'Choose a format' });

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent('Choose a format');
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Choose a format');
  });

  it('marks the group optional in the legend', () => {
    render(FieldsetHarness, { legend: 'Notes', optional: true, optionalText: 'If you like' });
    expect(screen.getByRole('group', { name: /Notes/ })).toBeInTheDocument();
    expect(screen.getByText('If you like')).toBeInTheDocument();
  });

  it('keeps the controls it wraps reachable', async () => {
    const user = userEvent.setup();
    render(FieldsetHarness, { legend: 'Output formats' });

    await user.click(screen.getByRole('checkbox', { name: 'SVG' }));
    expect(screen.getByRole('checkbox', { name: 'SVG' })).toBeChecked();
  });
});
