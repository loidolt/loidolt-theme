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

  it('drops the oldest toast past the maximum', () => {
    const toaster = createToaster({ max: 2 });
    toaster.push({ title: 'One' });
    toaster.push({ title: 'Two' });
    toaster.push({ title: 'Three' });
    expect(toaster.toasts.map((toast) => toast.title)).toEqual(['Two', 'Three']);
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
