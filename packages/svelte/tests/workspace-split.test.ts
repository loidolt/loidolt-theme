import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorkspaceHarness from './fixtures/WorkspaceHarness.svelte';

const divider = () => screen.getByRole('separator', { name: 'Resize inspector' });
const value = () => Number(divider().getAttribute('aria-valuenow'));

/** Lays the panes out in a row: main 0–699, a 1px divider at 700, the inspector 701–1000. */
const layOut = (reversed = false) => {
  const box = (left: number, width: number) =>
    ({ left, right: left + width, width, top: 0, bottom: 100, height: 100 }) as DOMRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    if (this.classList.contains('ldt-workspace__main'))
      return reversed ? box(301, 700) : box(0, 700);
    if (this.classList.contains('ldt-workspace__divider')) return box(reversed ? 300 : 700, 1);
    if (this.classList.contains('ldt-workspace__inspector'))
      return reversed ? box(0, 300) : box(701, 300);
    return box(0, 1001);
  });
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('Workspace resizable split', () => {
  it('leaves the default layout alone unless asked', () => {
    render(WorkspaceHarness, { withInspector: true });
    const workspace = screen.getByTestId('workspace');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(workspace).not.toHaveClass('ldt-workspace--resizable');
    expect(workspace.querySelector('.ldt-workspace__inspector')).toBeNull();
    expect(workspace.getAttribute('style')).toBeNull();
  });

  it('has no divider without an open inspector', async () => {
    const { rerender } = render(WorkspaceHarness, { resizable: true });
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    await rerender({ resizable: true, withInspector: true, inspectorOpen: false });
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('exposes a labelled vertical separator that controls the inspector', () => {
    render(WorkspaceHarness, { withSidebar: true, withInspector: true, resizable: true });
    const workspace = screen.getByTestId('workspace');
    const separator = divider();
    expect(workspace).toHaveClass('ldt-workspace--resizable', 'ldt-workspace--sidebar');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('tabindex', '0');
    expect(separator).toHaveAttribute('aria-valuenow', '30');
    expect(separator).toHaveAttribute('aria-valuemin', '15');
    expect(separator).toHaveAttribute('aria-valuemax', '70');
    const pane = document.getElementById(separator.getAttribute('aria-controls')!);
    expect(pane).toHaveClass('ldt-workspace__inspector');
    expect(pane).toContainElement(screen.getByRole('complementary', { name: 'Inspector' }));
    expect(workspace.style.getPropertyValue('--ldt-inspector-share')).toBe('30fr');
    expect(workspace.style.getPropertyValue('--ldt-main-share')).toBe('70fr');
  });

  it('takes a label and clamps the size it is given', () => {
    render(WorkspaceHarness, {
      withInspector: true,
      resizable: true,
      inspectorSize: 95,
      inspectorMaxSize: 80,
      resizeLabel: 'Resize notes',
    });
    const separator = screen.getByRole('separator', { name: 'Resize notes' });
    expect(separator).toHaveAttribute('aria-valuenow', '80');
  });

  it('resizes from the keyboard, with bigger steps on Shift and Home/End for the limits', async () => {
    const user = userEvent.setup();
    render(WorkspaceHarness, { withInspector: true, resizable: true });
    await user.tab();
    expect(divider()).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(value()).toBe(32);
    expect(screen.getByTestId('size')).toHaveTextContent('32');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(value()).toBe(28);
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(value()).toBe(38);
    await user.keyboard('{End}');
    expect(value()).toBe(70);
    await user.keyboard('{ArrowLeft}');
    expect(value()).toBe(70);
    await user.keyboard('{Home}');
    expect(value()).toBe(15);
    await user.keyboard('{ArrowRight}');
    expect(value()).toBe(15);
    // Keys it does not handle pass through.
    await user.keyboard('a');
    expect(value()).toBe(15);
  });

  it('collapses to the minimum on Enter and restores on the next press', async () => {
    const user = userEvent.setup();
    render(WorkspaceHarness, { withInspector: true, resizable: true, inspectorSize: 40 });
    divider().focus();
    await user.keyboard('{Enter}');
    expect(value()).toBe(15);
    await user.keyboard('{Enter}');
    expect(value()).toBe(40);
    // Moving it in between forgets the restore point.
    await user.keyboard('{Home}{Enter}');
    expect(value()).toBe(15);
  });

  it('mirrors the arrow keys right to left', async () => {
    const user = userEvent.setup();
    render(WorkspaceHarness, { withInspector: true, resizable: true, dir: 'rtl' });
    divider().focus();
    await user.keyboard('{ArrowLeft}');
    expect(value()).toBe(28);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(value()).toBe(32);
  });

  it('follows a pointer drag, measured against the two panes', async () => {
    layOut();
    render(WorkspaceHarness, {
      withInspector: true,
      resizable: true,
      storageKey: 'split',
    });
    const separator = divider();
    const workspace = screen.getByTestId('workspace');
    await fireEvent.pointerMove(separator, { pointerId: 1, clientX: 400 });
    expect(value()).toBe(30); // not grabbed yet
    await fireEvent.pointerDown(separator, { pointerId: 1, button: 0, clientX: 700.5 });
    expect(workspace).toHaveClass('ldt-workspace--resizing');
    expect(separator).toHaveFocus();
    // 1000 shared pixels; with the line at 500, the inspector has half.
    await fireEvent.pointerMove(separator, { pointerId: 1, clientX: 500.5 });
    expect(value()).toBe(50);
    expect(localStorage.getItem('split')).toBeNull(); // written when the drag ends
    await fireEvent.pointerMove(separator, { pointerId: 1, clientX: 50 });
    expect(value()).toBe(70);
    await fireEvent.pointerUp(separator, { pointerId: 1 });
    expect(workspace).not.toHaveClass('ldt-workspace--resizing');
    expect(localStorage.getItem('split')).toBe('70');
    await fireEvent.pointerUp(separator, { pointerId: 1 });
    expect(localStorage.getItem('split')).toBe('70');
  });

  it('keeps the grab offset, ignores other buttons, and drags right to left', async () => {
    layOut(true);
    render(WorkspaceHarness, { withInspector: true, resizable: true, dir: 'rtl' });
    const separator = divider();
    await fireEvent.pointerDown(separator, { pointerId: 2, button: 2, clientX: 300 });
    expect(screen.getByTestId('workspace')).not.toHaveClass('ldt-workspace--resizing');
    // Grabbed 3px right of the line's centre: the line follows the pointer less those 3px.
    await fireEvent.pointerDown(separator, { pointerId: 2, button: 0, clientX: 303.5 });
    await fireEvent.pointerMove(separator, { pointerId: 2, clientX: 403.5 });
    expect(value()).toBe(40);
    await fireEvent.pointerCancel(separator, { pointerId: 2 });
    expect(screen.getByTestId('workspace')).not.toHaveClass('ldt-workspace--resizing');
  });

  it('ignores a drag while the panes have no width', async () => {
    render(WorkspaceHarness, { withInspector: true, resizable: true });
    const separator = divider();
    await fireEvent.pointerDown(separator, { pointerId: 1, button: 0, clientX: 0 });
    await fireEvent.pointerMove(separator, { pointerId: 1, clientX: 10 });
    expect(value()).toBe(30);
  });

  it('restores and persists the size under a storage key', async () => {
    const user = userEvent.setup();
    localStorage.setItem('split', '55.5');
    render(WorkspaceHarness, { withInspector: true, resizable: true, storageKey: 'split' });
    expect(value()).toBe(56);
    expect(screen.getByTestId('workspace').style.getPropertyValue('--ldt-inspector-share')).toBe(
      '55.5fr'
    );
    expect(screen.getByTestId('size')).toHaveTextContent('55.5');
    divider().focus();
    await user.keyboard('{ArrowRight}');
    expect(localStorage.getItem('split')).toBe('53.5');
  });

  it('clamps a stored size and ignores a stored value that is not a number', () => {
    localStorage.setItem('wide', '99');
    localStorage.setItem('junk', 'wide');
    const first = render(WorkspaceHarness, {
      withInspector: true,
      resizable: true,
      storageKey: 'wide',
    });
    expect(value()).toBe(70);
    first.unmount();
    render(WorkspaceHarness, { withInspector: true, resizable: true, storageKey: 'junk' });
    expect(value()).toBe(30);
  });

  it('keeps working in memory when storage throws', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(WorkspaceHarness, { withInspector: true, resizable: true, storageKey: 'split' });
    expect(value()).toBe(30);
    divider().focus();
    await user.keyboard('{ArrowLeft}');
    expect(value()).toBe(32);
    expect(setItem).toHaveBeenCalled();
  });

  it('does not write storage without a key', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(WorkspaceHarness, { withInspector: true, resizable: true });
    divider().focus();
    await user.keyboard('{ArrowLeft}');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('renders the restore script inert on the client', () => {
    render(WorkspaceHarness, { withInspector: true, resizable: true, storageKey: 'split' });
    const script = screen.getByTestId('workspace').querySelector('script');
    expect(script?.textContent).toContain('localStorage.getItem("split")');
  });

  it('stacks below the compact breakpoint with the divider out of the layout', () => {
    // Both narrow rules, the viewport one and the container one, hide the divider.
    const css = readFileSync(
      path.join(process.cwd(), '..', 'styles', 'src', 'components', 'layout.css'),
      'utf8'
    );
    const narrow = [
      ...css.matchAll(/@(?:media|container)[^{]*max-width: 760px\)\s*\{([\s\S]*?)\n\}/g),
    ];
    expect(narrow).toHaveLength(2);
    for (const [, body] of narrow) {
      expect(body).toMatch(/\.ldt-workspace__divider \{\s*display: none;/);
      expect(body).toMatch(/\.ldt-workspace__inspector \{\s*display: block;/);
    }
  });
});
