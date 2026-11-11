import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import ImageViewer from '../src/lib/components/ImageViewer.svelte';
import { createMediaZoom } from '../src/lib/media-zoom.svelte.js';
import type { ImageRegion } from '../src/lib/types.js';

/** A frame of a fixed size, the way jsdom never lays one out on its own. */
function sized(node: HTMLElement, width: number, height: number) {
  Object.defineProperty(node, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(node, 'clientHeight', { configurable: true, value: height });
  node.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0 }) as DOMRect;
  return node;
}

describe('createMediaZoom in content mode', () => {
  it('fits by width, height or whole, with scales below 1', () => {
    const frame = sized(document.createElement('div'), 400, 300);
    const zoom = createMediaZoom({ contentSize: { width: 1000, height: 1500 } });
    zoom.attach(frame);
    // Whole: 300 / 1500, centred across.
    expect(zoom.scale).toBeCloseTo(0.2);
    expect(zoom.fitMode).toBe('contain');
    expect(zoom.x).toBeCloseTo(100);
    expect(zoom.y).toBe(0);
    expect(zoom.zoomed).toBe(false);
    expect(zoom.pannable).toBe(false);
    // The whole fit is the floor here (it is below minScale), and the ceiling is maxScale.
    expect(zoom.canZoomOut).toBe(false);
    expect(zoom.canZoomIn).toBe(true);
    zoom.fit('width');
    expect(zoom.scale).toBeCloseTo(0.4);
    expect([zoom.x, zoom.y]).toEqual([0, 0]);
    expect(zoom.pannable).toBe(true);
    zoom.fit('height');
    expect(zoom.scale).toBeCloseTo(0.2);
    expect(zoom.transform).toBe(`translate(${zoom.x}px, 0px) scale(${zoom.scale})`);
    zoom.destroy();
  });

  it('zooms around a point, pans within bounds and reveals a rectangle', () => {
    const onScaleChange = vi.fn();
    const frame = sized(document.createElement('div'), 400, 300);
    const zoom = createMediaZoom({ stepFactor: 2, onScaleChange });
    zoom.setContentSize(800, 600); // before the frame: fitted once it has a size
    expect(zoom.contentSize).toEqual({ width: 800, height: 600 });
    zoom.attach(frame);
    expect(zoom.scale).toBe(0.5);

    // The content point under (100, 100) stays put.
    zoom.zoomTo(1, { x: 100, y: 100 });
    expect(zoom.scale).toBe(1);
    expect([zoom.x, zoom.y]).toEqual([-100, -100]);
    expect(zoom.fitMode).toBeNull();
    expect(zoom.zoomed).toBe(true);

    zoom.pan(1000, 1000);
    expect([zoom.x, zoom.y]).toEqual([0, 0]);
    zoom.pan(-5000, -5000);
    expect([zoom.x, zoom.y]).toEqual([-400, -300]);

    zoom.zoomIn();
    expect(zoom.scale).toBe(2);
    zoom.zoomOut();
    expect(zoom.scale).toBe(1);

    // Out of view: centred on it.
    zoom.reveal({ x: 10, y: 10, width: 20, height: 20 }, 0);
    expect([zoom.x, zoom.y]).toEqual([0, 0]);
    // Already in view: nothing moves.
    zoom.reveal({ x: 50, y: 50, width: 20, height: 20 }, 0);
    expect([zoom.x, zoom.y]).toEqual([0, 0]);
    // Bigger than the frame: zoomed out to fit it.
    zoom.zoomTo(4);
    zoom.reveal({ x: 0, y: 0, width: 600, height: 100 }, 0);
    expect(zoom.scale).toBeCloseTo(400 / 600);
    expect(onScaleChange).toHaveBeenCalled();

    // Zoomed in: back to the whole fit, then on to the default doubleTapScale.
    zoom.toggle();
    expect(zoom.scale).toBe(0.5);
    zoom.toggle();
    expect(zoom.scale).toBe(2);
    zoom.zoomTo(1);
    zoom.reset();
    expect(zoom.fitMode).toBe('contain');

    zoom.setContentSize(400, 300);
    expect(zoom.scale).toBe(1);
    zoom.zoomTo(2);
    zoom.setContentSize(800, 600);
    expect(zoom.scale).toBe(2);
    zoom.setContentSize(0, 0);
    expect(zoom.contentSize).toBeNull();
    zoom.destroy();
  });

  it('handles the wheel, double-click, pinch and drags with the pointer', async () => {
    const frame = sized(document.createElement('div'), 400, 300);
    const inner = frame.appendChild(document.createElement('button'));
    const pressed = vi.fn();
    inner.addEventListener('click', pressed);
    document.body.append(frame);
    const zoom = createMediaZoom({
      contentSize: { width: 800, height: 600 },
      zoomToPointer: true,
      wheelPan: true,
      doubleTapScale: 1,
    });
    zoom.attach(frame);

    // Not pannable at the whole fit: a plain wheel is left to the page.
    await fireEvent.wheel(frame, { deltaY: 100 });
    expect(zoom.y).toBe(0);
    await fireEvent.dblClick(frame, { clientX: 0, clientY: 0 });
    expect(zoom.scale).toBe(1);
    expect([zoom.x, zoom.y]).toEqual([0, 0]);
    await fireEvent.wheel(frame, { deltaY: 100 });
    expect(zoom.y).toBe(-100);
    await fireEvent.wheel(frame, { deltaY: 100, shiftKey: true });
    expect(zoom.x).toBe(-100);
    await fireEvent.wheel(frame, { deltaY: -100, ctrlKey: true, clientX: 0, clientY: 0 });
    expect(zoom.scale).toBeGreaterThan(1);
    await fireEvent.dblClick(frame);
    expect(zoom.scale).toBe(0.5);

    // A short press on a control is still a click.
    zoom.zoomTo(1);
    await fireEvent.pointerDown(inner, { pointerId: 1, clientX: 100, clientY: 100 });
    await fireEvent.pointerMove(inner, { pointerId: 1, clientX: 101, clientY: 101 });
    await fireEvent.pointerUp(inner, { pointerId: 1 });
    await fireEvent.click(inner);
    expect(pressed).toHaveBeenCalledOnce();
    // A drag pans, and the click it ends with is swallowed.
    const before = zoom.x;
    await fireEvent.pointerDown(inner, { pointerId: 1, clientX: 100, clientY: 100 });
    await fireEvent.pointerMove(inner, { pointerId: 1, clientX: 80, clientY: 100 });
    await fireEvent.pointerMove(inner, { pointerId: 1, clientX: 60, clientY: 100 });
    await fireEvent.pointerUp(inner, { pointerId: 1 });
    await fireEvent.click(inner);
    expect(zoom.x).toBe(before - 40);
    expect(pressed).toHaveBeenCalledOnce();

    // Two fingers pinch around their midpoint.
    await fireEvent.pointerDown(frame, { pointerId: 1, clientX: 100, clientY: 100 });
    await fireEvent.pointerDown(frame, { pointerId: 2, clientX: 110, clientY: 100 });
    await fireEvent.pointerMove(frame, { pointerId: 1, clientX: 90, clientY: 100 });
    await fireEvent.pointerMove(frame, { pointerId: 2, clientX: 120, clientY: 100 });
    expect(zoom.scale).toBeGreaterThan(1);
    await fireEvent.pointerUp(frame, { pointerId: 1 });
    await fireEvent.pointerUp(frame, { pointerId: 2 });
    zoom.destroy();
    frame.remove();
  });

  it('keeps the frame-filling mode as it was, with an optional anchor', () => {
    const frame = sized(document.createElement('div'), 200, 100);
    const zoom = createMediaZoom({ maxScale: 3 });
    zoom.attach(frame);
    expect(zoom.contentSize).toBeNull();
    zoom.zoomTo(2, { x: 200, y: 100 });
    // Scaled about the centre: the bottom-right corner stays where it was.
    expect([zoom.x, zoom.y]).toEqual([-100, -50]);
    zoom.pan(-500, 0);
    expect(zoom.x).toBe(-100);
    zoom.fit('width');
    expect(zoom.scale).toBe(1);
    expect(zoom.canZoomOut).toBe(false);
    expect(zoom.canZoomIn).toBe(true);
    zoom.reveal({ x: 0, y: 0, width: 10, height: 10 });
    expect(zoom.scale).toBe(1);
    zoom.destroy();
  });
});

const regions: ImageRegion[] = [
  { id: 'a', x: 0, y: 0, width: 100, height: 50, label: 'Heading', variant: 'success' },
  {
    id: 'b',
    x: 0,
    y: 100,
    width: 200,
    height: 80,
    label: 'Paragraph, low confidence',
    variant: 'warning',
  },
  { id: 'c', x: 300, y: 500, width: 100, height: 40, label: 'Footer' },
];

const props = {
  src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  alt: 'Scanned page',
  width: 400,
  height: 600,
  regions,
};

describe('ImageViewer', () => {
  it('draws regions in image coordinates, as a named listbox with one tab stop', async () => {
    const { container } = render(ImageViewer, { ...props, selectedRegionId: 'b' });
    const listbox = screen.getByRole('listbox', { name: 'Regions' });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[1]).toHaveAccessibleName('Paragraph, low confidence');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options.map((option) => option.tabIndex)).toEqual([-1, 0, -1]);
    expect(options[1]).toHaveClass('ldt-image-viewer__region--warning');
    expect(options[2].className).toBe('ldt-image-viewer__region');
    expect(options[2].style.left).toBe('75%');
    expect(options[2].style.top).toBe('83.33333333333334%');
    expect(options[2].style.width).toBe('25%');
    expect(listbox.closest('.ldt-image-viewer__layer')).toHaveAttribute('data-ready');
    expect(screen.getByRole('group', { name: 'Image viewer' })).toHaveAccessibleDescription(
      /Plus and minus zoom/
    );
    expect(
      (await axe(container, { rules: { 'color-contrast': { enabled: false } } })).violations
    ).toEqual([]);
  });

  it('zooms from the keyboard and the controls, and says the level', async () => {
    const user = userEvent.setup();
    render(ImageViewer, { ...props, zoomText: (percent: number) => `${percent} percent` });
    const frame = sized(screen.getByRole('group', { name: 'Image viewer' }), 200, 300);
    const level = frame.parentElement!.querySelector('.ldt-image-viewer__level')!;
    const status = screen.getByRole('status');

    await user.click(screen.getByRole('button', { name: 'Fit whole image' }));
    expect(level).toHaveTextContent('50 percent');
    expect(status).toHaveTextContent('50 percent');
    expect(screen.getByRole('button', { name: 'Fit whole image' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    // The zoom buttons are boxed, so they read as buttons beside the bare level readout.
    for (const name of ['Zoom out', 'Zoom in']) {
      expect(screen.getByRole('button', { name })).toHaveClass('ldt-button--quiet');
    }

    frame.focus();
    await user.keyboard('+');
    expect(level).toHaveTextContent('63 percent');
    await user.keyboard('=');
    await user.keyboard('-');
    await user.keyboard('_');
    expect(level).toHaveTextContent('50 percent');
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(level).toHaveTextContent('63 percent');

    frame.focus();
    const layer = frame.querySelector<HTMLElement>('.ldt-image-viewer__layer')!;
    const at = () => layer.style.transform;
    const start = at();
    await user.keyboard('{ArrowDown}');
    expect(at()).not.toBe(start);
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}{ArrowRight}{ArrowLeft}');
    await user.keyboard('x');
    await user.keyboard('0');
    expect(level).toHaveTextContent('50 percent');

    await user.click(screen.getByRole('button', { name: 'Fit width' }));
    expect(level).toHaveTextContent('50 percent');
    await user.click(screen.getByRole('button', { name: 'Fit height' }));
    expect(level).toHaveTextContent('50 percent');
    expect(screen.getByRole('button', { name: 'Fit height' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('walks the regions from the keyboard, selects, clears and keeps zoom keys working', async () => {
    const user = userEvent.setup();
    const onSelectedRegionChange = vi.fn();
    const onRegionClick = vi.fn();
    render(ImageViewer, { ...props, onSelectedRegionChange, onRegionClick });
    const frame = sized(screen.getByRole('group', { name: 'Image viewer' }), 200, 300);
    const options = screen.getAllByRole('option');

    frame.focus();
    await user.tab();
    expect(options[0]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(options[1]).toHaveFocus();
    expect(options.map((option) => option.tabIndex)).toEqual([-1, 0, -1]);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(options[0]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(options[2]).toHaveFocus();
    await user.keyboard('{ArrowUp}{Home}');
    expect(options[0]).toHaveFocus();
    await user.keyboard('{End}');
    expect(options[2]).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    expect(onSelectedRegionChange).toHaveBeenLastCalledWith(regions[2]);
    expect(onRegionClick).toHaveBeenCalledWith(regions[2], expect.any(MouseEvent));
    // Focus already reads "selected"; the live region stays quiet.
    expect(screen.getByRole('status')).toHaveTextContent('');
    await user.keyboard('{Enter}');
    expect(onSelectedRegionChange).toHaveBeenCalledOnce();

    await user.keyboard('+');
    expect(frame.parentElement!.querySelector('.ldt-image-viewer__level')).not.toHaveTextContent(
      '50%'
    );
    await user.keyboard('{Escape}');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
    expect(onSelectedRegionChange).toHaveBeenLastCalledWith(null);
    await user.keyboard('{Escape}{Tab}');
  });

  it('follows selection and hover from outside, and reports pointer hover', async () => {
    const onRegionHover = vi.fn();
    const { rerender } = render(ImageViewer, {
      ...props,
      onRegionHover,
      selectedText: (region: ImageRegion) => `Now on ${region.label}`,
    });
    sized(screen.getByRole('group', { name: 'Image viewer' }), 200, 300);
    await rerender({ selectedRegionId: 'c' });
    flushSync();
    expect(screen.getByRole('status')).toHaveTextContent('Now on Footer');
    const options = screen.getAllByRole('option');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('tabindex', '0');

    await rerender({ hoveredRegionId: 'a' });
    expect(options[0]).toHaveAttribute('data-hovered');
    await fireEvent.pointerEnter(options[1]);
    expect(onRegionHover).toHaveBeenLastCalledWith(regions[1]);
    expect(options[1]).toHaveAttribute('data-hovered');
    await fireEvent.pointerLeave(options[1]);
    expect(onRegionHover).toHaveBeenLastCalledWith(null);
    await rerender({ selectedRegionId: 'missing' });
  });

  it('reads the size from the image when none is given, and can hide its controls', async () => {
    const { container } = render(ImageViewer, {
      src: 'page.png',
      alt: 'Plan',
      showControls: false,
      label: 'Floor plan',
    });
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.queryByRole('listbox')).toBeNull();
    const image = screen.getByRole('img', { name: 'Plan' }) as HTMLImageElement;
    const layer = container.querySelector('.ldt-image-viewer__layer')!;
    expect(layer).not.toHaveAttribute('data-ready');
    await fireEvent.load(image);
    expect(layer).not.toHaveAttribute('data-ready');
    Object.defineProperty(image, 'naturalWidth', { value: 640 });
    Object.defineProperty(image, 'naturalHeight', { value: 480 });
    await fireEvent.load(image);
    expect(layer).toHaveAttribute('data-ready');
    expect((layer as HTMLElement).style.width).toBe('640px');
  });

  it('picks up an image that finished loading before it mounted', async () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const natural = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValueOnce(0)
      .mockReturnValue(320);
    vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(200);
    HTMLImageElement.prototype.decode = () => Promise.resolve();
    const { container } = render(ImageViewer, { src: 'cached.png', alt: 'Cached' });
    await vi.waitFor(() =>
      expect(container.querySelector('.ldt-image-viewer__layer')).toHaveAttribute('data-ready')
    );
    complete.mockRestore();
    natural.mockRestore();
    vi.restoreAllMocks();
  });
});
