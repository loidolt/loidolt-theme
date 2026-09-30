import { fireEvent, render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Lightbox from '../src/lib/components/Lightbox.svelte';
import MediaCarousel from '../src/lib/components/MediaCarousel.svelte';
import MediaGrid from '../src/lib/components/MediaGrid.svelte';
import type { MediaItem } from '../src/lib/media-utils.js';

const items: MediaItem[] = [
  { kind: 'image', src: 'a.jpg', alt: 'Bracket', caption: 'First cut', download: 'a-full.jpg' },
  { kind: 'image', src: 'b.jpg', alt: 'Coaster' },
  { kind: 'video', src: 'c.mp4', title: 'Cutting run', poster: 'c.jpg' },
  { kind: 'audio', src: 'd.mp3', title: 'Shop talk' },
  { kind: 'embed', url: 'https://youtu.be/dQw4w9WgXcQ', title: 'Assembly guide' },
];

afterEach(() => {
  vi.useRealTimers();
});

describe('Lightbox', () => {
  it('moves with arrows, Home and End, wrapping, and announces each item', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(Lightbox, { items, open: true, onIndexChange, title: 'Cut gallery' });
    const dialog = await screen.findByRole('dialog', { name: 'Cut gallery' });
    expect(within(dialog).getByRole('img', { name: 'Bracket' })).toBeInTheDocument();
    expect(dialog).toHaveTextContent('First cut');
    expect(within(dialog).getByRole('status')).toHaveTextContent('Bracket, 1 of 5');

    await user.keyboard('{ArrowRight}');
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(within(dialog).getByRole('img', { name: 'Coaster' })).toBeInTheDocument();
    await user.keyboard('{End}');
    expect(within(dialog).getByRole('button', { name: 'Play Assembly guide' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(within(dialog).getByRole('img', { name: 'Bracket' })).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(within(dialog).getByText('5 of 5')).toBeInTheDocument();
    await user.keyboard('{Home}');
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByRole('group', { name: 'Cutting run' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByRole('group', { name: 'Shop talk' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Previous' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
  });

  it('zooms images with buttons and keys, and offers a download', async () => {
    const user = userEvent.setup();
    render(Lightbox, { items, open: true, downloadable: true });
    const dialog = await screen.findByRole('dialog');
    const image = within(dialog).getByRole('img', { name: 'Bracket' });
    expect(within(dialog).getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: 'Zoom in' }));
    expect(image.style.transform).toContain('scale(1.5)');
    await user.keyboard('+');
    expect(image.style.transform).toContain('scale(2)');
    await user.keyboard('-');
    await user.keyboard('0');
    expect(image.style.transform).toContain('scale(1)');
    await user.keyboard('=');
    await user.click(within(dialog).getByRole('button', { name: 'Zoom out' }));
    expect(within(dialog).getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      'a-full.jpg'
    );
  });

  it('swipes between items, stops at the ends without loop, and shows thumbnails', async () => {
    const user = userEvent.setup();
    render(Lightbox, { items: items.slice(0, 2), open: true, loop: false, showThumbnails: true });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    const stage = dialog.querySelector('.ldt-lightbox__stage') as HTMLElement;
    await fireEvent.pointerDown(stage, { clientX: 300 });
    await fireEvent.pointerUp(stage, { clientX: 100 });
    expect(within(stage).getByRole('img', { name: 'Coaster' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    await fireEvent.pointerDown(stage, { clientX: 100 });
    await fireEvent.pointerUp(stage, { clientX: 120 });
    expect(within(stage).getByRole('img', { name: 'Coaster' })).toBeInTheDocument();

    const strip = within(dialog).getByRole('listbox', { name: 'All items' });
    await user.click(within(strip).getAllByRole('option')[0]);
    expect(within(stage).getByRole('img', { name: 'Bracket' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from its own trigger', async () => {
    const user = userEvent.setup();
    const { createRawSnippet } = await import('svelte');
    render(Lightbox, {
      items,
      trigger: createRawSnippet(() => ({ render: () => '<span>View gallery</span>' })),
    });
    await user.click(screen.getByRole('button', { name: 'View gallery' }));
    expect(await screen.findByRole('dialog', { name: 'Media viewer' })).toBeInTheDocument();
  });
});

describe('MediaGrid', () => {
  it('is one tab stop of labelled tiles, and opens the lightbox on the pressed one', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(MediaGrid, { items, label: 'Cut gallery', onSelect, gap: 'sm' });
    const list = screen.getByRole('list', { name: 'Cut gallery' });
    const tiles = within(list).getAllByRole('button');
    expect(tiles.map((tile) => tile.getAttribute('aria-label'))).toEqual([
      'Bracket',
      'Coaster',
      'Cutting run, Video',
      'Shop talk, Audio',
      'Assembly guide, Video',
    ]);
    expect(tiles.map((tile) => tile.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    tiles[0].focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(tiles[2]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(2, items[2]);
    const dialog = await screen.findByRole('dialog', { name: 'Cut gallery' });
    expect(within(dialog).getByRole('group', { name: 'Cutting run' })).toBeInTheDocument();
  });

  it('can report presses without a lightbox, in masonry', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(MediaGrid, {
      items: items.slice(0, 2),
      label: 'Sheets',
      lightbox: false,
      variant: 'masonry',
      onSelect,
    });
    expect(screen.getByRole('list')).toHaveClass('ldt-media-grid--masonry');
    await user.click(screen.getByRole('button', { name: 'Coaster' }));
    expect(onSelect).toHaveBeenCalledWith(1, items[1]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('MediaCarousel', () => {
  const slides = items.slice(0, 3);

  it('shows one labelled slide and steps with its buttons and thumbnails', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(MediaCarousel, {
      items: slides,
      label: 'Featured cuts',
      loop: false,
      showThumbnails: true,
      onIndexChange,
    });
    const region = screen.getByRole('region', { name: 'Featured cuts' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    const visible = within(region).getByRole('group', { name: '1 of 3: Bracket' });
    expect(visible).toHaveAttribute('aria-roledescription', 'slide');
    expect(visible).toHaveTextContent('First cut');
    expect(within(region).getByRole('button', { name: 'Previous slide' })).toBeDisabled();

    await user.click(within(region).getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(within(region).getByRole('group', { name: '2 of 3: Coaster' })).toBeVisible();
    // Only the current slide, caption included, is shown.
    expect(region.querySelectorAll('.ldt-media-carousel__slide:not([hidden])')).toHaveLength(1);
    await user.click(within(region).getAllByRole('option')[2]);
    expect(within(region).getByRole('button', { name: 'Next slide' })).toBeDisabled();
    expect(within(region).getByRole('group', { name: 'Cutting run' })).toBeInTheDocument();
  });

  it('rotates on a timer, pausing on hover, focus and the pause button', async () => {
    vi.useFakeTimers();
    const onIndexChange = vi.fn();
    render(MediaCarousel, {
      items: slides,
      label: 'Featured',
      autoplay: true,
      interval: 1000,
      onIndexChange,
    });
    const region = screen.getByRole('region', { name: 'Featured' });
    const viewport = region.querySelector('.ldt-media-carousel__viewport')!;
    expect(viewport).toHaveAttribute('aria-live', 'off');
    await vi.advanceTimersByTimeAsync(1000);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);

    await fireEvent.pointerEnter(region);
    await vi.advanceTimersByTimeAsync(3000);
    expect(onIndexChange).toHaveBeenCalledOnce();
    await fireEvent.pointerLeave(region);

    const pause = within(region).getByRole('button', { name: 'Pause slideshow' });
    await fireEvent.click(pause);
    await vi.advanceTimersByTimeAsync(3000);
    expect(onIndexChange).toHaveBeenCalledOnce();
    expect(viewport).toHaveAttribute('aria-live', 'polite');
    expect(within(region).getByRole('button', { name: 'Start slideshow' })).toBeInTheDocument();

    await fireEvent.focusIn(pause);
    await fireEvent.click(within(region).getByRole('button', { name: 'Start slideshow' }));
    await vi.advanceTimersByTimeAsync(2000);
    expect(onIndexChange).toHaveBeenCalledOnce();
    await fireEvent.focusOut(pause, { relatedTarget: document.body });
    await vi.advanceTimersByTimeAsync(1000);
    // Wraps from the last slide back to the first when looping.
    await vi.advanceTimersByTimeAsync(1000);
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it('starts paused for people who prefer reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('reduce'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    );
    render(MediaCarousel, { items: slides, label: 'Calm', autoplay: true });
    expect(screen.getByRole('button', { name: 'Start slideshow' })).toBeInTheDocument();
  });
});
