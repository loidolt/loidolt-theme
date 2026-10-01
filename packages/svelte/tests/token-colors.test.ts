import { afterEach, describe, expect, it, vi } from 'vitest';
import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import {
  colorSchemeOf,
  createTokenColors,
  normalizeColor,
  observeColorScheme,
  readRoleColor,
} from '../src/lib/token-colors.svelte.js';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('normalizeColor', () => {
  it('turns every computed form into hex', () => {
    expect(normalizeColor('rgb(198, 82, 36)')).toBe('#c65224');
    expect(normalizeColor('rgb(198 82 36)')).toBe('#c65224');
    expect(normalizeColor('rgba(0, 0, 0, 0.5)')).toBe('#00000080');
    expect(normalizeColor('rgb(100% 0% 0% / 50%)')).toBe('#ff000080');
    expect(normalizeColor('color(srgb 1 0.5 0)')).toBe('#ff8000');
    expect(normalizeColor('#ABCDEF')).toBe('#abcdef');
  });

  it('refuses what it cannot read', () => {
    expect(normalizeColor('')).toBeNull();
    expect(normalizeColor('var(--loidolt-text)')).toBeNull();
    expect(normalizeColor('rgb(a, b, c)')).toBeNull();
    expect(normalizeColor('rgb(1, 2)')).toBeNull();
  });
});

describe('reading the page', () => {
  it('reads a role through a probe that inherits scoped themes, and cleans up', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const style = real(element);
      if ((element as HTMLElement).style?.color === 'var(--loidolt-chart-1)') {
        return { ...style, color: 'rgb(1, 2, 3)' } as CSSStyleDeclaration;
      }
      return style;
    });
    expect(readRoleColor(host, 'chart1')).toBe('#010203');
    expect(host.children).toHaveLength(0);
  });

  it('prefers an explicit data-theme, then the computed colour-scheme', () => {
    const scoped = document.createElement('section');
    scoped.dataset.theme = 'dark';
    const inner = document.createElement('div');
    scoped.append(inner);
    document.body.append(scoped);
    expect(colorSchemeOf(inner)).toBe('dark');
    expect(colorSchemeOf(null)).toBe('light');

    const plain = document.createElement('div');
    document.body.append(plain);
    const real = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (element) => ({ ...real(element), colorScheme: 'dark' }) as CSSStyleDeclaration
    );
    expect(colorSchemeOf(plain)).toBe('dark');
  });
});

describe('createTokenColors', () => {
  it('falls back to the reference theme where the page cannot be read', () => {
    const palette = createTokenColors({ ink: 'text', series: ['chart1', 'chart2'] });
    expect(palette.scheme).toBe('light');
    expect(palette.colors).toEqual({
      ink: semantic.text,
      series: [semantic.chart1, semantic.chart2],
    });
    palette.destroy();
  });

  it('follows a theme switch and bumps its version once per change', async () => {
    const palette = createTokenColors({ ink: 'text' });
    expect(palette.version).toBe(0);
    document.documentElement.dataset.theme = 'dark';
    await settle();
    expect(palette.scheme).toBe('dark');
    expect(palette.colors.ink).toBe(darkSemantic.text);
    expect(palette.version).toBe(1);

    palette.refresh();
    expect(palette.version).toBe(1);
    palette.destroy();

    document.documentElement.dataset.theme = 'light';
    await settle();
    expect(palette.version).toBe(1);
  });

  it('reads from the element it is given', () => {
    const scoped = document.createElement('div');
    scoped.dataset.theme = 'dark';
    document.body.append(scoped);
    let element: Element | null = null;
    const palette = createTokenColors({ ink: 'text' }, { element: () => element });
    expect(palette.scheme).toBe('light');
    element = scoped;
    palette.refresh();
    expect(palette.colors.ink).toBe(darkSemantic.text);
    palette.destroy();
  });

  it('shares one set of observers and batches bursts of changes', async () => {
    const calls: string[] = [];
    const stopA = observeColorScheme(() => calls.push('a'));
    const stopB = observeColorScheme(() => calls.push('b'));
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.className = 'x';
    await settle();
    expect(calls).toEqual(['a', 'b']);
    stopA();
    stopB();
    document.documentElement.className = '';
    await settle();
    expect(calls).toHaveLength(2);
  });
});
