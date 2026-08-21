import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import Alert from '../src/lib/components/Alert.svelte';
import Badge from '../src/lib/components/Badge.svelte';
import Button from '../src/lib/components/Button.svelte';
import Card from '../src/lib/components/Card.svelte';
import Checkbox from '../src/lib/components/Checkbox.svelte';
import Dialog from '../src/lib/components/Dialog.svelte';
import IconButton from '../src/lib/components/IconButton.svelte';
import NumberField from '../src/lib/components/NumberField.svelte';
import Progress from '../src/lib/components/Progress.svelte';
import RadioGroup from '../src/lib/components/RadioGroup.svelte';
import Select from '../src/lib/components/Select.svelte';
import Separator from '../src/lib/components/Separator.svelte';
import Skeleton from '../src/lib/components/Skeleton.svelte';
import Spinner from '../src/lib/components/Spinner.svelte';
import Switch from '../src/lib/components/Switch.svelte';
import Table from '../src/lib/components/Table.svelte';
import Textarea from '../src/lib/components/Textarea.svelte';
import Toast from '../src/lib/components/Toast.svelte';
import ToastViewport from '../src/lib/components/ToastViewport.svelte';
import Tooltip from '../src/lib/components/Tooltip.svelte';
import FieldHarness from './fixtures/FieldHarness.svelte';
import WorkspaceHarness from './fixtures/WorkspaceHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

const cases: Array<[string, Parameters<typeof render>[0], Record<string, unknown>]> = [
  [
    'Alert',
    Alert,
    { title: 'Export ready', children: text('All checks passed.'), variant: 'success' },
  ],
  ['Badge', Badge, { children: text('Ready'), variant: 'success' }],
  ['Button', Button, { children: text('Create project'), variant: 'primary' }],
  ['Card', Card, { title: 'Terrain project', children: text('Details'), headingLevel: 2 }],
  ['Checkbox', Checkbox, { children: text('Alignment guides') }],
  ['Checkbox (label prop)', Checkbox, { label: 'Alignment guides' }],
  ['Field', FieldHarness, { label: 'Contact email', description: 'Delivery updates only.' }],
  ['Field (invalid)', FieldHarness, { label: 'Contact email', error: 'Enter a full address' }],
  ['IconButton', IconButton, { label: 'Add item', children: text('+') }],
  ['NumberField', NumberField, { label: 'Layer count', min: 1, max: 40, value: 12 }],
  ['Progress', Progress, { value: 72, label: 'Generation progress' }],
  ['Progress (indeterminate)', Progress, { label: 'Uploading' }],
  [
    'RadioGroup',
    RadioGroup,
    {
      label: 'Workspace mode',
      options: [
        { value: 'design', label: 'Design' },
        { value: 'proof', label: 'Proof' },
      ],
    },
  ],
  [
    'Select',
    Select,
    {
      label: 'Export format',
      placeholder: 'Choose a format',
      options: [{ value: 'svg', label: 'SVG vector' }],
    },
  ],
  ['Separator (vertical)', Separator, { orientation: 'vertical' }],
  ['Skeleton', Skeleton, { width: 120, height: 16 }],
  ['Spinner', Spinner, { label: 'Generating preview' }],
  ['Switch', Switch, { children: text('Live preview') }],
  [
    'Table',
    Table,
    { caption: 'Recent projects', children: text('<tbody><tr><td>A</td></tr></tbody>') },
  ],
  ['Textarea', Textarea, { boxed: true, 'aria-label': 'Project note' }],
  [
    'Toast',
    Toast,
    { title: 'Export queued', description: 'Preparing files.', onDismiss: () => {} },
  ],
  ['ToastViewport', ToastViewport, { children: text('<p>Nothing yet</p>') }],
  ['Tooltip', Tooltip, { content: 'Precise settings', trigger: text('Settings') }],
  ['Workspace', WorkspaceHarness, { withSidebar: true, withInspector: true }],
];

describe('component accessibility', () => {
  it.each(cases)('has no axe violations: %s', async (_name, Component, props) => {
    const view = render(Component, props);
    expect((await axe(view.container)).violations).toEqual([]);
    view.unmount();
  });

  it('has no violations while a dialog is open', async () => {
    const user = userEvent.setup();
    const view = render(Dialog, {
      title: 'Export package',
      trigger: text('Open export'),
      children: text('<p>Review the project.</p>'),
      footer: text('<button type="button">Confirm</button>'),
    });
    await user.click(view.getByRole('button', { name: 'Open export' }));
    expect((await axe(document.body)).violations).toEqual([]);
  });
});
