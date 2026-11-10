<script lang="ts">
  import { untrack } from 'svelte';
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { createAnnouncer } from '../announcer.svelte.js';
  import {
    diffText,
    markAt,
    nextMark,
    previousMark,
    segmentText,
    shiftMarks,
    sortMarks,
    type TextMark,
  } from '../annotated-text.js';
  import { cx, describedBy as describedByIds } from '../utils.js';
  import Button from './Button.svelte';
  import LiveRegion from './LiveRegion.svelte';

  interface Props extends Omit<HTMLTextareaAttributes, 'value' | 'class'> {
    /** The plain text. Bindable. */
    value?: string;
    /**
     * Marked ranges, as UTF-16 offsets into `value` with an exclusive `end`. Bindable: edits
     * move, resize and drop them. Setting `value` from outside does not move marks, so set both
     * together when you load new text.
     */
    marks?: TextMark[];
    /** Names the field for assistive tech. Omit when a `Field` or `<label>` already names it. */
    label?: string;
    /** Draws the full box, like `Textarea`'s `boxed`. */
    boxed?: boolean;
    /** Shows previous / next buttons under the field. The F8 shortcuts work either way. */
    controls?: boolean;
    previousLabel?: string;
    nextLabel?: string;
    /** Announced when the caret enters a mark. `position` counts from 1 in reading order. */
    markLabel?: (mark: TextMark, position: number, total: number) => string;
    /** Spoken when previous / next is used with no marks left. */
    noMarksLabel?: string;
    /** Called when the caret enters a mark, moves to another, or leaves (`null`). */
    onMarkChange?: (mark: TextMark | null) => void;
    class?: string;
    ref?: HTMLTextAreaElement | null;
  }

  const generatedId = $props.id();

  let {
    value = $bindable(''),
    marks = $bindable([]),
    label,
    boxed = true,
    controls = true,
    previousLabel = 'Previous mark',
    nextLabel = 'Next mark',
    markLabel = (mark, position, total) => `${mark.label}, mark ${position} of ${total}`,
    noMarksLabel = 'No marks',
    onMarkChange,
    class: className,
    ref = $bindable(null),
    'aria-describedby': ariaDescribedBy,
    ...rest
  }: Props = $props();

  const announcer = createAnnouncer();

  /** What the textarea shows. Ahead of `value` only while an IME composition is open. */
  let text = $state(untrack(() => value));
  /** The text `marks` are offsets into: the last committed value. */
  let committed = untrack(() => value);
  let composing = $state(false);
  let caret = $state(0);
  let focused = $state(false);
  let hovered = $state<{ mark: TextMark; segment: HTMLElement } | null>(null);
  let dismissed = $state(false);
  let gutter = $state(0);
  let mirror = $state<HTMLDivElement | null>(null);
  let field = $state<HTMLDivElement | null>(null);
  let tip = $state<HTMLDivElement | null>(null);
  let tipPosition = $state<{ left: number; top?: number; bottom?: number } | null>(null);

  const currentId = `${generatedId}-current`;
  // A trailing newline gives a textarea one more line; a div needs a character to draw it.
  const ZERO_WIDTH = '\u200b';

  // While composing, marks are drawn where the uncommitted text puts them but not published.
  const shown = $derived(composing ? shiftMarks(marks, diffText(committed, text, caret)) : marks);
  const segments = $derived(segmentText(text, shown));
  const ordered = $derived(sortMarks(shown.filter((mark) => mark.end > mark.start)));
  const caretMark = $derived(focused || composing ? markAt(shown, caret) : null);
  const tipMark = $derived(dismissed ? null : (hovered?.mark ?? caretMark));

  // An outside change to `value` replaces the text; it is not an edit, so marks stay put.
  $effect.pre(() => {
    const next = value;
    untrack(() => {
      if (next === committed) return;
      committed = next;
      text = next;
      if (ref && ref.value !== next) ref.value = next;
    });
  });

  function readCaret() {
    if (ref) caret = ref.selectionStart ?? 0;
  }

  function commit() {
    if (!ref) return;
    const next = ref.value;
    text = next;
    readCaret();
    if (next === committed) return;
    marks = shiftMarks(marks, diffText(committed, next, ref.selectionEnd ?? undefined));
    committed = next;
    value = next;
  }

  function handleInput(event: Event) {
    rest.oninput?.(event as Event & { currentTarget: EventTarget & HTMLTextAreaElement });
    if (!ref) return;
    measureGutter();
    // Apply each edit once, when it is committed: mid-composition text is provisional.
    if (composing || (event as InputEvent).isComposing) {
      text = ref.value;
      readCaret();
      return;
    }
    commit();
  }

  function handleCompositionStart(event: CompositionEvent) {
    rest.oncompositionstart?.(
      event as CompositionEvent & { currentTarget: EventTarget & HTMLTextAreaElement }
    );
    composing = true;
  }

  function handleCompositionEnd(event: CompositionEvent) {
    rest.oncompositionend?.(
      event as CompositionEvent & { currentTarget: EventTarget & HTMLTextAreaElement }
    );
    composing = false;
    commit();
  }

  // Tell the caller and the screen reader when the caret moves into another mark.
  let lastMarkId: string | null = null;
  $effect(() => {
    const mark = caretMark;
    untrack(() => {
      const id = mark?.id ?? null;
      if (id === lastMarkId) return;
      lastMarkId = id;
      dismissed = false;
      onMarkChange?.(mark);
      if (mark) {
        const position = ordered.findIndex((entry) => entry.id === mark.id) + 1;
        announcer.announce(markLabel(mark, position, ordered.length));
      }
    });
  });

  function syncScroll() {
    if (!ref || !mirror) return;
    mirror.scrollTop = ref.scrollTop;
    mirror.scrollLeft = ref.scrollLeft;
    hovered = null;
  }

  // A scrollbar in the textarea narrows its text; the mirror has none, so it takes the
  // scrollbar's width as extra padding on the same side.
  function measureGutter() {
    if (!ref) return;
    const style = getComputedStyle(ref);
    const borders =
      (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
    const scrollbar = ref.offsetWidth - ref.clientWidth - borders;
    const padding = parseFloat(style.direction === 'rtl' ? style.paddingLeft : style.paddingRight);
    gutter = scrollbar > 0 ? scrollbar + (padding || 0) : 0;
  }

  $effect(() => {
    const textarea = ref;
    if (!textarea) return;
    measureGutter();
    const onSelectionChange = () => readCaret();
    textarea.addEventListener('selectionchange', onSelectionChange);
    const observer = new ResizeObserver(() => {
      measureGutter();
      syncScroll();
    });
    observer.observe(textarea);
    return () => {
      textarea.removeEventListener('selectionchange', onSelectionChange);
      observer.disconnect();
    };
  });

  // The mirror redraws after every edit; keep its scroll position on the textarea's.
  $effect(() => {
    void segments;
    syncScroll();
  });

  function segmentFor(mark: TextMark): HTMLElement | null {
    const candidates = mirror?.querySelectorAll<HTMLElement>('[data-mark-ids]') ?? [];
    for (const element of candidates) {
      if (element.dataset.markIds?.split(' ').includes(mark.id)) return element;
    }
    return null;
  }

  /** The topmost mark drawn under a point, found by measuring the mirror's mark runs. */
  function markFromPoint(x: number, y: number) {
    const candidates = mirror?.querySelectorAll<HTMLElement>('[data-mark-ids]') ?? [];
    for (const element of candidates) {
      for (const rect of element.getClientRects()) {
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
        const ids = element.dataset.markIds?.split(' ') ?? [];
        const mark = shown.find((entry) => entry.id === ids.at(-1));
        if (mark) return { mark, segment: element };
      }
    }
    return null;
  }

  function handlePointerMove(event: PointerEvent) {
    rest.onpointermove?.(
      event as PointerEvent & { currentTarget: EventTarget & HTMLTextAreaElement }
    );
    if (event.pointerType === 'touch') return;
    const hit = markFromPoint(event.clientX, event.clientY);
    if (hit?.mark.id !== hovered?.mark.id) dismissed = false;
    hovered = hit;
  }

  function handlePointerLeave(event: PointerEvent) {
    rest.onpointerleave?.(
      event as PointerEvent & { currentTarget: EventTarget & HTMLTextAreaElement }
    );
    // Moving onto the tooltip keeps it open (WCAG 1.4.13, hoverable).
    if (tip && event.relatedTarget instanceof Node && tip.contains(event.relatedTarget)) return;
    hovered = null;
  }

  // Place the tooltip over the first line of its mark, or under it near the top of the screen.
  $effect(() => {
    const mark = tipMark;
    const host = field;
    if (!mark || !host || !ref) {
      tipPosition = null;
      return;
    }
    void segments;
    const element = hovered?.mark.id === mark.id ? hovered.segment : segmentFor(mark);
    const rect = element?.getClientRects()[0];
    const box = ref.getBoundingClientRect();
    if (!rect || rect.bottom < box.top || rect.top > box.bottom) {
      tipPosition = null;
      return;
    }
    const origin = host.getBoundingClientRect();
    const width = tip?.offsetWidth ?? 0;
    const left = Math.max(0, Math.min(rect.left - origin.left, origin.width - width));
    const gap = 6;
    tipPosition =
      rect.top < 48
        ? { left, top: rect.bottom - origin.top + gap }
        : { left, bottom: origin.bottom - rect.top + gap };
  });

  /** Selects a mark's characters, focuses the field and scrolls the mark into view. */
  export function focusMark(id: string): boolean {
    const mark = marks.find((entry) => entry.id === id && entry.end > entry.start);
    if (!ref || !mark) return false;
    ref.focus({ preventScroll: true });
    ref.setSelectionRange(mark.start, mark.end);
    readCaret();
    const element = segmentFor(mark);
    if (element) {
      const style = getComputedStyle(ref);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;
      const top = element.offsetTop;
      const bottom = top + element.offsetHeight;
      if (top - padTop < ref.scrollTop) ref.scrollTop = Math.max(0, top - padTop);
      else if (bottom + padBottom > ref.scrollTop + ref.clientHeight)
        ref.scrollTop = bottom + padBottom - ref.clientHeight;
      syncScroll();
    }
    ref.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    return true;
  }

  function step(direction: 1 | -1): TextMark | null {
    if (!ref) return null;
    const offset = ref.selectionStart ?? 0;
    const target = direction > 0 ? nextMark(marks, offset) : previousMark(marks, offset);
    if (!target) {
      announcer.announce(noMarksLabel);
      return null;
    }
    // Landing on the mark the caret is already in says nothing new; repeat it on purpose.
    if (target.id === lastMarkId) {
      const position = ordered.findIndex((entry) => entry.id === target.id) + 1;
      announcer.announce(markLabel(target, position, ordered.length));
    }
    focusMark(target.id);
    return target;
  }

  /** Selects the next mark after the caret, wrapping to the first. */
  export function next(): TextMark | null {
    return step(1);
  }

  /** Selects the previous mark before the caret, wrapping to the last. */
  export function previous(): TextMark | null {
    return step(-1);
  }

  function handleKeydown(event: KeyboardEvent) {
    rest.onkeydown?.(event as KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement });
    if (event.defaultPrevented) return;
    if (event.key === 'F8' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      if (event.shiftKey) previous();
      else next();
      return;
    }
    if (event.key === 'Escape' && tipMark && !composing) {
      dismissed = true;
      event.preventDefault();
    }
  }

  function handleFocus(event: FocusEvent) {
    rest.onfocus?.(event as FocusEvent & { currentTarget: EventTarget & HTMLTextAreaElement });
    focused = true;
    readCaret();
  }

  function handleBlur(event: FocusEvent) {
    rest.onblur?.(event as FocusEvent & { currentTarget: EventTarget & HTMLTextAreaElement });
    focused = false;
  }

  const describedBy = $derived(describedByIds(ariaDescribedBy, caretMark && currentId));
</script>

<div class={cx('ldt-annotated-text', className)}>
  <div bind:this={field} class="ldt-annotated-text__field">
    <div
      bind:this={mirror}
      class={cx('ldt-textarea', boxed && 'ldt-textarea--boxed', 'ldt-annotated-text__mirror')}
      style:padding-inline-end={gutter ? `${gutter}px` : undefined}
      aria-hidden="true"
    >
      {#each segments as segment (segment.start)}{#if segment.marks.length}<span
            class={cx(
              'ldt-annotated-text__mark',
              `ldt-annotated-text__mark--${segment.marks.at(-1)?.variant ?? 'default'}`,
              segment.marks.some((mark) => mark.id === tipMark?.id) &&
                'ldt-annotated-text__mark--active'
            )}
            data-mark-ids={segment.marks.map((mark) => mark.id).join(' ')}>{segment.text}</span
          >{:else}{segment.text}{/if}{/each}{ZERO_WIDTH}
    </div>
    <textarea
      bind:this={ref}
      class={cx('ldt-textarea', boxed && 'ldt-textarea--boxed', 'ldt-annotated-text__input')}
      aria-label={label}
      {...rest}
      aria-describedby={describedBy}
      value={untrack(() => text)}
      oninput={handleInput}
      oncompositionstart={handleCompositionStart}
      oncompositionend={handleCompositionEnd}
      onscroll={(event) => {
        rest.onscroll?.(event);
        syncScroll();
      }}
      onkeydown={handleKeydown}
      onkeyup={(event) => {
        rest.onkeyup?.(event);
        readCaret();
      }}
      onpointerup={(event) => {
        rest.onpointerup?.(event);
        readCaret();
      }}
      onselect={(event) => {
        rest.onselect?.(event);
        readCaret();
      }}
      onfocus={handleFocus}
      onblur={handleBlur}
      onpointermove={handlePointerMove}
      onpointerleave={handlePointerLeave}
    ></textarea>
    {#if tipMark}
      <div
        bind:this={tip}
        class="ldt-tooltip ldt-annotated-text__tooltip"
        aria-hidden="true"
        style:visibility={tipPosition ? undefined : 'hidden'}
        style:left={tipPosition ? `${tipPosition.left}px` : undefined}
        style:top={tipPosition?.top !== undefined ? `${tipPosition.top}px` : undefined}
        style:bottom={tipPosition?.bottom !== undefined ? `${tipPosition.bottom}px` : undefined}
        onpointerleave={(event) => {
          if (!(event.relatedTarget instanceof Node && ref?.contains(event.relatedTarget)))
            hovered = null;
        }}
      >
        {tipMark.label}
      </div>
    {/if}
  </div>
  <span id={currentId} class="ldt-sr-only">{caretMark?.label ?? ''}</span>
  {#if controls}
    <div class="ldt-annotated-text__controls">
      <Button
        size="sm"
        variant="quiet"
        disabled={!ordered.length}
        aria-keyshortcuts="Shift+F8"
        onclick={() => previous()}>{previousLabel}</Button
      >
      <Button
        size="sm"
        variant="quiet"
        disabled={!ordered.length}
        aria-keyshortcuts="F8"
        onclick={() => next()}>{nextLabel}</Button
      >
    </div>
  {/if}
  <LiveRegion message={announcer.message} politeness={announcer.politeness} />
</div>
