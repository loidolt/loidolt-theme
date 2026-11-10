import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import {
  diffText,
  markAt,
  nextMark,
  previousMark,
  segmentText,
  shiftMarks,
  sortMarks,
  type TextEdit,
  type TextMark,
} from '../src/lib/annotated-text.js';
import AnnotatedText from '../src/lib/components/AnnotatedText.svelte';
import AnnotatedTextHarness from './fixtures/AnnotatedTextHarness.svelte';

const mark = (id: string, start: number, end: number, extra: Partial<TextMark> = {}): TextMark => ({
  id,
  start,
  end,
  label: `Mark ${id}`,
  ...extra,
});

/** Applies `edit` to `text`, inserting `insert` (which must be `edit.inserted` long). */
const apply = (text: string, edit: TextEdit, insert: string) =>
  text.slice(0, edit.start) + insert + text.slice(edit.start + edit.deleted);

const spans = (marks: TextMark[]) => marks.map((entry) => [entry.id, entry.start, entry.end]);

describe('diffText', () => {
  it('returns null for equal strings', () => {
    expect(diffText('abc', 'abc')).toBeNull();
  });

  it('finds insertions, deletions and replacements', () => {
    expect(diffText('Two sheets', 'Two thin sheets')).toEqual({
      start: 4,
      deleted: 0,
      inserted: 5,
    });
    expect(diffText('Two thin sheets', 'Two sheets')).toEqual({
      start: 4,
      deleted: 5,
      inserted: 0,
    });
    expect(diffText('Two sheets', 'Two panels')).toEqual({ start: 4, deleted: 5, inserted: 5 });
    expect(diffText('', 'abc')).toEqual({ start: 0, deleted: 0, inserted: 3 });
    expect(diffText('abc', '')).toEqual({ start: 0, deleted: 3, inserted: 0 });
  });

  it('places an ambiguous edit among repeated characters at the caret', () => {
    // Typing "a" after the first "a" of "aa": the caret ends at 2.
    expect(diffText('aa', 'aaa', 2)).toEqual({ start: 1, deleted: 0, inserted: 1 });
    expect(diffText('aa', 'aaa', 1)).toEqual({ start: 0, deleted: 0, inserted: 1 });
    // Without a caret it goes as late as possible.
    expect(diffText('aa', 'aaa')).toEqual({ start: 2, deleted: 0, inserted: 1 });
    // Backspace over the first "a" of "aab": the caret ends at 0.
    expect(diffText('aab', 'ab', 0)).toEqual({ start: 0, deleted: 1, inserted: 0 });
    expect(diffText('aab', 'ab')).toEqual({ start: 1, deleted: 1, inserted: 0 });
  });

  it('ignores a caret outside the ambiguous window', () => {
    expect(diffText('one two', 'one twoo', 0)).toEqual({ start: 6, deleted: 0, inserted: 1 });
    expect(diffText('one two', 'one twoo', 99)).toEqual({ start: 7, deleted: 0, inserted: 1 });
    expect(diffText('one two', 'one twoo', Number.NaN)).toEqual({
      start: 7,
      deleted: 0,
      inserted: 1,
    });
  });

  it('always describes a valid edit', () => {
    const cases: Array<[string, string, number?]> = [
      ['abab', 'ab', 1],
      ['xyz', 'xyyz', 3],
      ['hello world', 'hello brave new world', 16],
      ['aaaa', 'aa', 0],
      ['abc', 'axc'],
    ];
    for (const [before, after, caret] of cases) {
      const edit = diffText(before, after, caret)!;
      expect(apply(before, edit, after.slice(edit.start, edit.start + edit.inserted))).toBe(after);
    }
  });
});

describe('shiftMarks', () => {
  const word = mark('w', 4, 10); // "sheets" in "Two sheets of ply"

  it('returns the marks untouched for no edit, dropping empty ones', () => {
    const marks = [word, mark('empty', 3, 3)];
    expect(shiftMarks(marks, null)).toEqual([word]);
  });

  it('shifts marks after a typed insertion and leaves earlier ones alone', () => {
    const before = mark('b', 0, 3);
    const result = shiftMarks([before, word], { start: 3, deleted: 0, inserted: 5 });
    expect(result[0]).toBe(before);
    expect(spans(result)).toEqual([
      ['b', 0, 3],
      ['w', 9, 15],
    ]);
  });

  it('grows a mark when text is typed strictly inside it', () => {
    expect(spans(shiftMarks([word], { start: 6, deleted: 0, inserted: 2 }))).toEqual([
      ['w', 4, 12],
    ]);
  });

  it('does not extend a mark when typing at its end, and pushes it when typing at its start', () => {
    expect(shiftMarks([word], { start: 10, deleted: 0, inserted: 1 })[0]).toBe(word);
    expect(spans(shiftMarks([word], { start: 4, deleted: 0, inserted: 1 }))).toEqual([
      ['w', 5, 11],
    ]);
  });

  it('shrinks a mark when part of it is deleted', () => {
    expect(spans(shiftMarks([word], { start: 5, deleted: 2, inserted: 0 }))).toEqual([['w', 4, 8]]);
  });

  it('keeps the surviving side when a deletion crosses a boundary', () => {
    // Deleting "o sh" (2..6) keeps "eets" at 2..6.
    expect(spans(shiftMarks([word], { start: 2, deleted: 4, inserted: 0 }))).toEqual([['w', 2, 6]]);
    // Deleting "ets of" (7..13) keeps "she" at 4..7.
    expect(spans(shiftMarks([word], { start: 7, deleted: 6, inserted: 0 }))).toEqual([['w', 4, 7]]);
  });

  it('drops a mark whose characters are all deleted or replaced', () => {
    expect(shiftMarks([word], { start: 4, deleted: 6, inserted: 0 })).toEqual([]);
    expect(shiftMarks([word], { start: 2, deleted: 12, inserted: 0 })).toEqual([]);
    expect(shiftMarks([word], { start: 4, deleted: 6, inserted: 6 })).toEqual([]);
  });

  it('handles a replacement spanning several marks', () => {
    const marks = [mark('a', 0, 3), mark('b', 4, 10), mark('c', 11, 13), mark('d', 14, 17)];
    // Replace 2..12 ("o sheets o") with "XY".
    const result = shiftMarks(marks, { start: 2, deleted: 10, inserted: 2 });
    expect(spans(result)).toEqual([
      ['a', 0, 2],
      ['c', 4, 5],
      ['d', 6, 9],
    ]);
  });

  it('puts pasted text inside a mark only when the mark survives on both sides', () => {
    // Paste over "eet" (6..9) inside "sheets".
    expect(spans(shiftMarks([word], { start: 6, deleted: 3, inserted: 5 }))).toEqual([
      ['w', 4, 12],
    ]);
    // Paste over "ets of" (7..13): only the left side survives, the paste stays outside.
    expect(spans(shiftMarks([word], { start: 7, deleted: 6, inserted: 4 }))).toEqual([['w', 4, 7]]);
    // Paste over "Two she" (0..7): the right side moves past the paste.
    expect(spans(shiftMarks([word], { start: 0, deleted: 7, inserted: 2 }))).toEqual([['w', 2, 5]]);
  });

  it('keeps extra fields and does not mutate its input', () => {
    const input = [mark('w', 4, 10, { variant: 'error' })];
    const result = shiftMarks(input, { start: 0, deleted: 0, inserted: 1 });
    expect(result[0]).toMatchObject({ variant: 'error', label: 'Mark w', start: 5 });
    expect(input[0].start).toBe(4);
  });

  it('agrees with diffText for real edits', () => {
    const text = 'Two sheets of ply';
    const after = 'Two thin sheets of ply';
    const result = shiftMarks([word, mark('p', 14, 17)], diffText(text, after));
    expect(result.map((entry) => after.slice(entry.start, entry.end))).toEqual(['sheets', 'ply']);
  });
});

describe('mark helpers', () => {
  const marks = [mark('c', 10, 12), mark('a', 0, 3), mark('b', 3, 6), mark('e', 7, 7)];

  it('sorts in reading order', () => {
    expect(sortMarks(marks).map((entry) => entry.id)).toEqual(['a', 'b', 'e', 'c']);
  });

  it('finds the mark at a caret, preferring the one that starts there', () => {
    expect(markAt(marks, 0)?.id).toBe('a');
    expect(markAt(marks, 3)?.id).toBe('b');
    expect(markAt(marks, 6)?.id).toBe('b');
    expect(markAt(marks, 7)).toBeNull();
    expect(markAt(marks, 12)?.id).toBe('c');
  });

  it('steps forward and back, wrapping and skipping empty marks', () => {
    expect(nextMark(marks, 0)?.id).toBe('b');
    expect(nextMark(marks, 6)?.id).toBe('c');
    expect(nextMark(marks, 10)?.id).toBe('a');
    expect(previousMark(marks, 10)?.id).toBe('b');
    expect(previousMark(marks, 0)?.id).toBe('c');
    expect(nextMark([], 0)).toBeNull();
    expect(previousMark([mark('x', 2, 2)], 5)).toBeNull();
  });

  it('cuts text at mark boundaries, clamping and layering overlaps', () => {
    const segments = segmentText('abcdefgh', [mark('x', 1, 5), mark('y', 3, 20), mark('z', -2, 0)]);
    expect(segments.map((s) => [s.text, s.marks.map((m) => m.id).join('')])).toEqual([
      ['a', ''],
      ['bc', 'x'],
      ['de', 'xy'],
      ['fgh', 'y'],
    ]);
    expect(segmentText('', [mark('x', 0, 2)])).toEqual([]);
  });
});

describe('AnnotatedText', () => {
  const marks = () => [
    mark('a', 4, 10, { variant: 'warning', label: 'Low confidence' }),
    mark('b', 14, 17, { variant: 'info', label: 'Rejoined hyphen' }),
  ];

  const field = () => screen.getByRole('textbox', { name: 'Page text' }) as HTMLTextAreaElement;
  const liveRegion = () => document.querySelector('.ldt-annotated-text .ldt-live-region');
  const markState = () => JSON.parse(screen.getByTestId('marks').textContent ?? '[]');

  it('is labelled by its Field and draws each mark in the mirror', () => {
    const { container } = render(AnnotatedTextHarness, { marks: marks() });
    expect(field()).toHaveValue('Two sheets of ply');
    expect(field()).toHaveClass('ldt-textarea', 'ldt-textarea--boxed');
    const drawn = container.querySelectorAll('.ldt-annotated-text__mark');
    expect([...drawn].map((element) => element.textContent)).toEqual(['sheets', 'ply']);
    expect(drawn[0]).toHaveClass('ldt-annotated-text__mark--warning');
    expect(container.querySelector('.ldt-annotated-text__mirror')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    // No stray template whitespace: the mirror must wrap exactly like the textarea.
    expect(container.querySelector('.ldt-annotated-text__mirror')?.textContent).toBe(
      'Two sheets of ply\u200b'
    );
  });

  it('takes an aria-label from `label`', () => {
    render(AnnotatedText, { label: 'Page text', value: 'abc' });
    expect(field()).toHaveValue('abc');
  });

  it('moves marks as the user types before, inside and after them', async () => {
    const user = userEvent.setup();
    render(AnnotatedTextHarness, { marks: marks() });
    const textarea = field();

    await user.click(textarea);
    textarea.setSelectionRange(0, 0);
    await user.keyboard('A ');
    expect(screen.getByTestId('value')).toHaveTextContent('A Two sheets of ply');
    expect(markState()).toEqual([
      ['a', 6, 12],
      ['b', 16, 19],
    ]);

    textarea.setSelectionRange(8, 8); // inside "sheets"
    await user.keyboard('xx');
    expect(markState()).toEqual([
      ['a', 6, 14],
      ['b', 18, 21],
    ]);

    textarea.setSelectionRange(14, 14); // right after the first mark
    await user.keyboard('!');
    expect(markState()).toEqual([
      ['a', 6, 14],
      ['b', 19, 22],
    ]);

    textarea.setSelectionRange(19, 22);
    await user.keyboard('{Backspace}');
    expect(markState()).toEqual([['a', 6, 14]]);
  });

  it('applies an IME composition once, when it ends', async () => {
    render(AnnotatedTextHarness, { marks: marks() });
    const textarea = field();
    textarea.focus();
    textarea.setSelectionRange(0, 0);

    await fireEvent.compositionStart(textarea);
    textarea.value = 'k' + textarea.value;
    textarea.setSelectionRange(1, 1);
    await fireEvent.input(textarea, { isComposing: true });
    expect(screen.getByTestId('value')).toHaveTextContent(/^Two sheets of ply$/);
    expect(markState()).toEqual([
      ['a', 4, 10],
      ['b', 14, 17],
    ]);

    textarea.value = 'か' + textarea.value.slice(1);
    await fireEvent.input(textarea, { isComposing: true });
    await fireEvent.compositionEnd(textarea);
    expect(screen.getByTestId('value')).toHaveTextContent('かTwo sheets of ply');
    expect(markState()).toEqual([
      ['a', 5, 11],
      ['b', 15, 18],
    ]);
  });

  it('describes the field with the mark under the caret and announces entering it', async () => {
    vi.useFakeTimers();
    try {
      const onMarkChange = vi.fn();
      render(AnnotatedTextHarness, {
        marks: marks(),
        description: 'Review the text.',
        onMarkChange,
      });
      const textarea = field();
      textarea.focus();
      textarea.setSelectionRange(6, 6);
      await fireEvent.keyUp(textarea, { key: 'ArrowRight' });

      const ids = textarea.getAttribute('aria-describedby')?.split(' ') ?? [];
      expect(ids).toHaveLength(2);
      expect(document.getElementById(ids[0])).toHaveTextContent('Review the text.');
      expect(document.getElementById(ids[1])).toHaveTextContent('Low confidence');
      expect(onMarkChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'a' }));

      await vi.advanceTimersByTimeAsync(100);
      expect(liveRegion()).toHaveTextContent('Low confidence, mark 1 of 2');

      textarea.setSelectionRange(12, 12);
      textarea.dispatchEvent(new Event('selectionchange'));
      await vi.advanceTimersByTimeAsync(0);
      expect(onMarkChange).toHaveBeenLastCalledWith(null);
      expect(textarea.getAttribute('aria-describedby')?.split(' ')).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a tooltip for the mark under the caret, dismissed with Escape', async () => {
    const { container } = render(AnnotatedTextHarness, { marks: marks() });
    const textarea = field();
    textarea.focus();
    textarea.setSelectionRange(15, 15);
    await fireEvent.select(textarea);
    const tooltip = () => container.querySelector('.ldt-annotated-text__tooltip');
    expect(tooltip()).toHaveTextContent('Rejoined hyphen');
    await fireEvent.keyDown(textarea, { key: 'Escape' });
    expect(tooltip()).toBeNull();
    await fireEvent.blur(textarea);
    expect(tooltip()).toBeNull();
  });

  it('shows the label of the mark under the pointer', async () => {
    const { container } = render(AnnotatedTextHarness, { marks: marks() });
    const [first] = container.querySelectorAll<HTMLElement>('.ldt-annotated-text__mark');
    first.getClientRects = () =>
      [{ left: 10, right: 60, top: 10, bottom: 30 }] as unknown as DOMRectList;
    const textarea = field();
    await fireEvent.pointerMove(textarea, { clientX: 20, clientY: 20, pointerType: 'mouse' });
    const tooltip = container.querySelector('.ldt-annotated-text__tooltip');
    expect(tooltip).toHaveTextContent('Low confidence');
    expect(first).toHaveClass('ldt-annotated-text__mark--active');
    await fireEvent.pointerMove(textarea, { clientX: 200, clientY: 200, pointerType: 'mouse' });
    expect(container.querySelector('.ldt-annotated-text__tooltip')).toBeNull();
    await fireEvent.pointerMove(textarea, { clientX: 20, clientY: 20, pointerType: 'touch' });
    expect(container.querySelector('.ldt-annotated-text__tooltip')).toBeNull();
    await fireEvent.pointerMove(textarea, { clientX: 20, clientY: 20, pointerType: 'mouse' });
    await fireEvent.pointerLeave(textarea);
    expect(container.querySelector('.ldt-annotated-text__tooltip')).toBeNull();
  });

  it('steps through marks with F8, Shift+F8 and the buttons, selecting each', async () => {
    const user = userEvent.setup();
    render(AnnotatedTextHarness, { marks: marks() });
    const textarea = field();
    await user.click(textarea);
    textarea.setSelectionRange(0, 0);

    await user.keyboard('{F8}');
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([4, 10]);
    await user.keyboard('{F8}');
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([14, 17]);
    await user.keyboard('{F8}');
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([4, 10]);
    await user.keyboard('{Shift>}{F8}{/Shift}');
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([14, 17]);

    await user.click(screen.getByRole('button', { name: 'Previous mark' }));
    expect(textarea).toHaveFocus();
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([4, 10]);
    await user.click(screen.getByRole('button', { name: 'Next mark' }));
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([14, 17]);
    expect(screen.getByRole('button', { name: 'Next mark' })).toHaveAttribute(
      'aria-keyshortcuts',
      'F8'
    );
  });

  it('focuses a mark by id through the instance API', async () => {
    const user = userEvent.setup();
    render(AnnotatedTextHarness, { marks: marks() });
    await user.click(screen.getByRole('button', { name: 'Focus b' }));
    expect(field()).toHaveFocus();
    expect([field().selectionStart, field().selectionEnd]).toEqual([14, 17]);
  });

  it('says so when there are no marks to step to', async () => {
    const user = userEvent.setup();
    render(AnnotatedTextHarness, { marks: [] });
    expect(screen.getByRole('button', { name: 'Next mark' })).toBeDisabled();
    await user.click(field());
    await user.keyboard('{F8}');
    await waitFor(() => expect(liveRegion()).toHaveTextContent('No marks'));
  });

  it('hides the buttons with controls={false}', () => {
    render(AnnotatedTextHarness, { marks: marks(), controls: false });
    expect(screen.queryByRole('button', { name: 'Next mark' })).toBeNull();
  });

  it('replaces the text from outside without moving marks', async () => {
    const user = userEvent.setup();
    render(AnnotatedTextHarness, { marks: marks() });
    await user.click(screen.getByRole('button', { name: 'Replace text' }));
    expect(field()).toHaveValue('Replaced');
    expect(markState()).toEqual([
      ['a', 4, 10],
      ['b', 14, 17],
    ]);
  });

  it('forwards its own handlers', async () => {
    const user = userEvent.setup();
    const handlers = {
      oninput: vi.fn(),
      onkeydown: vi.fn(),
      onfocus: vi.fn(),
      onblur: vi.fn(),
    };
    render(AnnotatedText, { label: 'Page text', value: '', ...handlers });
    await user.click(field());
    await user.keyboard('a');
    await user.tab();
    for (const handler of Object.values(handlers)) expect(handler).toHaveBeenCalled();
  });

  it('has no axe violations with the caret in a mark', async () => {
    const { container } = render(AnnotatedTextHarness, { marks: marks() });
    field().focus();
    field().setSelectionRange(5, 5);
    await fireEvent.select(field());
    const results = await axe(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
