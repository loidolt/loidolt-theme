import { describe, expect, it } from 'vitest';
import { createNativeKeyboard } from '../src/lib/index.js';
import { fakeKeyboard, flush, platform } from './fakes.js';

const root = document.documentElement;
const variable = (name: string) => root.style.getPropertyValue(name);

describe('createNativeKeyboard', () => {
  it('stays hidden and silent in a browser', () => {
    const Keyboard = fakeKeyboard();
    const keyboard = createNativeKeyboard({ Keyboard });
    expect(keyboard.visible).toBe(false);
    expect(Keyboard.addListener).not.toHaveBeenCalled();
    keyboard.destroy();
  });

  it('tells the stylesheet when the keyboard is up, and how tall it is', async () => {
    platform.current = 'ios';
    const Keyboard = fakeKeyboard('native');
    const keyboard = createNativeKeyboard({ Keyboard });
    await flush();
    Keyboard.emit('keyboardWillShow', { keyboardHeight: 336 });
    expect(keyboard.visible).toBe(true);
    expect(keyboard.height).toBe(336);
    expect(root).toHaveAttribute('data-keyboard', 'open');
    expect(variable('--ldt-keyboard-height')).toBe('336px');
    // The web view shrinks for it, so there is nothing left for the page to clear.
    expect(variable('--ldt-keyboard-inset')).toBe('0px');

    Keyboard.emit('keyboardWillHide');
    expect(keyboard.visible).toBe(false);
    expect(keyboard.height).toBe(0);
    expect(root).not.toHaveAttribute('data-keyboard');
    keyboard.destroy();
  });

  it('makes the page clear the keyboard when it overlays the page', async () => {
    platform.current = 'android';
    const Keyboard = fakeKeyboard('none');
    const keyboard = createNativeKeyboard({ Keyboard });
    await flush();
    Keyboard.emit('keyboardWillShow', { keyboardHeight: 280 });
    expect(variable('--ldt-keyboard-inset')).toBe('280px');
    keyboard.destroy();
  });

  it('corrects the inset when the resize mode arrives after the keyboard', async () => {
    platform.current = 'android';
    const Keyboard = fakeKeyboard('none');
    const keyboard = createNativeKeyboard({ Keyboard });
    Keyboard.emit('keyboardWillShow', { keyboardHeight: 280 });
    await flush();
    Keyboard.emit('keyboardWillShow', { keyboardHeight: 280 });
    expect(variable('--ldt-keyboard-inset')).toBe('280px');
    keyboard.destroy();
  });

  it('takes the overlay mode as given without asking', async () => {
    platform.current = 'ios';
    const Keyboard = fakeKeyboard('native');
    const keyboard = createNativeKeyboard({ Keyboard, overlays: true });
    await flush();
    expect(Keyboard.getResizeMode).not.toHaveBeenCalled();
    Keyboard.emit('keyboardWillShow', { keyboardHeight: 300 });
    expect(variable('--ldt-keyboard-inset')).toBe('300px');
    keyboard.destroy();
  });

  it('scrolls the focused field into view once the keyboard is up', async () => {
    platform.current = 'ios';
    const Keyboard = fakeKeyboard();
    const keyboard = createNativeKeyboard({ Keyboard });
    await flush();
    const field = document.createElement('input');
    document.body.append(field);
    field.focus();
    Keyboard.emit('keyboardDidShow');
    expect(field.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    keyboard.destroy();
  });

  it('leaves scrolling alone when told to', async () => {
    platform.current = 'ios';
    const Keyboard = fakeKeyboard();
    const keyboard = createNativeKeyboard({ Keyboard, revealFocused: false });
    await flush();
    const field = document.createElement('input');
    document.body.append(field);
    field.focus();
    (field.scrollIntoView as unknown as { mockClear(): void }).mockClear();
    Keyboard.emit('keyboardDidShow');
    expect(field.scrollIntoView).not.toHaveBeenCalled();
    keyboard.destroy();
  });

  it('cleans up after itself', async () => {
    platform.current = 'ios';
    const Keyboard = fakeKeyboard();
    const keyboard = createNativeKeyboard({ Keyboard });
    await flush();
    Keyboard.emit('keyboardWillShow', { keyboardHeight: 300 });
    keyboard.destroy();
    await flush();
    expect(root).not.toHaveAttribute('data-keyboard');
    expect(variable('--ldt-keyboard-height')).toBe('');
    expect(Keyboard.count('keyboardWillShow')).toBe(0);
  });
});
