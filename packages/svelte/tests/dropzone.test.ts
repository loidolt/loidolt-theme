import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import Dropzone from '../src/lib/components/Dropzone.svelte';
import { filterFiles, matchesAccept, parseAccept } from '../src/lib/file-accept.js';

const pdf = (name = 'report.pdf', size = 10) =>
  new File(['x'.repeat(size)], name, { type: 'application/pdf' });
const png = (name = 'photo.png') => new File(['png'], name, { type: 'image/png' });
const doc = (name = 'notes.docx') =>
  new File(['doc'], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

/** jsdom has no DataTransfer; the handlers only read `types` and `files`. */
const transfer = (files: File[], types = ['Files']) => ({ types, files, dropEffect: 'none' });

const scan = (element: Element) =>
  axe(element, { rules: { 'color-contrast': { enabled: false } } });

const target = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('.ldt-dropzone__target')!;
const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.ldt-dropzone')!;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('parseAccept', () => {
  it('splits, trims and lowercases, dropping tokens a browser ignores', () => {
    expect(parseAccept(' .PDF, image/* ,application/pdf, bogus, , .')).toEqual([
      '.pdf',
      'image/*',
      'application/pdf',
    ]);
    expect(parseAccept(undefined)).toEqual([]);
    expect(parseAccept('')).toEqual([]);
  });
});

describe('matchesAccept', () => {
  it('accepts everything without a filter, or with only invalid tokens', () => {
    expect(matchesAccept(doc(), undefined)).toBe(true);
    expect(matchesAccept(doc(), '')).toBe(true);
    expect(matchesAccept(doc(), 'nonsense')).toBe(true);
  });

  it('matches extensions against the end of the name, ignoring case', () => {
    expect(matchesAccept({ name: 'SCAN.PDF', type: '' }, '.pdf')).toBe(true);
    expect(matchesAccept({ name: 'archive.tar.gz', type: '' }, '.tar.gz')).toBe(true);
    expect(matchesAccept({ name: 'pdf', type: '' }, '.pdf')).toBe(false);
  });

  it('matches exact MIME types, ignoring parameters', () => {
    expect(matchesAccept(pdf(), 'application/pdf')).toBe(true);
    expect(matchesAccept({ name: 'a.txt', type: 'text/plain; charset=utf-8' }, 'text/plain')).toBe(
      true
    );
    expect(matchesAccept(png(), 'application/pdf')).toBe(false);
  });

  it('matches `type/*` wildcards on the top-level type', () => {
    expect(matchesAccept(png(), 'image/*')).toBe(true);
    expect(matchesAccept(pdf(), 'image/*')).toBe(false);
    expect(matchesAccept({ name: 'imagex', type: 'imagery/x' }, 'image/*')).toBe(false);
  });

  it('cannot match a MIME token when the browser reports no type', () => {
    expect(matchesAccept({ name: 'unknown', type: '' }, 'image/*,application/pdf')).toBe(false);
  });
});

describe('filterFiles', () => {
  it('sorts by type, then size, then count', () => {
    const big = pdf('big.pdf', 100);
    const { accepted, rejected } = filterFiles([pdf('a.pdf'), doc(), big, png(), pdf('c.pdf')], {
      accept: '.pdf,image/*',
      maxSize: 50,
      maxFiles: 2,
    });
    expect(accepted.map((file) => file.name)).toEqual(['a.pdf', 'photo.png']);
    expect(rejected.map(({ file, reason }) => [file.name, reason])).toEqual([
      ['notes.docx', 'type'],
      ['big.pdf', 'size'],
      ['c.pdf', 'count'],
    ]);
  });

  it('keeps only the first accepted file when not multiple', () => {
    const { accepted, rejected } = filterFiles([doc(), pdf('a.pdf'), pdf('b.pdf')], {
      multiple: false,
      maxFiles: 5,
    });
    expect(accepted.map((file) => file.name)).toEqual(['notes.docx']);
    expect(rejected.map(({ reason }) => reason)).toEqual(['count', 'count']);
  });

  it('takes array-likes and treats a missing size as zero', () => {
    const { accepted } = filterFiles({ length: 1, 0: { name: 'a.pdf', type: '' } }, { maxSize: 1 });
    expect(accepted).toHaveLength(1);
    expect(filterFiles([])).toEqual({ accepted: [], rejected: [] });
  });
});

describe('Dropzone', () => {
  it('renders a real, labelled file input with its hint as description', () => {
    render(Dropzone, {
      props: {
        label: 'Drop PDFs',
        hint: 'Up to 10 MB',
        accept: '.pdf',
        name: 'docs',
        multiple: true,
      },
    });
    const input = screen.getByLabelText('Drop PDFs') as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input).toHaveAttribute('accept', '.pdf');
    expect(input).toHaveAttribute('name', 'docs');
    expect(input.multiple).toBe(true);
    expect(input).toHaveAccessibleDescription('Up to 10 MB');
    expect(screen.getByText('or choose files')).toBeInTheDocument();
  });

  it('has no axe violations, idle and with a rejection showing', async () => {
    const { container, component } = render(Dropzone, {
      props: { accept: '.pdf', hint: 'PDF only' },
    });
    expect((await scan(container)).violations).toEqual([]);
    flushSync(() => component.addFiles([doc()]));
    expect((await scan(container)).violations).toEqual([]);
  });

  it('accepts a drop, filtering by accept, and reports both lists', async () => {
    const onFiles = vi.fn();
    const { container } = render(Dropzone, {
      props: { accept: '.pdf,image/*', multiple: true, onFiles },
    });
    const area = target(container);
    await fireEvent.dragEnter(area, { dataTransfer: transfer([]) });
    expect(root(container)).toHaveAttribute('data-dragging');
    const over = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(over, 'dataTransfer', { value: transfer([]) });
    area.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);

    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: transfer([pdf(), doc(), png()]) });
    area.dispatchEvent(drop);
    flushSync();
    expect(drop.defaultPrevented).toBe(true);
    expect(root(container)).not.toHaveAttribute('data-dragging');
    const [accepted, rejected] = onFiles.mock.calls[0];
    expect(accepted.map((file: File) => file.name)).toEqual(['report.pdf', 'photo.png']);
    expect(rejected).toEqual([
      { file: expect.objectContaining({ name: 'notes.docx' }), reason: 'type' },
    ]);
  });

  it('keeps the drag state through nested enter/leave pairs instead of flickering', async () => {
    const { container } = render(Dropzone, { props: { label: 'Drop', hint: 'Hint' } });
    const area = target(container);
    const hint = container.querySelector('.ldt-dropzone__hint')!;
    await fireEvent.dragEnter(area, { dataTransfer: transfer([]) });
    await fireEvent.dragEnter(hint, { dataTransfer: transfer([]) });
    await fireEvent.dragLeave(area, { dataTransfer: transfer([]) });
    expect(root(container)).toHaveAttribute('data-dragging');
    await fireEvent.dragLeave(hint, { dataTransfer: transfer([]) });
    expect(root(container)).not.toHaveAttribute('data-dragging');
    // An extra leave never takes the count below zero.
    await fireEvent.dragLeave(area, { dataTransfer: transfer([]) });
    await fireEvent.dragEnter(area, { dataTransfer: transfer([]) });
    expect(root(container)).toHaveAttribute('data-dragging');
  });

  it('ignores drags that carry no files, and everything while disabled', async () => {
    const onFiles = vi.fn();
    const { container, component, rerender } = render(Dropzone, { props: { onFiles } });
    const area = target(container);
    await fireEvent.dragEnter(area, { dataTransfer: transfer([], ['text/plain']) });
    await fireEvent.dragOver(area, { dataTransfer: transfer([], ['text/plain']) });
    await fireEvent.dragLeave(area, { dataTransfer: transfer([], ['text/plain']) });
    await fireEvent.drop(area, { dataTransfer: transfer([], ['text/plain']) });
    expect(root(container)).not.toHaveAttribute('data-dragging');

    await rerender({ onFiles, disabled: true });
    expect(root(container)).toHaveAttribute('data-disabled');
    expect(screen.getByLabelText('Drop files here')).toBeDisabled();
    await fireEvent.dragEnter(area, { dataTransfer: transfer([pdf()]) });
    await fireEvent.drop(area, { dataTransfer: transfer([pdf()]) });
    expect(root(container)).not.toHaveAttribute('data-dragging');
    expect(component.addFiles([pdf()])).toEqual({ accepted: [], rejected: [] });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('shows, describes and announces a rejection, and clears it on the next good batch', async () => {
    vi.useFakeTimers();
    const { container, component } = render(Dropzone, { props: { accept: '.pdf' } });
    const input = screen.getByLabelText('Drop files here');
    flushSync(() => component.addFiles([doc()]));
    const error = container.querySelector('.ldt-dropzone__error')!;
    expect(error).toHaveTextContent('notes.docx is not an accepted file type.');
    expect(input).toHaveAccessibleDescription('notes.docx is not an accepted file type.');
    vi.advanceTimersByTime(60);
    flushSync();
    const region = screen.getByRole('alert');
    expect(region).toHaveTextContent('notes.docx is not an accepted file type.');

    flushSync(() => component.addFiles([pdf()]));
    expect(container.querySelector('.ldt-dropzone__error')).toBeNull();
    vi.advanceTimersByTime(60);
    flushSync();
    expect(screen.getByRole('status')).toHaveTextContent('report.pdf added.');
  });

  it('words size, count and many-file rejections, and takes custom labels', () => {
    const { container, component, rerender } = render(Dropzone, {
      props: { maxSize: 5, label: 'Drop' },
    });
    const message = () => container.querySelector('.ldt-dropzone__error')?.textContent;
    flushSync(() => component.addFiles([pdf('big.pdf', 50), pdf('a.pdf', 1), pdf('b.pdf', 1)]));
    expect(message()).toBe('big.pdf is too large. b.pdf is over the file limit.');
    flushSync(() =>
      component.addFiles([doc('1'), doc('2'), doc('3'), doc('4')].map((f) => pdf(f.name, 50)))
    );
    expect(message()).toBe('4 files were not added.');

    void rerender({
      maxSize: 5,
      label: 'Drop',
      rejectedLabel: (rejected) => `Nope: ${rejected.length}`,
      addedLabel: (accepted) => `Yes: ${accepted.length}`,
    });
    flushSync(() => component.addFiles([pdf('big.pdf', 50)]));
    expect(message()).toBe('Nope: 1');
  });

  it('announces several accepted files by count', () => {
    vi.useFakeTimers();
    const { component } = render(Dropzone, { props: { multiple: true } });
    flushSync(() => component.addFiles([pdf('a.pdf'), pdf('b.pdf')]));
    vi.advanceTimersByTime(60);
    flushSync();
    expect(screen.getByRole('status')).toHaveTextContent('2 files added.');
  });

  it('addFiles takes a FileList-like, returns the split and ignores an empty batch', () => {
    const onFiles = vi.fn();
    const { component } = render(Dropzone, { props: { accept: 'image/*', onFiles } });
    const result = component.addFiles({ length: 2, 0: png(), 1: pdf() } as unknown as FileList);
    expect(result.accepted.map((file) => file.name)).toEqual(['photo.png']);
    expect(result.rejected.map(({ reason }) => reason)).toEqual(['type']);
    expect(onFiles).toHaveBeenCalledOnce();
    component.addFiles([]);
    expect(onFiles).toHaveBeenCalledOnce();
  });

  it('runs the picker path through the same filter', async () => {
    const onFiles = vi.fn();
    render(Dropzone, { props: { accept: '.pdf', multiple: true, onFiles } });
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(screen.getByLabelText('Drop files here'), [pdf(), png()]);
    const [accepted, rejected] = onFiles.mock.calls[0];
    expect(accepted.map((file: File) => file.name)).toEqual(['report.pdf']);
    expect(rejected[0].file.name).toBe('photo.png');
  });

  it('opens the picker from Enter and Space, and from open()', async () => {
    const { component, rerender } = render(Dropzone, {});
    const input = screen.getByLabelText('Drop files here') as HTMLInputElement;
    const click = vi.spyOn(input, 'click');
    input.focus();
    const user = userEvent.setup();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(click).toHaveBeenCalledTimes(2);
    await user.keyboard('a');
    expect(click).toHaveBeenCalledTimes(2);
    component.open();
    expect(click).toHaveBeenCalledTimes(3);
    await rerender({ disabled: true });
    component.open();
    expect(click).toHaveBeenCalledTimes(3);
  });

  it('puts the accepted files into the input, keeping the last good batch', () => {
    const assigned: File[][] = [];
    vi.stubGlobal(
      'DataTransfer',
      class {
        list: File[] = [];
        items = { add: (file: File) => this.list.push(file) };
        get files() {
          return this.list;
        }
      }
    );
    const { component } = render(Dropzone, { props: { accept: '.pdf', multiple: true } });
    const input = screen.getByLabelText('Drop files here');
    Object.defineProperty(input, 'files', {
      configurable: true,
      set: (files: File[]) => assigned.push([...files]),
    });
    flushSync(() => component.addFiles([pdf('a.pdf'), png()]));
    flushSync(() => component.addFiles([doc()]));
    expect(assigned.map((files) => files.map((file) => file.name))).toEqual([['a.pdf'], ['a.pdf']]);
  });

  it('survives a browser that refuses to set files', () => {
    vi.stubGlobal(
      'DataTransfer',
      class {
        constructor() {
          throw new Error('not allowed');
        }
      }
    );
    const onFiles = vi.fn();
    const { component } = render(Dropzone, { props: { onFiles } });
    component.addFiles([pdf()]);
    expect(onFiles).toHaveBeenCalledOnce();
  });

  it('renders custom content but keeps the label as the accessible name', async () => {
    const { container } = render(Dropzone, {
      props: {
        label: 'Drop scans',
        hint: 'TIFF only',
        children: createRawSnippet<[{ dragging: boolean }]>((state) => ({
          render: () => `<span class="custom">${state().dragging ? 'Release' : 'Custom'}</span>`,
        })),
      },
    });
    expect(container.querySelector('.custom')).toHaveTextContent('Custom');
    expect(container.querySelector('.ldt-dropzone__label')).toBeNull();
    const input = screen.getByLabelText('Drop scans');
    expect(input).toHaveAccessibleDescription('TIFF only');
    expect((await scan(container)).violations).toEqual([]);
  });

  it('forwards id and aria-describedby to the input, and class and attributes to the root', () => {
    const { container } = render(Dropzone, {
      props: { id: 'upload', 'aria-describedby': 'outside', class: 'extra', 'data-x': 'y' },
    });
    const input = screen.getByLabelText('Drop files here');
    expect(input.id).toBe('upload');
    expect(input.getAttribute('aria-describedby')).toBe('outside');
    expect(root(container)).toHaveClass('ldt-dropzone', 'extra');
    expect(root(container)).toHaveAttribute('data-x', 'y');
  });

  describe('window target', () => {
    const fire = (
      type: string,
      files: File[] = [],
      types = ['Files'],
      on: EventTarget = window
    ) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: transfer(files, types) });
      on.dispatchEvent(event);
      flushSync();
      return event;
    };

    it('counts window-wide drags without flicker and shows an overlay', () => {
      const { container } = render(Dropzone, { props: { window: true, label: 'Drop anywhere' } });
      fire('dragenter', [], ['Files'], document.body);
      fire('dragenter', [], ['Files'], document.body);
      fire('dragleave', [], ['Files'], document.body);
      expect(root(container)).toHaveAttribute('data-window-dragging');
      const overlay = container.querySelector('.ldt-dropzone__overlay')!;
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
      expect(overlay).toHaveTextContent('Drop anywhere');
      fire('dragleave', [], ['Files'], document.body);
      expect(root(container)).not.toHaveAttribute('data-window-dragging');
      fire('dragleave', [], ['Files'], document.body);
      fire('dragenter', [], ['text/plain'], document.body);
      expect(root(container)).not.toHaveAttribute('data-window-dragging');
    });

    it('takes a drop anywhere, once, including one on the area itself', () => {
      const onFiles = vi.fn();
      const { container } = render(Dropzone, { props: { window: true, onFiles } });
      fire('dragenter', [], ['Files'], document.body);
      expect(fire('dragover', [], ['Files'], document.body).defaultPrevented).toBe(true);
      expect(fire('dragover', [], ['text/plain'], document.body).defaultPrevented).toBe(false);
      const drop = fire('drop', [pdf()], ['Files'], document.body);
      expect(drop.defaultPrevented).toBe(true);
      expect(onFiles).toHaveBeenCalledTimes(1);
      expect(root(container)).not.toHaveAttribute('data-window-dragging');

      fire('dragenter', [], ['Files'], target(container));
      fire('drop', [pdf()], ['Files'], target(container));
      expect(onFiles).toHaveBeenCalledTimes(2);
    });

    it('leaves drops another target handled, non-file drops, and resets on dragend', () => {
      const onFiles = vi.fn();
      const { container } = render(Dropzone, { props: { window: true, onFiles } });
      const other = document.createElement('div');
      document.body.append(other);
      other.addEventListener('drop', (event) => event.preventDefault());
      fire('drop', [pdf()], ['Files'], other);
      fire('drop', [], ['text/plain'], document.body);
      expect(onFiles).not.toHaveBeenCalled();
      fire('dragenter', [], ['Files'], document.body);
      fire('dragend', [], ['Files'], document.body);
      expect(root(container)).not.toHaveAttribute('data-window-dragging');
      other.remove();
    });

    it('stops listening when switched off or disabled', async () => {
      const onFiles = vi.fn();
      const { container, rerender } = render(Dropzone, { props: { window: true, onFiles } });
      fire('dragenter', [], ['Files'], document.body);
      await rerender({ window: false, onFiles });
      expect(root(container)).not.toHaveAttribute('data-window-dragging');
      fire('drop', [pdf()], ['Files'], document.body);
      await rerender({ window: true, disabled: true, onFiles });
      fire('drop', [pdf()], ['Files'], document.body);
      expect(onFiles).not.toHaveBeenCalled();
    });
  });
});
