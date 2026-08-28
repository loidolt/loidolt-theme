import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createToaster } from '../src/lib/toaster.svelte.js';
import ToasterHarness from './fixtures/ToasterHarness.svelte';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createToaster', () => {
  it('queues toasts and dismisses them by id', () => {
    const toaster = createToaster();
    const id = toaster.push({ title: 'Saved' });
    expect(toaster.toasts).toHaveLength(1);
    expect(toaster.toasts[0]).toMatchObject({ id, title: 'Saved' });

    toaster.dismiss(id);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('auto-dismisses after the duration', () => {
    const toaster = createToaster({ duration: 1000 });
    toaster.push({ title: 'Saved' });
    vi.advanceTimersByTime(999);
    expect(toaster.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('keeps toasts persistent by default', () => {
    const toaster = createToaster();
    toaster.push({ title: 'Pinned' });
    vi.advanceTimersByTime(60_000);
    expect(toaster.toasts).toHaveLength(1);
  });

  it('keeps a toast with a non-finite duration until dismissed', () => {
    const toaster = createToaster();
    toaster.push({ title: 'Pinned', duration: 0 });
    vi.advanceTimersByTime(60_000);
    expect(toaster.toasts).toHaveLength(1);
  });

  it('preserves the remaining time across pause and resume', () => {
    const toaster = createToaster({ duration: 1000 });
    toaster.push({ title: 'Saved' });

    vi.advanceTimersByTime(600);
    toaster.pause();
    vi.advanceTimersByTime(10_000);
    expect(toaster.toasts).toHaveLength(1);

    toaster.resume();
    vi.advanceTimersByTime(399);
    expect(toaster.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('tracks remaining time independently for toasts pushed at different moments', () => {
    // Regression: a single shared start timestamp meant pausing measured every toast's
    // elapsed time from the most recent push, inflating older toasts' remaining time.
    const toaster = createToaster({ duration: 1000 });
    toaster.push({ title: 'First' });
    vi.advanceTimersByTime(800); // First has 200ms left
    toaster.push({ title: 'Second' }); // Second has 1000ms left
    vi.advanceTimersByTime(100); // First: 100ms left, Second: 900ms left
    toaster.pause();
    vi.advanceTimersByTime(60_000);
    toaster.resume();

    vi.advanceTimersByTime(100);
    expect(toaster.toasts.map((toast) => toast.title)).toEqual(['Second']);
    vi.advanceTimersByTime(799);
    expect(toaster.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('dismisses a toast that expired while paused shortly after resume', () => {
    const toaster = createToaster({ duration: 100 });
    toaster.push({ title: 'Fleeting' });
    vi.advanceTimersByTime(99);
    toaster.pause();
    vi.advanceTimersByTime(10_000);
    toaster.resume();
    vi.advanceTimersByTime(5);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('drops the oldest toast past the maximum', () => {
    const toaster = createToaster({ max: 2 });
    toaster.push({ title: 'One' });
    toaster.push({ title: 'Two' });
    toaster.push({ title: 'Three' });
    expect(toaster.toasts.map((toast) => toast.title)).toEqual(['Two', 'Three']);
  });

  it('rejects invalid bounds before creating timers or queue entries', () => {
    expect(() => createToaster({ max: 0 })).toThrow(RangeError);
    expect(() => createToaster({ max: -1 })).toThrow(RangeError);
    expect(() => createToaster({ max: 1.5 })).toThrow(RangeError);
    expect(() => createToaster({ duration: -1 })).toThrow(RangeError);

    const toaster = createToaster();
    expect(() => toaster.push({ title: 'Invalid', duration: Number.NaN })).toThrow(RangeError);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('destroys its timers and queue idempotently', () => {
    const toaster = createToaster({ duration: 1000 });
    toaster.push({ title: 'Saved' });
    toaster.destroy();
    toaster.destroy();
    expect(toaster.toasts).toHaveLength(0);
    vi.advanceTimersByTime(1000);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('drives a rendered viewport, including auto-dismiss', async () => {
    render(ToasterHarness);
    expect(screen.queryByText('Export queued')).not.toBeInTheDocument();

    screen.getByRole('button', { name: 'Raise' }).click();
    expect(await screen.findByText('Export queued')).toBeInTheDocument();

    vi.advanceTimersByTime(1000);
    await vi.waitFor(() => expect(screen.queryByText('Export queued')).not.toBeInTheDocument());
  });
});
