import { createToaster } from '@loidolt/theme-svelte';
import { describe, expect, it, vi } from 'vitest';
import { createHaptics, withHaptics } from '../src/lib/index.js';
import { fakeHaptics, flush, platform } from './fakes.js';

function native(enabled?: () => boolean) {
  platform.current = 'ios';
  const Haptics = fakeHaptics();
  return { Haptics, haptics: createHaptics({ Haptics, enabled }) };
}

const click = (element: Element) =>
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

describe('createHaptics', () => {
  it('is silent in a browser', () => {
    const Haptics = fakeHaptics();
    const haptics = createHaptics({ Haptics });
    haptics.impact();
    haptics.selection();
    haptics.notify('error');
    expect(Haptics.impact).not.toHaveBeenCalled();
    expect(Haptics.selectionStart).not.toHaveBeenCalled();
    expect(Haptics.notification).not.toHaveBeenCalled();
  });

  it('maps impact weights', () => {
    const { Haptics, haptics } = native();
    haptics.impact();
    haptics.impact('heavy');
    expect(Haptics.impact.mock.calls).toEqual([[{ style: 'LIGHT' }], [{ style: 'HEAVY' }]]);
  });

  it('plays a selection tick as the whole sequence', async () => {
    const { Haptics, haptics } = native();
    haptics.selection();
    await flush();
    expect(Haptics.selectionStart).toHaveBeenCalledOnce();
    expect(Haptics.selectionChanged).toHaveBeenCalledOnce();
    expect(Haptics.selectionEnd).toHaveBeenCalledOnce();
  });

  it('maps statuses to notification patterns, and gives info none', () => {
    const { Haptics, haptics } = native();
    haptics.notify('success');
    haptics.notify('warning');
    haptics.notify('error');
    haptics.notify('info');
    haptics.notify(undefined);
    expect(Haptics.notification.mock.calls).toEqual([
      [{ type: 'SUCCESS' }],
      [{ type: 'WARNING' }],
      [{ type: 'ERROR' }],
    ]);
  });

  it('asks `enabled` before every buzz', () => {
    let on = false;
    const { Haptics, haptics } = native(() => on);
    haptics.impact();
    on = true;
    haptics.impact();
    expect(Haptics.impact).toHaveBeenCalledOnce();
  });
});

describe('install', () => {
  it('ticks when a selection control is activated', async () => {
    const { Haptics, haptics } = native();
    const stop = haptics.install();
    document.body.innerHTML = `<button role="switch" aria-checked="false"><span>Snap</span></button>`;
    click(document.querySelector('span')!);
    await flush();
    expect(Haptics.selectionChanged).toHaveBeenCalledOnce();
    stop();
  });

  it('gives opted-in elements an impact of the weight they ask for', () => {
    const { Haptics, haptics } = native();
    const stop = haptics.install();
    document.body.innerHTML = `
      <button data-haptic="medium">Cut</button>
      <button data-haptic>Save</button>
      <button data-haptic="thud">Odd</button>`;
    for (const button of document.querySelectorAll('button')) click(button);
    expect(Haptics.impact.mock.calls).toEqual([
      [{ style: 'MEDIUM' }],
      [{ style: 'LIGHT' }],
      [{ style: 'LIGHT' }],
    ]);
    stop();
  });

  it('leaves plain buttons, disabled controls and non-element targets alone', async () => {
    const { Haptics, haptics } = native();
    const stop = haptics.install();
    document.body.innerHTML = `
      <button>Plain</button>
      <button role="switch" disabled>Off</button>
      <button role="tab" aria-disabled="true">Gone</button>`;
    for (const button of document.querySelectorAll('button')) click(button);
    document.dispatchEvent(new MouseEvent('click'));
    await flush();
    expect(Haptics.selectionStart).not.toHaveBeenCalled();
    expect(Haptics.impact).not.toHaveBeenCalled();
    stop();
  });

  it('takes its own selector and stops when torn down', () => {
    const { Haptics, haptics } = native();
    const stop = haptics.install({ selection: '.chip' });
    document.body.innerHTML = `<span class="chip">A</span><button role="switch">B</button>`;
    click(document.querySelector('.chip')!);
    click(document.querySelector('button')!);
    expect(Haptics.selectionStart).toHaveBeenCalledOnce();
    stop();
    click(document.querySelector('.chip')!);
    expect(Haptics.selectionStart).toHaveBeenCalledOnce();
  });
});

describe('withHaptics', () => {
  it('buzzes on status toasts and passes everything else through', () => {
    const notify = vi.fn();
    const base = createToaster({ max: 10 });
    const toaster = withHaptics(base, { notify });
    const id = toaster.success('Saved');
    toaster.error('Upload failed');
    toaster.warning('Low disk');
    toaster.info('Synced');
    toaster.push({ title: 'Raw', variant: 'warning' });
    toaster.push({ title: 'Plain' });
    expect(notify.mock.calls.map(([variant]) => variant)).toEqual([
      'success',
      'error',
      'warning',
      'info',
      'warning',
      undefined,
    ]);
    expect(toaster.toasts).toBe(base.toasts);
    expect(toaster.toasts).toHaveLength(6);
    expect(toaster.update(id, { title: 'Saved!' })).toBe(true);
    toaster.pause();
    toaster.resume();
    toaster.dismiss(id);
    expect(toaster.toasts).toHaveLength(5);
    toaster.clear();
    expect(toaster.toasts).toHaveLength(0);
    toaster.destroy();
  });
});
