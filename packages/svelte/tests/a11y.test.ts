import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import Accordion from '../src/lib/components/Accordion.svelte';
import Alert from '../src/lib/components/Alert.svelte';
import AlertDialog from '../src/lib/components/AlertDialog.svelte';
import AppShell from '../src/lib/components/AppShell.svelte';
import Badge from '../src/lib/components/Badge.svelte';
import Brand from '../src/lib/components/Brand.svelte';
import Breadcrumbs from '../src/lib/components/Breadcrumbs.svelte';
import Button from '../src/lib/components/Button.svelte';
import Card from '../src/lib/components/Card.svelte';
import Checkbox from '../src/lib/components/Checkbox.svelte';
import ContextBar from '../src/lib/components/ContextBar.svelte';
import Dialog from '../src/lib/components/Dialog.svelte';
import Drawer from '../src/lib/components/Drawer.svelte';
import DropdownMenu from '../src/lib/components/DropdownMenu.svelte';
import EmptyState from '../src/lib/components/EmptyState.svelte';
import IconButton from '../src/lib/components/IconButton.svelte';
import Input from '../src/lib/components/Input.svelte';
import Label from '../src/lib/components/Label.svelte';
import PageHeader from '../src/lib/components/PageHeader.svelte';
import Pagination from '../src/lib/components/Pagination.svelte';
import Panel from '../src/lib/components/Panel.svelte';
import Popover from '../src/lib/components/Popover.svelte';
import Section from '../src/lib/components/Section.svelte';
import Tabs from '../src/lib/components/Tabs.svelte';
import ToggleGroup from '../src/lib/components/ToggleGroup.svelte';
import Topbar from '../src/lib/components/Topbar.svelte';
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
import FieldsetHarness from './fixtures/FieldsetHarness.svelte';
import TableHarness from './fixtures/TableHarness.svelte';
import WorkspaceHarness from './fixtures/WorkspaceHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

// jsdom cannot compute pseudo-element styles, which makes axe's contrast rule emit misleading
// "not implemented" warnings. Chromium owns that style-dependent rule in tests/e2e; this suite
// keeps the fast semantic checks.
const scan = (element: Element) =>
  axe(element, { rules: { 'color-contrast': { enabled: false } } });

/** Snippet whose markup uses the parameter Tabs passes to its panel. */
const tabPanel = createRawSnippet<[{ value: string }]>((args) => ({
  render: () => `<p>Panel ${args().value}</p>`,
}));

/** Snippet whose markup uses the parameter Accordion passes to its panel. */
const disclosurePanel = createRawSnippet<[{ value: string }]>((args) => ({
  render: () => `<p>Body ${args().value}</p>`,
}));

const cases: Array<[string, Parameters<typeof render>[0], Record<string, unknown>]> = [
  [
    'Alert',
    Alert,
    { title: 'Export ready', children: text('All checks passed.'), variant: 'success' },
  ],
  ['Alert (body only)', Alert, { children: text('2 fields need attention.') }],
  ['AppShell', AppShell, { children: text('<p>Content</p>') }],
  [
    'Accordion',
    Accordion,
    {
      items: [
        { value: 'materials', title: 'Materials' },
        { value: 'tolerances', title: 'Tolerances' },
      ],
      children: disclosurePanel,
      value: 'materials',
    },
  ],
  [
    'Breadcrumbs',
    Breadcrumbs,
    { items: [{ label: 'Projects', href: '/projects' }, { label: 'Terrain' }] },
  ],
  ['Brand', Brand, { name: 'Loidolt', meta: 'Studio' }],
  ['ContextBar', ContextBar, { section: 'Files', title: 'terrain.svg' }],
  ['Input', Input, { 'aria-label': 'Project name' }],
  ['Label', Label, { for: 'field-1', children: text('Project name') }],
  ['PageHeader', PageHeader, { eyebrow: 'Projects', title: 'Terrain' }],
  ['Panel', Panel, { title: 'Layers', children: text('<p>Contents</p>') }],
  ['Section', Section, { title: 'Recent', children: text('<p>Contents</p>') }],
  [
    'Tabs',
    Tabs,
    {
      label: 'Project views',
      tabs: [
        { value: 'design', label: 'Design' },
        { value: 'proof', label: 'Proof' },
      ],
      children: tabPanel,
    },
  ],
  ['Topbar', Topbar, { brand: text('<span>Loidolt</span>') }],
  ['Badge', Badge, { children: text('Ready'), variant: 'success' }],
  ['Button', Button, { children: text('Create project'), variant: 'primary' }],
  ['Card', Card, { title: 'Terrain project', children: text('Details'), headingLevel: 2 }],
  ['Checkbox', Checkbox, { children: text('Alignment guides') }],
  ['Checkbox (label prop)', Checkbox, { label: 'Alignment guides' }],
  ['Field', FieldHarness, { label: 'Contact email', description: 'Delivery updates only.' }],
  ['Field (invalid)', FieldHarness, { label: 'Contact email', error: 'Enter a full address' }],
  [
    'EmptyState',
    EmptyState,
    {
      title: 'No projects yet',
      description: 'Create one to get going.',
      actions: text('<button type="button">New project</button>'),
    },
  ],
  ['Fieldset', FieldsetHarness, { legend: 'Output formats', description: 'Pick at least one.' }],
  ['Fieldset (invalid)', FieldsetHarness, { legend: 'Output formats', error: 'Choose a format' }],
  ['IconButton', IconButton, { label: 'Add item', children: text('+') }],
  ['Pagination', Pagination, { count: 120, perPage: 10, page: 3 }],
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
  ['Table (sortable)', TableHarness, { rows: [{ name: 'bracket.svg', sheets: 3 }] }],
  ['Table (empty)', TableHarness, { rows: [] }],
  ['Textarea', Textarea, { boxed: true, 'aria-label': 'Project note' }],
  [
    'ToggleGroup',
    ToggleGroup,
    {
      label: 'Tool',
      value: 'select',
      options: [
        { value: 'select', label: 'Select' },
        { value: 'draw', label: 'Draw' },
      ],
    },
  ],
  [
    'ToggleGroup (multiple)',
    ToggleGroup,
    {
      label: 'Layers',
      multiple: true,
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'guides', label: 'Guides' },
      ],
    },
  ],
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
    expect((await scan(view.container)).violations).toEqual([]);
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
    expect((await scan(document.body)).violations).toEqual([]);
  });

  it('has no violations while a drawer is open', async () => {
    const user = userEvent.setup();
    const view = render(Drawer, {
      title: 'Navigation',
      trigger: text('Menu'),
      children: text('<p>Links go here.</p>'),
    });
    await user.click(view.getByRole('button', { name: 'Menu' }));
    expect((await scan(document.body)).violations).toEqual([]);
  });

  it('has no violations while a confirmation is open', async () => {
    const user = userEvent.setup();
    const view = render(AlertDialog, {
      title: 'Delete terrain.svg?',
      description: 'This cannot be undone.',
      trigger: text('<span>Delete</span>'),
      confirmVariant: 'danger',
    });
    await user.click(view.getByRole('button', { name: 'Delete' }));
    expect((await scan(document.body)).violations).toEqual([]);
  });

  it('has no violations while a dropdown menu is open', async () => {
    const user = userEvent.setup();
    const view = render(DropdownMenu, {
      trigger: text('Actions'),
      groupLabel: 'Project',
      items: [
        { value: 'rename', label: 'Rename', hint: '⌘R' },
        { value: 'delete', label: 'Delete' },
      ],
    });
    await user.click(view.getByRole('button', { name: 'Actions' }));
    // Floating content stays visibility:hidden in jsdom; wait on text, not role-by-name.
    await view.findByText('Rename');
    expect((await scan(document.body)).violations).toEqual([]);
  });

  it('has no violations while a popover is open', async () => {
    const user = userEvent.setup();
    const view = render(Popover, {
      trigger: text('Filters'),
      children: text('<p>Filter options.</p>'),
    });
    await user.click(view.getByRole('button', { name: 'Filters' }));
    expect((await scan(document.body)).violations).toEqual([]);
  });
});
