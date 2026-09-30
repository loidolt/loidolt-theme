import type { Attachment } from 'svelte/attachments';
import { onDestroy } from 'svelte';
import { clamp } from './media-utils.js';

export interface MediaZoomOptions {
  minScale?: number;
  maxScale?: number;
  /** How far one `zoomIn()` / `zoomOut()` moves. */
  step?: number;
  /** Where a double-click or double-tap zooms to. */
  doubleTapScale?: number;
  onScaleChange?: (scale: number) => void;
}

export interface MediaZoom {
  /**
   * Put on the frame the image sits in. Handles pinch, trackpad zoom (Ctrl + wheel), double-click
   * and dragging to pan while zoomed.
   */
  readonly attach: Attachment<HTMLElement>;
  readonly scale: number;
  /** Pan offset in pixels. */
  readonly x: number;
  readonly y: number;
  /** A CSS `transform` for the image. */
  readonly transform: string;
  readonly zoomed: boolean;
  zoomIn(): void;
  zoomOut(): void;
  /** Back to 1× and centred. */
  reset(): void;
  /** Between 1× and `doubleTapScale`. */
  toggle(): void;
  destroy(): void;
}

/** Zoom and pan state for an image in a frame — the engine behind `Lightbox`'s zoom. */
export function createMediaZoom(options: MediaZoomOptions = {}): MediaZoom {
  const { minScale = 1, maxScale = 4, step = 0.5, doubleTapScale = 2, onScaleChange } = options;
  if (!(minScale > 0 && maxScale >= minScale)) {
    throw new RangeError('createMediaZoom: needs 0 < minScale <= maxScale');
  }

  let scale = $state(minScale);
  let x = $state(0);
  let y = $state(0);
  let frame: HTMLElement | null = null;

  /** Keeps the scaled image covering the frame: no panning past its edges. */
  const bound = () => {
    const width = frame?.clientWidth ?? 0;
    const height = frame?.clientHeight ?? 0;
    const [limitX, limitY] = [((scale - 1) * width) / 2, ((scale - 1) * height) / 2];
    x = clamp(x, -limitX, limitX);
    y = clamp(y, -limitY, limitY);
  };

  const setScale = (next: number) => {
    const value = clamp(next, minScale, maxScale);
    if (value === scale) return;
    scale = value;
    if (scale <= 1) [x, y] = [0, 0];
    bound();
    onScaleChange?.(scale);
  };

  let detach: (() => void) | undefined;

  const attach: Attachment<HTMLElement> = (node) => {
    frame = node;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- pointer bookkeeping, never rendered
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: { distance: number; scale: number } | null = null;

    const distance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      node.setPointerCapture?.(event.pointerId);
      if (pointers.size === 2) pinch = { distance: distance(), scale };
    };
    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pinch && pointers.size === 2) {
        setScale(pinch.scale * (distance() / (pinch.distance || 1)));
      } else if (pointers.size === 1 && scale > 1) {
        x += event.clientX - previous.x;
        y += event.clientY - previous.y;
        bound();
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
    };
    const onWheel = (event: WheelEvent) => {
      // A plain wheel scrolls the page; trackpad pinches arrive as Ctrl + wheel.
      if (!event.ctrlKey) return;
      event.preventDefault();
      setScale(scale * Math.exp(-event.deltaY / 100));
    };
    const onDoubleClick = () => setScale(scale > 1 ? minScale : doubleTapScale);

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
    node.addEventListener('pointercancel', onPointerUp);
    node.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('dblclick', onDoubleClick);
    detach = () => {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointercancel', onPointerUp);
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('dblclick', onDoubleClick);
      if (frame === node) frame = null;
      detach = undefined;
    };
    return () => detach?.();
  };

  const destroy = () => detach?.();
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    attach,
    get scale() {
      return scale;
    },
    get x() {
      return x;
    },
    get y() {
      return y;
    },
    get transform() {
      return `translate(${x}px, ${y}px) scale(${scale})`;
    },
    get zoomed() {
      return scale > 1;
    },
    zoomIn: () => setScale(scale + step),
    zoomOut: () => setScale(scale - step),
    reset() {
      [x, y] = [0, 0];
      setScale(minScale);
    },
    toggle: () => setScale(scale > 1 ? minScale : doubleTapScale),
    destroy,
  };
}
