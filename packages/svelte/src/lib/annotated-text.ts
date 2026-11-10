import type { BadgeVariant } from './types.js';

/**
 * A marked range of plain text. Offsets are UTF-16 code units, as `String#slice` and a
 * textarea's `selectionStart` count them; `end` is exclusive.
 */
export interface TextMark {
  id: string;
  start: number;
  end: number;
  /** Colour from the status set. Defaults to `'default'`, a neutral mark. */
  variant?: BadgeVariant;
  /** Says why the range is marked. Shown as a tooltip and read to assistive technology. */
  label: string;
}

/**
 * One contiguous change to a string: `deleted` code units removed at `start`, then `inserted`
 * code units put in their place. Typing, paste, cut, drag and drop, undo and an IME commit
 * all reduce to this.
 */
export interface TextEdit {
  start: number;
  deleted: number;
  inserted: number;
}

/**
 * Works out the single edit that turns `before` into `after`, or `null` when they are equal.
 *
 * A change among repeated characters is ambiguous: typing `a` into `aa` could have happened at
 * any of three offsets. Pass `caret` — where the caret sits in `after` once the edit is done,
 * i.e. the end of whatever was inserted — and the edit is placed there when it can be. Without
 * it, or when it points outside the ambiguous window, the edit is placed as late as possible.
 */
export function diffText(before: string, after: string, caret?: number): TextEdit | null {
  if (before === after) return null;
  const shorter = Math.min(before.length, after.length);

  let prefix = 0;
  while (prefix < shorter && before.charCodeAt(prefix) === after.charCodeAt(prefix)) prefix++;
  const suffixAfter = (start: number) => {
    let suffix = 0;
    const room = shorter - start;
    while (
      suffix < room &&
      before.charCodeAt(before.length - 1 - suffix) === after.charCodeAt(after.length - 1 - suffix)
    )
      suffix++;
    return suffix;
  };

  // The earliest start an edit of the same size could have: as much suffix as possible.
  const longestSuffix = suffixAfter(0);
  const earliest = Math.max(0, Math.min(prefix, shorter - longestSuffix));
  const inserted = after.length - prefix - suffixAfter(prefix);

  let start = prefix;
  if (caret !== undefined && Number.isFinite(caret)) {
    start = Math.min(prefix, Math.max(earliest, Math.trunc(caret) - inserted));
  }
  const suffix = suffixAfter(start);
  return {
    start,
    deleted: before.length - start - suffix,
    inserted: after.length - start - suffix,
  };
}

/**
 * Moves marks so they stay on the same characters after `edit`. Returns a new array in the
 * same order; untouched marks are returned as the same objects.
 *
 * - Edits wholly before a mark shift it; edits wholly after leave it alone.
 * - Text inserted strictly inside a mark grows it. Text inserted exactly at a mark's start or
 *   end lands outside it: typing at the start pushes the mark along, typing at the end does
 *   not extend it.
 * - Deleting part of a mark shrinks it. A replacement keeps the mark on its surviving
 *   characters; the new text joins the mark only when characters of the mark survive on both
 *   sides of it.
 * - A mark with no characters left is dropped, and so is one that was empty to begin with.
 */
export function shiftMarks<T extends TextMark>(marks: readonly T[], edit: TextEdit | null): T[] {
  if (!edit) return marks.filter((mark) => mark.end > mark.start);
  const { start, deleted, inserted } = edit;
  const removedEnd = start + deleted;
  const delta = inserted - deleted;
  const result: T[] = [];
  for (const mark of marks) {
    if (mark.end <= mark.start) continue;
    let next: { start: number; end: number };
    if (mark.end <= start) {
      // Before the edit, including text inserted right at the mark's end.
      result.push(mark);
      continue;
    } else if (mark.start >= removedEnd) {
      // After it, including text inserted right at the mark's start.
      if (delta === 0) {
        result.push(mark);
        continue;
      }
      next = { start: mark.start + delta, end: mark.end + delta };
    } else {
      const keepsLeft = mark.start < start;
      const keepsRight = mark.end > removedEnd;
      next = {
        start: keepsLeft ? mark.start : start + inserted,
        end: keepsRight ? mark.end + delta : start,
      };
    }
    if (next.end > next.start) result.push({ ...mark, ...next });
  }
  return result;
}

/** Marks ordered as they appear in the text: by start, then by end. */
export function sortMarks<T extends TextMark>(marks: readonly T[]): T[] {
  return [...marks].sort((a, b) => a.start - b.start || a.end - b.end);
}

/**
 * The mark the caret is in. A caret counts as in a mark from just before its first character to
 * just after its last. Where two marks touch, the one that starts at the caret wins.
 */
export function markAt<T extends TextMark>(marks: readonly T[], offset: number): T | null {
  let touching: T | null = null;
  for (const mark of sortMarks(marks)) {
    if (mark.end <= mark.start) continue;
    if (mark.start <= offset && offset < mark.end) return mark;
    if (mark.end === offset) touching = mark;
  }
  return touching;
}

/**
 * The next mark after `offset` in reading order, wrapping to the first. `null` when there are
 * no marks.
 */
export function nextMark<T extends TextMark>(marks: readonly T[], offset: number): T | null {
  const sorted = sortMarks(marks).filter((mark) => mark.end > mark.start);
  return sorted.find((mark) => mark.start > offset) ?? sorted[0] ?? null;
}

/** The previous mark before `offset` in reading order, wrapping to the last. */
export function previousMark<T extends TextMark>(marks: readonly T[], offset: number): T | null {
  const sorted = sortMarks(marks).filter((mark) => mark.end > mark.start);
  const before = sorted.filter((mark) => mark.start < offset);
  return before.at(-1) ?? sorted.at(-1) ?? null;
}

/** One run of text for drawing: the marks covering it, in the order they were given. */
export interface TextSegment<T extends TextMark = TextMark> {
  start: number;
  end: number;
  text: string;
  marks: T[];
}

/**
 * Cuts `text` into runs at every mark boundary, so overlapping marks can be drawn. Marks are
 * clamped to the text; a mark reaching past the end covers what is there.
 */
export function segmentText<T extends TextMark>(
  text: string,
  marks: readonly T[]
): TextSegment<T>[] {
  const length = text.length;
  const clamped = marks
    .map((mark) => ({
      mark,
      start: Math.max(0, Math.min(length, mark.start)),
      end: Math.max(0, Math.min(length, mark.end)),
    }))
    .filter((entry) => entry.end > entry.start);
  const cuts = new Set<number>([0, length]);
  for (const entry of clamped) cuts.add(entry.start).add(entry.end);
  const points = [...cuts].sort((a, b) => a - b);
  const segments: TextSegment<T>[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    const [start, end] = [points[index], points[index + 1]];
    segments.push({
      start,
      end,
      text: text.slice(start, end),
      marks: clamped.filter((entry) => entry.start <= start && entry.end >= end).map((e) => e.mark),
    });
  }
  return segments;
}
