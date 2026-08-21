import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import * as lib from '../../src/lib/index.js';
import { createTheme } from '../../src/lib/theme.svelte.js';

/**
 * Server-renders every component with minimal props. This is the README's SSR-safety claim
 * as an assertion: no component may touch `window`/`document` during server render, and id
 * generation must work outside the browser.
 */

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

const tabPanel = createRawSnippet<[{ value: string }]>((args) => ({
  render: () => `<p>Panel ${args().value}</p>`,
}));

const fieldControl = createRawSnippet<[{ id: string; describedBy?: string; invalid: boolean }]>(
  (args) => ({ render: () => `<input id="${args().id}" />` })
);

const options = [
  { value: 'design', label: 'Design' },
  { value: 'proof', label: 'Proof' },
];

const panel = createRawSnippet<[{ value: string }]>((args) => ({
  render: () => `<p>Panel ${args().value}</p>`,
}));

const cases: Array<[keyof typeof lib, Record<string, unknown>]> = [
  ['Accordion', { items: options, children: panel }],
  ['Alert', { title: 'Export ready', children: text('Done.') }],
  ['AlertDialog', { title: 'Delete file?', open: true, trigger: text('Delete') }],
  ['AppShell', { children: text('Content') }],
  ['Badge', { children: text('New') }],
  ['Brand', { name: 'Loidolt', meta: 'Studio' }],
  ['Breadcrumbs', { items: [{ label: 'Projects', href: '/' }, { label: 'Terrain' }] }],
  ['Button', { children: text('Save') }],
  ['Button (loading)' as 'Button', { children: text('Save'), loading: true }],
  ['Card', { title: 'Terrain', children: text('Body') }],
  ['Checkbox', { label: 'Guides' }],
  ['ContextBar', { section: 'Files', title: 'terrain.svg' }],
  [
    'Dialog',
    { title: 'Confirm', open: true, trigger: text('Open'), children: text('Are you sure?') },
  ],
  ['Drawer', { title: 'Navigation', open: true, children: text('Links') }],
  ['DropdownMenu', { trigger: text('Actions'), items: options, open: true }],
  ['EmptyState', { title: 'No projects yet' }],
  ['Field', { label: 'Email', children: fieldControl }],
  ['Fieldset', { legend: 'Output', children: text('<input />') }],
  ['IconButton', { label: 'Close', children: text('×') }],
  ['Input', { 'aria-label': 'Name' }],
  ['Label', { for: 'x', children: text('Name') }],
  ['NavMenu', { label: 'Projects', items: options }],
  ['NumberField', { label: 'Count' }],
  ['PageHeader', { title: 'Terrain' }],
  ['Pagination', { count: 120 }],
  ['Panel', { title: 'Layers', children: text('Body') }],
  ['Popover', { trigger: text('Filters'), children: text('Options'), open: true }],
  ['Progress', { value: 40, label: 'Upload' }],
  ['RadioGroup', { label: 'Mode', options }],
  ['Section', { title: 'Recent', children: text('Body') }],
  ['Select', { label: 'Format', options }],
  ['Separator', {}],
  ['Sidebar', { children: text('Nav') }],
  ['Skeleton', {}],
  ['Spinner', { label: 'Loading' }],
  ['Switch', { children: text('Live preview') }],
  ['Table', { caption: 'Projects', children: text('<tbody><tr><td>A</td></tr></tbody>') }],
  ['TableHeader', { children: text('Name') }],
  ['Tabs', { label: 'Views', tabs: options, children: tabPanel }],
  ['Textarea', { 'aria-label': 'Notes' }],
  ['ThemeToggle', { theme: createTheme({ storageKey: null }) }],
  ['Toast', { title: 'Saved' }],
  ['ToastViewport', { children: text('None yet') }],
  ['ToggleGroup', { options, label: 'Mode' }],
  ['Tooltip', { content: 'Tip', trigger: text('Info') }],
  ['TooltipProvider', { children: text('Content') }],
  ['Topbar', { brand: text('Loidolt') }],
  ['Workspace', { children: text('Main') }],
];

describe('server-side rendering', () => {
  it.each(cases)('renders %s on the server', (name, props) => {
    const key = (name as string).replace(/ \(.+\)$/, '') as keyof typeof lib;
    const Component = lib[key] as Parameters<typeof render>[0];
    const result = render(Component, { props: props as never });
    expect(result.body.length).toBeGreaterThan(0);
  });

  it('covers every exported component', () => {
    const exported = Object.keys(lib).filter(
      (name) => /^[A-Z]/.test(name) && !name.endsWith('Primitive')
    );
    const tested = new Set(cases.map(([name]) => (name as string).replace(/ \(.+\)$/, '')));
    expect([...tested].sort()).toEqual(exported.sort());
  });

  it('renders SSR-stable generated ids', () => {
    const first = render(lib.Field as Parameters<typeof render>[0], {
      props: { label: 'Email', children: fieldControl } as never,
    });
    expect(first.body).toMatch(/id="[^"]+"/);
  });
});
