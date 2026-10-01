<script lang="ts">
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    strokesToSvg,
    validateSignature,
    type SignaturePoint,
    type SignatureStroke,
    type SignatureValue,
  } from '../signature.js';
  import { cx } from '../utils.js';
  import Button from './Button.svelte';
  import Input from './Input.svelte';
  import RadioGroup from './RadioGroup.svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  type Mode = 'draw' | 'type';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The accepted signature, or `null` while there is none. Bindable. */
    value?: SignatureValue | null;
    onValueChange?: (value: SignatureValue | null) => void;
    /** Names the pad for assistive tech, e.g. "Customer signature". */
    label: string;
    /**
     * Ways to sign. Typing is the keyboard- and switch-accessible alternative to drawing (WCAG
     * 2.1.1, 2.5.1); drop it only if you offer another route to the same outcome.
     */
    modes?: Mode[];
    mode?: Mode;
    strokeWidth?: number;
    /** Ink colour. Defaults to the text colour, so it follows the theme. */
    strokeColor?: string;
    /** Fonts offered in `type` mode. Load them yourself; the default is the system script face. */
    fonts?: Array<{ family: string; label: string }>;
    /** Drawn length, in pixels, below which a signature does not count. */
    minStrokeLength?: number;
    minTypedLength?: number;
    /** Submits the PNG data URL with a form. */
    name?: string;
    required?: boolean;
    disabled?: boolean;
    modeLabel?: string;
    drawLabel?: string;
    typeLabel?: string;
    typePlaceholder?: string;
    fontLabel?: string;
    clearLabel?: string;
    undoLabel?: string;
    /** Guidance under the drawing area. */
    drawHint?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  const generatedId = $props.id();

  let {
    value = $bindable(null),
    onValueChange,
    label,
    modes = ['draw', 'type'],
    mode = $bindable(modes[0] ?? 'draw'),
    strokeWidth = 2.5,
    strokeColor,
    fonts = [{ family: 'cursive', label: 'Script' }],
    minStrokeLength = 20,
    minTypedLength = 2,
    name,
    required = false,
    disabled = false,
    modeLabel = 'Signature method',
    drawLabel = 'Draw',
    typeLabel = 'Type',
    typePlaceholder = 'Type your full name',
    fontLabel = 'Style',
    clearLabel = 'Clear',
    undoLabel = 'Undo',
    drawHint = 'Sign with a mouse, pen or finger.',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // Raw, not a deep proxy: points are pushed onto the live stroke while drawing, and the array
  // is reassigned to publish each change.
  let strokes = $state.raw<SignatureStroke[]>([]);
  let typedName = $state('');
  let font = $state(untrack(() => fonts[0]?.family ?? 'cursive'));
  let canvas = $state<HTMLCanvasElement | null>(null);
  let size = { width: 0, height: 0 };

  const ink = () => strokeColor ?? (canvas ? getComputedStyle(canvas).color : '') ?? '#20231d';

  function paint() {
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const ratio = canvas.width / (size.width || 1);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);
    context.strokeStyle = ink();
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const stroke of strokes) {
      const { points } = stroke;
      if (!points.length) continue;
      context.lineWidth = stroke.width;
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length - 1; index++) {
        const [point, next] = [points[index], points[index + 1]];
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      }
      const last = points[points.length - 1];
      context.lineTo(last.x + (points.length === 1 ? 0.01 : 0), last.y);
      context.stroke();
    }
  }

  function snapshot(target: HTMLCanvasElement | null): string {
    try {
      return target?.toDataURL('image/png') ?? '';
    } catch {
      return '';
    }
  }

  function emit(next: SignatureValue | null) {
    value = next;
    onValueChange?.(next);
  }

  function commitDrawing() {
    const check = validateSignature({ mode: 'draw', strokes }, { minStrokeLength });
    if (!check.valid) return emit(null);
    emit({
      mode: 'draw',
      strokes: strokes.map((stroke) => ({ ...stroke, points: [...stroke.points] })),
      dataUrl: snapshot(canvas),
      svg: strokesToSvg(strokes, { ...size, color: ink() }),
      ...size,
    });
  }

  function commitTyped() {
    const check = validateSignature({ mode: 'type', typedName }, { minTypedLength });
    if (!check.valid) return emit(null);
    // Set the name in the chosen face on an offscreen canvas, so both modes yield a PNG.
    const width = 480;
    const height = 140;
    let dataUrl = '';
    if (typeof document !== 'undefined') {
      const offscreen = document.createElement('canvas');
      offscreen.width = width * 2;
      offscreen.height = height * 2;
      const context = offscreen.getContext('2d');
      if (context) {
        context.scale(2, 2);
        context.fillStyle = ink();
        context.textBaseline = 'middle';
        context.font = `48px ${font}`;
        context.fillText(typedName.trim(), 16, height / 2, width - 32);
        dataUrl = snapshot(offscreen);
      }
    }
    emit({ mode: 'type', typedName: typedName.trim(), font, dataUrl, width, height });
  }

  /** Sizes the backing store to the element and device pixels, and wires the pointer. */
  const pad: Attachment<HTMLCanvasElement> = (node) => {
    const resize = () => {
      const box = node.getBoundingClientRect();
      size = { width: box.width, height: box.height };
      const ratio = window.devicePixelRatio || 1;
      node.width = Math.max(1, Math.round(box.width * ratio));
      node.height = Math.max(1, Math.round(box.height * ratio));
      paint();
    };
    // Untracked: painting reads the strokes, and an attachment that depends on them would tear
    // down and re-wire the pointer on every stroke.
    untrack(resize);
    const observer = new ResizeObserver(resize);
    observer.observe(node);

    let current: SignatureStroke | null = null;
    const point = (event: PointerEvent): SignaturePoint => {
      const box = node.getBoundingClientRect();
      return {
        x: event.clientX - box.left,
        y: event.clientY - box.top,
        pressure: event.pressure || 0.5,
      };
    };
    const down = (event: PointerEvent) => {
      if (disabled || event.button > 0) return;
      event.preventDefault();
      node.setPointerCapture?.(event.pointerId);
      current = { points: [point(event)], width: strokeWidth };
      strokes = [...strokes, current];
      paint();
    };
    const move = (event: PointerEvent) => {
      if (!current) return;
      current.points.push(point(event));
      strokes = [...strokes];
      paint();
    };
    const up = () => {
      if (!current) return;
      current = null;
      commitDrawing();
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    return () => {
      observer.disconnect();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
  };

  /** Removes everything drawn or typed. */
  export function clear() {
    strokes = [];
    typedName = '';
    paint();
    emit(null);
  }

  /** Removes the last stroke. */
  export function undo() {
    strokes = strokes.slice(0, -1);
    paint();
    commitDrawing();
  }

  function switchMode(next: Mode) {
    mode = next;
    if (next === 'draw') commitDrawing();
    else commitTyped();
  }

  const hintId = `${generatedId}-hint`;
  const hasInk = $derived(strokes.some((stroke) => stroke.points.length));
</script>

<div
  bind:this={ref}
  class={cx('ldt-signature', className)}
  role="group"
  aria-label={label}
  data-disabled={disabled ? '' : undefined}
  {...rest}
>
  {#if modes.length > 1}
    <ToggleGroup
      label={modeLabel}
      size="sm"
      value={mode}
      {disabled}
      options={modes.map((one) => ({ value: one, label: one === 'draw' ? drawLabel : typeLabel }))}
      onValueChange={(next) => typeof next === 'string' && next && switchMode(next as Mode)}
    />
  {/if}

  {#if mode === 'draw'}
    <!-- The picture is named on a wrapper: a canvas cannot take an image role itself. -->
    <div class="ldt-signature__surface" role="img" aria-label={label} aria-describedby={hintId}>
      <canvas bind:this={canvas} class="ldt-signature__canvas" {@attach pad}></canvas>
    </div>
    <p class="ldt-signature__hint" id={hintId}>{drawHint}</p>
  {:else}
    <div class="ldt-signature__typed">
      <Input
        boxed
        aria-label={label}
        placeholder={typePlaceholder}
        autocomplete="name"
        {disabled}
        bind:value={typedName}
        oninput={commitTyped}
      />
      <p class="ldt-signature__preview" style:font-family={font} aria-hidden="true">
        {typedName || ' '}
      </p>
      {#if fonts.length > 1}
        <RadioGroup
          label={fontLabel}
          options={fonts.map((one) => ({ value: one.family, label: one.label }))}
          bind:value={font}
          onValueChange={commitTyped}
        />
      {/if}
    </div>
  {/if}

  <div class="ldt-signature__actions">
    {#if mode === 'draw'}<Button
        size="sm"
        variant="quiet"
        disabled={disabled || !hasInk}
        onclick={undo}>{undoLabel}</Button
      >{/if}
    <Button
      size="sm"
      variant="quiet"
      disabled={disabled || (mode === 'draw' ? !hasInk : !typedName)}
      onclick={clear}>{clearLabel}</Button
    >
  </div>
  {#if name}<input type="hidden" {name} value={value?.dataUrl ?? ''} {required} />{/if}
</div>
