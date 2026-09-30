import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAnnouncer } from '../src/lib/announcer.svelte.js';
import LiveRegion from '../src/lib/components/LiveRegion.svelte';
import SkipLink from '../src/lib/components/SkipLink.svelte';
import { describedBy } from '../src/lib/utils.js';
import AttachmentsHarness from './fixtures/AttachmentsHarness.svelte';

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

afterEach(() => {
  vi.useRealTimers();
});

describe('escapeKey', () => {
  it('fires anywhere in the document by default, and not while composing', async () => {
    const onEscape = vi.fn();
    render(AttachmentsHarness, { onEscape });
    await fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
    await fireEvent.keyDown(document.body, { key: 'Escape', isComposing: true });
    await fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('listens only inside the node when scoped, and not at all when disabled', async () => {
    const onEscape = vi.fn();
    const { rerender } = render(AttachmentsHarness, { onEscape, escapeScope: 'node' });
    await fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Inside' }), { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);

    await rerender({ onEscape, escapeScope: 'node', escapeEnabled: false });
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Inside' }), { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});

describe('clickOutside', () => {
  it('reports presses outside the node, but not inside it or on ignored elements', async () => {
    const onOutside = vi.fn();
    render(AttachmentsHarness, { onOutside });
    await fireEvent.pointerDown(screen.getByRole('button', { name: 'Inside' }));
    await fireEvent.pointerDown(screen.getByRole('button', { name: 'Ignored' }));
    expect(onOutside).not.toHaveBeenCalled();
    await fireEvent.pointerDown(screen.getByRole('button', { name: 'Before' }));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });
});

describe('autofocus', () => {
  it('focuses and selects on the next frame', async () => {
    render(AttachmentsHarness, { focusOnMount: true });
    const input = screen.getByRole('textbox', { name: 'Autofocused' }) as HTMLInputElement;
    expect(input).not.toHaveFocus();
    await frame();
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(5);
  });

  it('waits for an explicit delay', async () => {
    vi.useFakeTimers();
    render(AttachmentsHarness, { focusOnMount: true, focusDelay: 200 });
    const input = screen.getByRole('textbox', { name: 'Autofocused' });
    vi.advanceTimersByTime(199);
    expect(input).not.toHaveFocus();
    vi.advanceTimersByTime(1);
    expect(input).toHaveFocus();
  });
});

describe('rovingFocus', () => {
  it('keeps one tab stop and walks usable items with arrows, Home and End', async () => {
    const user = userEvent.setup();
    const onFocusChange = vi.fn();
    render(AttachmentsHarness, { roving: { onFocusChange } });
    const [cut, copy, paste, undo] = ['Cut', 'Copy', 'Paste', 'Undo'].map((name) =>
      screen.getByRole('button', { name })
    );
    expect([cut, copy, paste, undo].map((button) => button.tabIndex)).toEqual([0, -1, -1, -1]);

    cut.focus();
    await user.keyboard('{ArrowRight}');
    // The disabled item is skipped.
    expect(paste).toHaveFocus();
    expect(paste.tabIndex).toBe(0);
    expect(cut.tabIndex).toBe(-1);
    expect(onFocusChange).toHaveBeenLastCalledWith(1, paste);

    await user.keyboard('{End}');
    expect(undo).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(cut).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(undo).toHaveFocus();
    await user.keyboard('{Home}');
    expect(cut).toHaveFocus();
    // Keys for the other axis are left alone.
    await user.keyboard('{ArrowDown}');
    expect(cut).toHaveFocus();
  });

  it('stops at the ends without loop, and moves the tab stop to a clicked item', async () => {
    const user = userEvent.setup();
    render(AttachmentsHarness, { roving: { loop: false, orientation: 'both' } });
    const cut = screen.getByRole('button', { name: 'Cut' });
    const undo = screen.getByRole('button', { name: 'Undo' });
    cut.focus();
    await user.keyboard('{ArrowUp}');
    expect(cut).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(undo).toHaveFocus();

    await user.click(cut);
    expect(cut.tabIndex).toBe(0);
    expect(undo.tabIndex).toBe(-1);
  });

  it('can leave tabindex alone', () => {
    render(AttachmentsHarness, { roving: { manageTabIndex: false, orientation: 'vertical' } });
    expect(screen.getByRole('button', { name: 'Paste' })).not.toHaveAttribute('tabindex');
  });
});

describe('focusTrap', () => {
  it('moves focus in, wraps Tab at both ends, and returns focus when released', async () => {
    const user = userEvent.setup();
    const { rerender } = render(AttachmentsHarness, { trap: false });
    const before = screen.getByRole('button', { name: 'Before' });
    before.focus();

    await rerender({ trap: true });
    await frame();
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });
    expect(first).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(last).toHaveFocus();
    await user.keyboard('{Tab}');
    expect(first).toHaveFocus();

    await rerender({ trap: false });
    expect(before).toHaveFocus();
  });

  it('honours initialFocus and returnFocus', async () => {
    const { rerender } = render(AttachmentsHarness, {
      trap: true,
      trapOptions: { initialFocus: 'button:last-child', returnFocus: false },
    });
    await frame();
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    await rerender({ trap: false });
    expect(screen.getByRole('button', { name: 'Before' })).not.toHaveFocus();
  });
});

describe('createAnnouncer', () => {
  it('announces through a mounted region, re-announces repeats, and clears itself', async () => {
    vi.useFakeTimers();
    render(AttachmentsHarness);
    const region = screen.getByRole('status');
    const announce = screen.getByRole('button', { name: 'Announce' });

    await fireEvent.click(announce);
    await vi.advanceTimersByTimeAsync(50);
    expect(region).toHaveTextContent('Saved');

    // Same text again: the region empties first, so assistive tech sees a change.
    await fireEvent.click(announce);
    expect(region.textContent).toBe('');
    await vi.advanceTimersByTimeAsync(50);
    expect(region).toHaveTextContent('Saved');

    await vi.advanceTimersByTimeAsync(1000);
    expect(region.textContent).toBe('');
  });

  it('switches politeness per message and clears on demand', async () => {
    vi.useFakeTimers();
    render(AttachmentsHarness);
    await fireEvent.click(screen.getByRole('button', { name: 'Alert' }));
    await vi.advanceTimersByTimeAsync(50);
    const region = screen.getByRole('alert');
    expect(region).toHaveTextContent('Failed');
    expect(region).toHaveAttribute('aria-live', 'assertive');
    await fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(region.textContent).toBe('');
  });

  it('drops a pending message once destroyed and validates its options', async () => {
    vi.useFakeTimers();
    const announcer = createAnnouncer({ clearAfter: 0 });
    expect(announcer.politeness).toBe('polite');
    announcer.announce('Kept');
    vi.advanceTimersByTime(10_000);
    expect(announcer.message).toBe('Kept');
    announcer.announce('Late');
    announcer.destroy();
    vi.advanceTimersByTime(50);
    expect(announcer.message).toBe('');
    expect(() => createAnnouncer({ clearAfter: -1 })).toThrow(/createAnnouncer: `clearAfter`/);
  });
});

describe('LiveRegion', () => {
  it('is a hidden, polite, atomic status region by default', () => {
    render(LiveRegion, { message: 'Three results' });
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Three results');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveClass('ldt-sr-only');
  });

  it('can be visible and carry richer content', () => {
    render(LiveRegion, { visuallyHidden: false, children: text('Uploaded') });
    expect(screen.getByRole('status')).not.toHaveClass('ldt-sr-only');
    expect(screen.getByRole('status')).toHaveTextContent('Uploaded');
  });
});

describe('SkipLink', () => {
  it('moves focus to a target that is not otherwise focusable', async () => {
    const user = userEvent.setup();
    const main = document.createElement('main');
    main.id = 'content';
    document.body.append(main);
    render(SkipLink, { targetId: 'content' });
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', '#content');
    await user.click(link);
    expect(main).toHaveFocus();
    expect(main.tabIndex).toBe(-1);
    main.remove();
  });

  it('leaves a focusable target alone, calls a consumer onclick, and survives a missing target', async () => {
    const user = userEvent.setup();
    const button = document.createElement('button');
    button.id = 'go';
    document.body.append(button);
    const onclick = vi.fn();
    const { unmount } = render(SkipLink, { targetId: 'go', children: text('Skip'), onclick });
    await user.click(screen.getByRole('link', { name: 'Skip' }));
    expect(onclick).toHaveBeenCalled();
    expect(button).toHaveFocus();
    expect(button).not.toHaveAttribute('tabindex');
    button.remove();
    unmount();

    render(SkipLink, { targetId: 'nowhere', label: 'Skip ahead' });
    await user.click(screen.getByRole('link', { name: 'Skip ahead' }));
  });

  it('respects a consumer that prevents the default', async () => {
    const user = userEvent.setup();
    const main = document.createElement('main');
    main.id = 'blocked';
    document.body.append(main);
    render(SkipLink, {
      targetId: 'blocked',
      onclick: (event: MouseEvent) => event.preventDefault(),
    });
    await user.click(screen.getByRole('link'));
    expect(main).not.toHaveFocus();
    main.remove();
  });
});

describe('describedBy', () => {
  it('joins present ids and collapses to undefined', () => {
    expect(describedBy('a-hint', false, null, 'a-error')).toBe('a-hint a-error');
    expect(describedBy(undefined, '')).toBeUndefined();
  });
});
