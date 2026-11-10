import type { Attachment } from 'svelte/attachments';
import { onDestroy, untrack } from 'svelte';
import { clamp } from './media-utils.js';

/** How content is fitted to its frame: whole (`contain`), edge to edge across, or top to bottom. */
export type MediaZoomFit = 'contain' | 'width' | 'height';

export interface MediaZoomSize {
  width: number;
  height: number;
}

/** A rectangle in content pixels. */
export interface MediaZoomRect extends MediaZoomSize {
  x: number;
  y: number;
}

export interface MediaZoomOptions {
  minScale?: number;
  maxScale?: number;
  /** How far one `zoomIn()` / `zoomOut()` moves. */
  step?: number;
  /** Zoom by this factor per step (multiply / divide) instead of adding `step`. */
  stepFactor?: number;
  /** Where a double-click or double-tap zooms to. */
  doubleTapScale?: number;
  /**
   * The content's own size, e.g. an image's natural pixels. Setting it (here or later with
   * `setContentSize`) switches to content mode: `scale` is screen pixels per content pixel, `x`
   * and `y` place the content's top-left corner in the frame, scales below 1 are allowed when
   * fitting needs them, and panning keeps the content in view — centred when it is smaller than
   * the frame. Without it the content fills the frame at 1×, as in `Lightbox`.
   */
  contentSize?: MediaZoomSize;
  /** Content mode: the fit applied once the content and frame are measured, and by `reset()`. */
  fit?: MediaZoomFit;
  /** Keep the point under the pointer still while wheel, pinch and double-click zoom. */
  zoomToPointer?: boolean;
  /** A plain wheel pans content that overflows the frame (Ctrl + wheel still zooms). */
  wheelPan?: boolean;
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
  /**
   * A CSS `transform` for the image. In content mode it applies to an element of `contentSize`
   * with `transform-origin: 0 0`.
   */
  readonly transform: string;
  readonly zoomed: boolean;
  /** The content overflows the frame, so dragging pans it. */
  readonly pannable: boolean;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  /** Content mode: the size set by `contentSize` / `setContentSize`, else `null`. */
  readonly contentSize: MediaZoomSize | null;
  /** The fit currently held (kept across frame resizes), or `null` once zoomed or panned. */
  readonly fitMode: MediaZoomFit | null;
  zoomIn(): void;
  zoomOut(): void;
  /**
   * Zoom to `scale`, keeping `point` (frame pixels from its top-left corner, default the centre)
   * still.
   */
  zoomTo(scale: number, point?: { x: number; y: number }): void;
  /** Move the content by this many pixels, within bounds. */
  pan(dx: number, dy: number): void;
  /** Content mode: fit the content to the frame. Otherwise the same as `reset()`. */
  fit(mode?: MediaZoomFit): void;
  /**
   * Content mode: bring a rectangle (content pixels) into view, centring it if any part is out
   * of view and zooming out if it is bigger than the frame.
   */
  reveal(rect: MediaZoomRect, padding?: number): void;
  /** Switch to (or update) content mode; `0` or less in either dimension switches back. */
  setContentSize(width: number, height: number): void;
  /** Back to 1× and centred; in content mode, back to the `fit` option. */
  reset(): void;
  /** Between 1× and `doubleTapScale`; in content mode, between the whole fit and a closer look. */
  toggle(): void;
  destroy(): void;
}

/** Below this, a drag in content mode is still a click (so regions inside the frame work). */
const DRAG_THRESHOLD = 4;

/** Zoom and pan state for an image in a frame — the engine behind `Lightbox` and `ImageViewer`. */
export function createMediaZoom(options: MediaZoomOptions = {}): MediaZoom {
  const {
    minScale = 1,
    maxScale = 4,
    step = 0.5,
    stepFactor,
    doubleTapScale = 2,
    fit: initialFit = 'contain',
    zoomToPointer = false,
    wheelPan = false,
    onScaleChange,
  } = options;
  if (!(minScale > 0 && maxScale >= minScale)) {
    throw new RangeError('createMediaZoom: needs 0 < minScale <= maxScale');
  }

  let scale = $state(minScale);
  let x = $state(0);
  let y = $state(0);
  let frameWidth = $state(0);
  let frameHeight = $state(0);
  let content = $state<MediaZoomSize | null>(null);
  let fitMode = $state<MediaZoomFit | null>(null);
  /** Content arrived before the frame had a size: fit once it does. */
  let pendingFit = false;
  let frame: HTMLElement | null = null;

  const measure = () => {
    if (!frame) return;
    frameWidth = frame.clientWidth;
    frameHeight = frame.clientHeight;
  };
  const measured = () => frameWidth > 0 && frameHeight > 0;

  const fitScale = (mode: MediaZoomFit) => {
    if (!content || !measured()) return scale;
    const [byWidth, byHeight] = [frameWidth / content.width, frameHeight / content.height];
    return mode === 'width' ? byWidth : mode === 'height' ? byHeight : Math.min(byWidth, byHeight);
  };
  /** In content mode the bounds always admit every fit, so fitting is never refused. */
  const lowest = () => (content ? Math.min(minScale, fitScale('contain')) : minScale);
  const highest = () =>
    content ? Math.max(maxScale, fitScale('width'), fitScale('height')) : maxScale;
  const overflows = () =>
    content
      ? content.width * scale > frameWidth + 0.5 || content.height * scale > frameHeight + 0.5
      : scale > 1;

  /** Keeps the scaled image covering the frame: no panning past its edges. */
  const bound = () => {
    if (content) {
      const [width, height] = [content.width * scale, content.height * scale];
      x = width <= frameWidth ? (frameWidth - width) / 2 : clamp(x, frameWidth - width, 0);
      y = height <= frameHeight ? (frameHeight - height) / 2 : clamp(y, frameHeight - height, 0);
      return;
    }
    const width = frame?.clientWidth ?? 0;
    const height = frame?.clientHeight ?? 0;
    const [limitX, limitY] = [((scale - 1) * width) / 2, ((scale - 1) * height) / 2];
    x = clamp(x, -limitX, limitX);
    y = clamp(y, -limitY, limitY);
  };

  const setScale = (next: number, point?: { x: number; y: number }) => {
    if (content) measure();
    const value = clamp(next, lowest(), highest());
    if (value === scale) return;
    const previous = scale;
    scale = value;
    if (content) {
      // Keep the content point under `point` where it is.
      const anchor = point ?? { x: frameWidth / 2, y: frameHeight / 2 };
      x = anchor.x - ((anchor.x - x) / previous) * value;
      y = anchor.y - ((anchor.y - y) / previous) * value;
      fitMode = null;
    } else if (point) {
      // The image is scaled about the frame's centre, so work from there.
      const width = frame?.clientWidth ?? 0;
      const height = frame?.clientHeight ?? 0;
      const [dx, dy] = [point.x - width / 2, point.y - height / 2];
      x = dx - (value / previous) * (dx - x);
      y = dy - (value / previous) * (dy - y);
    }
    if (!content && scale <= 1) [x, y] = [0, 0];
    bound();
    onScaleChange?.(scale);
  };

  const applyFit = (mode: MediaZoomFit): void => {
    measure();
    if (!content) return reset();
    if (!measured()) {
      pendingFit = true;
      return;
    }
    pendingFit = false;
    const value = fitScale(mode);
    const changed = value !== scale;
    scale = value;
    [x, y] = [0, 0];
    bound();
    fitMode = mode;
    if (changed) onScaleChange?.(scale);
  };

  function reset(): void {
    if (content) return applyFit(initialFit);
    [x, y] = [0, 0];
    setScale(minScale);
  }

  const zoomStep = (direction: 1 | -1) => {
    if (stepFactor) setScale(direction > 0 ? scale * stepFactor : scale / stepFactor);
    else setScale(scale + direction * step);
  };

  const toggle = (point?: { x: number; y: number }) => {
    if (!content) return setScale(scale > 1 ? minScale : doubleTapScale, point);
    measure();
    const whole = fitScale('contain');
    if (scale > whole * 1.01) return applyFit('contain');
    setScale(doubleTapScale > whole * 1.01 ? doubleTapScale : whole * 2, point);
  };

  const pan = (dx: number, dy: number) => {
    if (content) measure();
    const [beforeX, beforeY] = [x, y];
    x += dx;
    y += dy;
    bound();
    const moved = x !== beforeX || y !== beforeY;
    if (moved && content) fitMode = null;
    return moved;
  };

  const reveal = (rect: MediaZoomRect, padding = 24) => {
    measure();
    if (!content || !measured()) return;
    const room = {
      width: Math.max(1, frameWidth - 2 * padding),
      height: Math.max(1, frameHeight - 2 * padding),
    };
    let value = scale;
    if (rect.width * value > room.width || rect.height * value > room.height) {
      value = clamp(
        Math.min(room.width / Math.max(rect.width, 1), room.height / Math.max(rect.height, 1)),
        lowest(),
        highest()
      );
    }
    const left = x + rect.x * value;
    const top = y + rect.y * value;
    const inView =
      value === scale &&
      left >= padding &&
      top >= padding &&
      left + rect.width * value <= frameWidth - padding &&
      top + rect.height * value <= frameHeight - padding;
    if (inView) return;
    const changed = value !== scale;
    scale = value;
    x = frameWidth / 2 - (rect.x + rect.width / 2) * value;
    y = frameHeight / 2 - (rect.y + rect.height / 2) * value;
    bound();
    fitMode = null;
    if (changed) onScaleChange?.(scale);
  };

  // Called from effects and attachments: reading the state it writes must not subscribe them.
  const setContentSize = (width: number, height: number) =>
    untrack(() => {
      if (!(width > 0 && height > 0)) {
        content = null;
        fitMode = null;
        return;
      }
      const first = !content;
      content = { width, height };
      if (first || pendingFit) applyFit(initialFit);
      else if (fitMode) applyFit(fitMode);
      else bound();
    });

  if (options.contentSize) {
    content = { ...options.contentSize };
    pendingFit = true;
  }

  let detach: (() => void) | undefined;

  // Runs inside an attachment effect: none of the state it touches should re-run it.
  const attach: Attachment<HTMLElement> = (node) => untrack(() => connect(node));

  const connect = (node: HTMLElement) => {
    frame = node;
    measure();
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- pointer bookkeeping, never rendered
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: { distance: number; scale: number } | null = null;
    /** Content mode: where the pointer went down, until it has moved far enough to be a drag. */
    let press: { x: number; y: number } | null = null;
    let dragged = false;

    /** Client coordinates to the frame's own, from the inside of its border. */
    const local = (clientX: number, clientY: number) => {
      const box = node.getBoundingClientRect();
      return { x: clientX - box.left - node.clientLeft, y: clientY - box.top - node.clientTop };
    };
    const distance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const midpoint = () => {
      const [a, b] = [...pointers.values()];
      return local((a.x + b.x) / 2, (a.y + b.y) / 2);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (content) {
        // Capture only once a drag starts, so a press on a control inside the frame stays a click.
        press = { x: event.clientX, y: event.clientY };
        dragged = false;
      } else {
        node.setPointerCapture?.(event.pointerId);
      }
      if (pointers.size === 2) pinch = { distance: distance(), scale };
    };
    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (content && press && !dragged) {
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_THRESHOLD) return;
        dragged = true;
        node.setPointerCapture?.(event.pointerId);
      }
      if (pinch && pointers.size === 2) {
        const target = pinch.scale * (distance() / (pinch.distance || 1));
        setScale(target, zoomToPointer ? midpoint() : undefined);
      } else if (pointers.size === 1 && overflows()) {
        pan(event.clientX - previous.x, event.clientY - previous.y);
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) press = null;
    };
    // A drag that ends over a control inside the frame must not also press it.
    const onClick = (event: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      event.stopPropagation();
      event.preventDefault();
    };
    const onWheel = (event: WheelEvent) => {
      // A plain wheel scrolls the page; trackpad pinches arrive as Ctrl + wheel.
      if (!event.ctrlKey) {
        if (!wheelPan || !content || !overflows()) return;
        const [dx, dy] = event.shiftKey
          ? [event.deltaY, event.deltaX]
          : [event.deltaX, event.deltaY];
        // At an edge the wheel goes back to scrolling the page.
        if (pan(-dx, -dy)) event.preventDefault();
        return;
      }
      event.preventDefault();
      setScale(
        scale * Math.exp(-event.deltaY / 100),
        zoomToPointer ? local(event.clientX, event.clientY) : undefined
      );
    };
    const onDoubleClick = (event: MouseEvent) => {
      const point = zoomToPointer ? local(event.clientX, event.clientY) : undefined;
      if (content) toggle(point);
      else setScale(scale > 1 ? minScale : doubleTapScale, point);
    };

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measure();
        if (!content) return;
        if (pendingFit) applyFit(initialFit);
        else if (fitMode) applyFit(fitMode);
        else bound();
      });
      observer.observe(node);
    }
    if (pendingFit && measured()) applyFit(initialFit);

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
    node.addEventListener('pointercancel', onPointerUp);
    node.addEventListener('click', onClick, true);
    node.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('dblclick', onDoubleClick);
    detach = () => {
      observer?.disconnect();
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointercancel', onPointerUp);
      node.removeEventListener('click', onClick, true);
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
      return content ? scale > fitScale('contain') * 1.01 : scale > 1;
    },
    get pannable() {
      return overflows();
    },
    get canZoomIn() {
      return scale < highest();
    },
    get canZoomOut() {
      return scale > lowest();
    },
    get contentSize() {
      return content;
    },
    get fitMode() {
      return fitMode;
    },
    zoomIn: () => zoomStep(1),
    zoomOut: () => zoomStep(-1),
    zoomTo: (next, point) => setScale(next, point),
    pan: (dx, dy) => void pan(dx, dy),
    fit: (mode = 'contain') => applyFit(mode),
    reveal,
    setContentSize,
    reset,
    toggle: () => toggle(),
    destroy,
  };
}
