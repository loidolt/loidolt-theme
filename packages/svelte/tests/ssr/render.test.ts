import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import * as lib from '../../src/lib/index.js';
import { createDataTable } from '../../src/lib/data-table.svelte.js';
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

const stripItem = createRawSnippet<[{ id: string }, boolean]>((entry) => ({
  render: () => `<span>${entry().id}</span>`,
}));

const sheets = createDataTable({
  data: Array.from({ length: 12 }, (_, index) => ({ id: `s${index}`, name: `Sheet ${index}` })),
  columns: [{ id: 'name', header: 'Name', sortable: true, editable: true }],
  getRowId: (row) => row.id,
  pageSize: 5,
  selection: 'multiple',
});

const gallery = [
  { kind: 'image' as const, src: 'a.jpg', alt: 'Bracket', caption: 'First cut' },
  { kind: 'video' as const, src: 'c.mp4', title: 'Cutting run' },
  { kind: 'audio' as const, src: 'd.mp3', title: 'Talk' },
  { kind: 'embed' as const, url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Guide' },
];

// A `Name (variant)` label renders the same export again with different props.
type CaseName = keyof typeof lib | `${keyof typeof lib} (${string})`;

const cases: Array<[CaseName, Record<string, unknown>]> = [
  ['Accordion', { items: options, children: panel }],
  ['ActiveFilterChips', { items: options, onRemove: () => {}, onClearAll: () => {} }],
  ['Alert', { title: 'Export ready', children: text('Done.') }],
  ['AlertDialog', { title: 'Delete file?', open: true, trigger: text('Delete') }],
  ['AppShell', { children: text('Content') }],
  ['AspectRatio', { ratio: 'square', children: text('Box') }],
  ['AudioPlayer', { src: 'talk.mp3', title: 'Shop talk', artwork: 'a.jpg' }],
  ['Avatar', { name: 'Ada Lovelace', src: '/ada.png' }],
  ['Badge', { children: text('New') }],
  ['Brand', { name: 'Loidolt', meta: 'Studio' }],
  ['Breadcrumbs', { items: [{ label: 'Projects', href: '/' }, { label: 'Terrain' }] }],
  ['Button', { children: text('Save') }],
  ['Button (loading)' as 'Button', { children: text('Save'), loading: true }],
  ['Combobox', { label: 'Stock', value: 'birch', options }],
  ['Card', { title: 'Terrain', children: text('Body') }],
  ['Checkbox', { label: 'Guides' }],
  ['CodeBlock', { code: 'sk_live_abc', copyable: true }],
  ['CommentList', { items: [{ id: 'c1', author: 'Jane', body: 'Looks good.', marker: 1 }] }],
  ['ContextBar', { section: 'Files', title: 'terrain.svg' }],
  [
    'Dialog',
    { title: 'Confirm', open: true, trigger: text('Open'), children: text('Are you sure?') },
  ],
  ['DataTable', { table: sheets, caption: 'Sheets', onCellEdit: () => {} }],
  ['DataTable (virtual)' as 'DataTable', { table: sheets, virtual: { rowHeight: 40 } }],
  ['DataTable (loading)' as 'DataTable', { table: sheets, loading: true }],
  ['DataTableColumnVisibility', { table: sheets }],
  ['DataTableFacetedFilter', { table: sheets, column: 'name' }],
  ['DataTablePagination', { table: sheets }],
  ['DataTableSearch', { table: sheets }],
  ['Drawer', { title: 'Navigation', open: true, children: text('Links') }],
  ['DropdownMenu', { trigger: text('Actions'), items: options, open: true }],
  ['EmptyState', { title: 'No projects yet' }],
  ['Field', { label: 'Email', children: fieldControl }],
  ['FileInput', { 'aria-label': 'Artwork file' }],
  ['FilterPanel', { open: true, activeCount: 1, onClear: () => {}, children: text('Filters') }],
  ['Filmstrip', { items: [{ id: 'a' }, { id: 'b' }], label: 'Outputs', item: stripItem }],
  ['FloatingBar', { label: 'Zoom', children: text('+') }],
  ['Fieldset', { legend: 'Output', children: text('<input />') }],
  ['IconButton', { label: 'Close', children: text('×') }],
  ['Input', { 'aria-label': 'Name' }],
  ['Label', { for: 'x', children: text('Name') }],
  ['Lightbox', { items: gallery, open: true, showThumbnails: true }],
  ['ListRow', { children: text('Row') }],
  ['ListRow (link)' as 'ListRow', { children: text('Row'), href: '/x', selected: true }],
  ['LiveRegion', { message: 'Saved' }],
  ['MediaCarousel', { items: gallery, label: 'Featured', showThumbnails: true, autoplay: true }],
  ['MediaEmbed', { url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Guide', poster: 'still.jpg' }],
  ['Marker', { number: 3, label: 'Comment 3' }],
  ['MultiSelect', { label: 'Stock', value: ['design'], options }],
  ['MediaGrid', { items: gallery, label: 'Gallery', variant: 'masonry' }],
  ['NavMenu', { label: 'Projects', items: options }],
  ['NumberField', { label: 'Count' }],
  ['OTPInput', { label: 'Code', groupSize: 3 }],
  ['PasswordInput', { 'aria-label': 'Password' }],
  ['PageHeader', { title: 'Terrain' }],
  ['Pagination', { count: 120 }],
  ['Panel', { title: 'Layers', children: text('Body') }],
  ['Popover', { trigger: text('Filters'), children: text('Options'), open: true }],
  [
    'PresetPicker',
    {
      theme: createTheme({
        storageKey: null,
        presets: ['loidolt', 'soft'],
        presetStorageKey: null,
      }),
    },
  ],
  [
    'PresetPicker (select)',
    {
      theme: createTheme({
        storageKey: null,
        presets: ['loidolt', 'soft'],
        presetStorageKey: null,
      }),
      variant: 'select',
    },
  ],
  ['Progress', { value: 40, label: 'Upload' }],
  ['RadioGroup', { label: 'Mode', options }],
  ['RecordStepper', { index: 0, total: 5 }],
  ['Section', { title: 'Recent', children: text('Body') }],
  ['SegmentedNav', { items: [{ label: 'R1', href: '#r1', current: true }] }],
  ['Select', { label: 'Format', options }],
  ['Separator', {}],
  ['Sidebar', { children: text('Nav') }],
  ['Skeleton', {}],
  ['SignaturePad', { label: 'Signature', name: 'signature' }],
  [
    'SignaturePad (typed)' as 'SignaturePad',
    {
      label: 'Signature',
      mode: 'type',
      fonts: [
        { family: 'serif', label: 'Formal' },
        { family: 'cursive', label: 'Script' },
      ],
    },
  ],
  ['SkipLink', { targetId: 'main' }],
  ['Slider', { label: 'Kerf', value: [2, 8], showValue: true, name: 'kerf' }],
  ['Spinner', { label: 'Loading' }],
  ['Stat', { value: 12, label: 'Artworks' }],
  ['StatusDot', { variant: 'success', label: 'Approved' }],
  [
    'SwatchGroup',
    { label: 'Color', options: [{ value: 'a', color: '#c94f2a', label: 'Terracotta' }] },
  ],
  ['Switch', { children: text('Live preview') }],
  ['Table', { caption: 'Projects', children: text('<tbody><tr><td>A</td></tr></tbody>') }],
  ['TableHeader', { children: text('Name') }],
  ['Tabs', { label: 'Views', tabs: options, children: tabPanel }],
  [
    'Tabs (rail)',
    {
      label: 'Settings',
      tabs: options,
      variant: 'rail',
      orientation: 'vertical',
      panelHeader: text('Search'),
      children: tabPanel,
    },
  ],
  ['Textarea', { 'aria-label': 'Notes' }],
  ['ThemeToggle', { theme: createTheme({ storageKey: null }) }],
  ['Toast', { title: 'Saved' }],
  ['ToastViewport', { children: text('None yet') }],
  ['ToggleGroup', { options, label: 'Mode' }],
  ['Thumbnail', { alt: '', src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>' }],
  ['Toolbar', { label: 'Tools', roving: true, children: text('Search'), end: text('View') }],
  ['Tooltip', { content: 'Tip', trigger: text('Info') }],
  ['TooltipProvider', { children: text('Content') }],
  ['Topbar', { brand: text('Loidolt') }],
  [
    'VideoPlayer',
    {
      src: 'live.m3u8',
      label: 'Live',
      tracks: [{ src: 'en.vtt', srclang: 'en', label: 'English' }],
    },
  ],
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
