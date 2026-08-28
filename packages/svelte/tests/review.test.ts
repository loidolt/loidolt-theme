import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import Card from '../src/lib/components/Card.svelte';
import CodeBlock from '../src/lib/components/CodeBlock.svelte';
import CommentList from '../src/lib/components/CommentList.svelte';
import Dialog from '../src/lib/components/Dialog.svelte';
import FileInput from '../src/lib/components/FileInput.svelte';
import Filmstrip from '../src/lib/components/Filmstrip.svelte';
import FloatingBar from '../src/lib/components/FloatingBar.svelte';
import ListRow from '../src/lib/components/ListRow.svelte';
import Marker from '../src/lib/components/Marker.svelte';
import Popover from '../src/lib/components/Popover.svelte';
import RecordStepper from '../src/lib/components/RecordStepper.svelte';
import SegmentedNav from '../src/lib/components/SegmentedNav.svelte';
import Stat from '../src/lib/components/Stat.svelte';
import StatusDot from '../src/lib/components/StatusDot.svelte';
import SwatchGroup from '../src/lib/components/SwatchGroup.svelte';
import Thumbnail from '../src/lib/components/Thumbnail.svelte';
import Workspace from '../src/lib/components/Workspace.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => value }));

const scan = (element: Element) =>
  axe(element, { rules: { 'color-contrast': { enabled: false } } });

const stripItem = createRawSnippet<[{ id: string }, boolean]>((entry) => ({
  render: () => `<span>${entry().id}</span>`,
}));

describe('Card href', () => {
  it('renders an anchor card when href is set', () => {
    const { container } = render(Card, {
      props: { href: '/artworks/a1', title: 'Terrain', children: text('<p>Body</p>') } as never,
    });
    const root = container.querySelector('a.ldt-card');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('href', '/artworks/a1');
    expect(root).toHaveClass('ldt-card--link');
  });

  it('stays a plain container without href', () => {
    const { container } = render(Card, {
      props: { title: 'Terrain', children: text('<p>Body</p>') } as never,
    });
    expect(container.querySelector('a.ldt-card')).toBeNull();
    expect(container.querySelector('div.ldt-card')).not.toBeNull();
  });
});

describe('Workspace header and mainClass', () => {
  it('renders the header row spanning the grid', () => {
    const { container } = render(Workspace, {
      props: { header: text('<p>Bar</p>'), children: text('<p>Main</p>') } as never,
    });
    expect(container.querySelector('.ldt-workspace')).toHaveClass('ldt-workspace--header');
    expect(container.querySelector('.ldt-workspace__header')).not.toBeNull();
  });

  it('passes mainClass through to the main pane', () => {
    const { container } = render(Workspace, {
      props: { children: text('<p>Main</p>'), mainClass: 'proof-main' } as never,
    });
    expect(container.querySelector('.ldt-workspace__main')).toHaveClass('proof-main');
  });
});

describe('overlay trigger variants', () => {
  it('composes the trigger class from variant and size', () => {
    render(Dialog, {
      props: {
        title: 'Confirm',
        trigger: text('Open'),
        triggerVariant: 'danger',
        triggerSize: 'sm',
        children: text('<p>Sure?</p>'),
      } as never,
    });
    const trigger = screen.getByRole('button', { name: 'Open' });
    expect(trigger).toHaveClass('ldt-button', 'ldt-button--danger', 'ldt-button--sm');
  });

  it('lets an explicit triggerClass win wholesale', () => {
    render(Dialog, {
      props: {
        title: 'Confirm',
        trigger: text('Open'),
        triggerVariant: 'danger',
        triggerClass: 'custom-trigger',
        children: text('<p>Sure?</p>'),
      } as never,
    });
    const trigger = screen.getByRole('button', { name: 'Open' });
    expect(trigger).toHaveClass('custom-trigger');
    expect(trigger).not.toHaveClass('ldt-button--danger');
  });

  it('keeps the quiet default on Popover triggers', () => {
    render(Popover, {
      props: { trigger: text('Filters'), children: text('<p>Body</p>') } as never,
    });
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveClass('ldt-button--quiet');
  });
});

describe('StatusDot', () => {
  it('names the state for screen readers', async () => {
    const { container } = render(StatusDot, {
      props: { variant: 'success', label: 'Approved' },
    });
    expect(container.querySelector('.ldt-status-dot--success')).not.toBeNull();
    expect(screen.getByText('Approved')).toHaveClass('ldt-sr-only');
    expect((await scan(container)).violations).toEqual([]);
  });
});

describe('Marker', () => {
  it('renders number, pin shape, and active outline', () => {
    const { container } = render(Marker, {
      props: { number: 3, shape: 'pin', active: true, label: 'Comment 3' },
    });
    const marker = container.querySelector('.ldt-marker');
    expect(marker).toHaveClass('ldt-marker--pin', 'ldt-marker--active');
    expect(marker).toHaveTextContent('3');
  });
});

describe('Thumbnail', () => {
  it('sets the ratio custom property and renders the image', () => {
    const { container } = render(Thumbnail, {
      props: { src: 'x.svg', alt: 'Preview', ratio: '1/1', surface: 'paper' },
    });
    const figure = container.querySelector('figure.ldt-thumbnail');
    expect(figure).toHaveClass('ldt-thumbnail--paper');
    expect(figure?.getAttribute('style')).toContain('--ldt-thumbnail-ratio: 1/1');
    expect(container.querySelector('img.ldt-thumbnail__image')).toHaveAttribute('alt', 'Preview');
  });
});

describe('CodeBlock', () => {
  it('copies the code and announces it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(CodeBlock, { props: { code: 'sk_live_abc', copyable: true } });
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('sk_live_abc');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  it('marks the selectable variant', () => {
    const { container } = render(CodeBlock, { props: { code: 'x' } });
    expect(container.querySelector('.ldt-code-block')).toHaveClass('ldt-code-block--selectable');
  });
});

describe('FileInput', () => {
  it('fires onFiles when a file is chosen', async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    render(FileInput, { props: { 'aria-label': 'Artwork', onFiles } });
    const input = screen.getByLabelText('Artwork') as HTMLInputElement;
    await user.upload(input, new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' }));
    expect(onFiles).toHaveBeenCalledOnce();
    expect(onFiles.mock.calls[0][0][0].name).toBe('a.svg');
  });
});

describe('ListRow', () => {
  it('is a button with aria-pressed when selected', () => {
    render(ListRow, { props: { selected: true, children: text('Row') } as never });
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is a link with aria-current when href is set', () => {
    render(ListRow, { props: { href: '/x', selected: true, children: text('Row') } as never });
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'true');
  });
});

describe('Stat', () => {
  it('renders value, label, and the link form', () => {
    const { container } = render(Stat, {
      props: { value: 12, label: 'Artworks', href: '/artworks' } as never,
    });
    const root = container.querySelector('a.ldt-stat');
    expect(root).toHaveAttribute('href', '/artworks');
    expect(root).toHaveTextContent('12');
    expect(root).toHaveTextContent('Artworks');
  });
});

describe('RecordStepper', () => {
  it('steps and disables at the ends', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(RecordStepper, { props: { index: 0, total: 3, onPrevious, onNext } });
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNext).toHaveBeenCalledOnce();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('disables next on the last record', () => {
    render(RecordStepper, { props: { index: 2, total: 3 } });
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});

describe('FloatingBar', () => {
  it('is a named group at its placement', async () => {
    const { container } = render(FloatingBar, {
      props: { label: 'Zoom', placement: 'top-start', children: text('<button>+</button>') },
    });
    const bar = screen.getByRole('group', { name: 'Zoom' });
    expect(bar).toHaveClass('ldt-floating-bar--top-start');
    expect((await scan(container)).violations).toEqual([]);
  });
});

describe('SegmentedNav', () => {
  it('renders real links and marks the current page', async () => {
    const { container } = render(SegmentedNav, {
      props: {
        label: 'Rounds',
        items: [
          { label: 'R1', href: '#r1' },
          { label: 'R2', href: '#r2', current: true, hint: 'latest' },
        ],
      },
    });
    const current = screen.getByRole('link', { name: /R2/ });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveTextContent('latest');
    expect(screen.getByRole('link', { name: 'R1' })).not.toHaveAttribute('aria-current');
    expect((await scan(container)).violations).toEqual([]);
  });
});

describe('Filmstrip', () => {
  it('selects on click and reports listbox semantics', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(Filmstrip, {
      props: {
        items: [{ id: 'a' }, { id: 'b' }],
        selectedId: 'a',
        onSelect,
        label: 'Outputs',
        item: stripItem,
      } as never,
    });
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(options[1]);
    expect(onSelect).toHaveBeenCalledWith('b');
    expect((await scan(container)).violations).toEqual([]);
  });
});

describe('CommentList', () => {
  it('renders author, meta, body, and markers', () => {
    render(CommentList, {
      props: {
        items: [
          { id: 'c1', author: 'Jane', meta: '· 3 Jun', body: 'Off-center.', marker: 1 },
          { id: 'c2', author: 'Studio', body: 'Fixed.' },
        ],
      } as never,
    });
    expect(screen.getByText(/Jane · 3 Jun/)).toBeInTheDocument();
    expect(screen.getByText('Off-center.')).toBeInTheDocument();
    expect(document.querySelector('.ldt-marker')).toHaveTextContent('1');
  });

  it('highlights the active item', () => {
    const { container } = render(CommentList, {
      props: {
        items: [{ id: 'c1', author: 'Jane', body: 'Hi', marker: 1 }],
        activeId: 'c1',
      } as never,
    });
    expect(container.querySelector('.ldt-comment')).toHaveClass('ldt-comment--active');
  });
});

describe('SwatchGroup', () => {
  it('is a labelled radio group and reports the chosen color', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(SwatchGroup, {
      props: {
        label: 'Accent',
        value: 'a',
        onValueChange,
        options: [
          { value: 'a', color: '#c94f2a', label: 'Terracotta' },
          { value: 'b', color: '#3a6ea5', label: 'Slate' },
        ],
      } as never,
    });
    expect(screen.getByRole('radio', { name: 'Terracotta' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Slate' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect((await scan(container)).violations).toEqual([]);
  });
});
