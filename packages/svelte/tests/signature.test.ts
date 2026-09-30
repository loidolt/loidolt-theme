import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SignaturePad from '../src/lib/components/SignaturePad.svelte';
import { strokeLength, strokePath, strokesToSvg, validateSignature } from '../src/lib/signature.js';

/** A 2D context that records nothing but accepts every call the pad makes. */
function fakeContext() {
  return new Proxy(
    {},
    {
      get: (target: Record<string, unknown>, key: string) =>
        key in target ? target[key] : vi.fn(),
      set: (target, key, value) => ((target[key as string] = value), true),
    }
  );
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => fakeContext() as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,SIG');
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 300,
    bottom: 100,
    width: 300,
    height: 100,
  } as DOMRect);
});

afterEach(() => vi.restoreAllMocks());

const draw = async (surface: Element, path: Array<[number, number]>) => {
  const [first, ...rest] = path;
  await fireEvent.pointerDown(surface, { pointerId: 1, clientX: first[0], clientY: first[1] });
  for (const [x, y] of rest)
    await fireEvent.pointerMove(surface, { pointerId: 1, clientX: x, clientY: y });
  await fireEvent.pointerUp(surface, { pointerId: 1 });
};

describe('signature geometry', () => {
  const strokes = [
    {
      width: 2,
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 4 },
        { x: 6, y: 8 },
      ],
    },
    { width: 2, points: [{ x: 10, y: 10 }] },
  ];

  it('measures, paths and exports strokes', () => {
    expect(strokeLength(strokes)).toBe(10);
    expect(strokePath([])).toBe('');
    expect(strokePath([{ x: 1, y: 2 }])).toBe('M1 2h0.01');
    expect(strokePath(strokes[0].points)).toBe('M0 0Q3 4 4.5 6L6 8');
    const svg = strokesToSvg(strokes, { width: 300, height: 100, color: '#123456' });
    expect(svg).toContain('viewBox="0 0 300 100"');
    expect(svg).toContain('stroke="#123456"');
    expect(svg.match(/<path/g)).toHaveLength(2);
  });

  it('judges whether a signature counts', () => {
    expect(validateSignature({ mode: 'draw', strokes: [] })).toEqual({
      valid: false,
      error: 'empty',
    });
    expect(validateSignature({ mode: 'draw', strokes })).toEqual({
      valid: false,
      error: 'too-short',
    });
    expect(validateSignature({ mode: 'draw', strokes }, { minStrokeLength: 5 })).toEqual({
      valid: true,
    });
    expect(validateSignature({ mode: 'type', typedName: ' ' })).toEqual({
      valid: false,
      error: 'empty',
    });
    expect(validateSignature({ mode: 'type', typedName: 'A' })).toEqual({
      valid: false,
      error: 'too-short',
    });
    expect(validateSignature({ mode: 'type', typedName: 'Ada' })).toEqual({ valid: true });
  });
});

describe('SignaturePad', () => {
  it('accepts a drawn signature once it is long enough, and can undo and clear', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(SignaturePad, {
      label: 'Customer signature',
      onValueChange,
      name: 'signature',
      required: true,
    });
    const surface = screen.getByRole('img', { name: 'Customer signature' });
    expect(surface).toHaveAccessibleDescription('Sign with a mouse, pen or finger.');
    const canvas = surface.querySelector('canvas')!;

    await draw(canvas, [
      [10, 10],
      [14, 12],
    ]);
    expect(onValueChange).toHaveBeenLastCalledWith(null);

    await draw(canvas, [
      [20, 50],
      [80, 40],
      [140, 60],
      [200, 45],
    ]);
    const value = onValueChange.mock.lastCall![0];
    expect(value).toMatchObject({
      mode: 'draw',
      dataUrl: 'data:image/png;base64,SIG',
      width: 300,
      height: 100,
    });
    expect(value.strokes).toHaveLength(2);
    expect(value.svg).toContain('<path');
    expect(document.querySelector('input[type="hidden"][name="signature"]')).toHaveValue(
      'data:image/png;base64,SIG'
    );

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('offers typing as the keyboard alternative, with a choice of style', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(SignaturePad, {
      label: 'Signature',
      onValueChange,
      fonts: [
        { family: 'cursive', label: 'Script' },
        { family: 'serif', label: 'Formal' },
      ],
    });
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    const field = screen.getByRole('textbox', { name: 'Signature' });
    await user.type(field, 'Ada Lovelace');
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ mode: 'type', typedName: 'Ada Lovelace', font: 'cursive' })
    );
    await user.click(screen.getByRole('radio', { name: 'Formal' }));
    await waitFor(() =>
      expect(onValueChange).toHaveBeenLastCalledWith(expect.objectContaining({ font: 'serif' }))
    );
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(field).toHaveValue('');

    await user.click(screen.getByRole('radio', { name: 'Draw' }));
    expect(screen.getByRole('img', { name: 'Signature' })).toBeInTheDocument();
  });

  it('ignores the pen while disabled and can be limited to one mode', async () => {
    const onValueChange = vi.fn();
    render(SignaturePad, { label: 'Signature', modes: ['draw'], disabled: true, onValueChange });
    expect(screen.queryByRole('radio', { name: 'Type' })).not.toBeInTheDocument();
    const canvas = screen.getByRole('img').querySelector('canvas')!;
    await draw(canvas, [
      [20, 50],
      [200, 45],
    ]);
    flushSync();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
