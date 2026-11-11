import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Pagination from '../src/lib/components/Pagination.svelte';

/*
 * The phone fixes are geometry jsdom cannot measure, so like the layout-robustness checks these
 * pin the rules that produce it; the measurements behind each are in the PR. Comments are
 * stripped before matching, so a rule mentioned only in prose does not pass.
 */
const read = (file: string) =>
  readFileSync(path.join(process.cwd(), '..', 'styles', 'src', file), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    ''
  );
const components = (file: string) => read(path.join('components', file));

/** The body of the `@media (pointer: coarse)` block in accessibility.css. */
const coarse = () => {
  const css = read('accessibility.css');
  const start = css.indexOf('@media (pointer: coarse)');
  let depth = 0;
  for (let index = css.indexOf('{', start); index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    if (depth === 0) return css.slice(start, index);
  }
  return '';
};

/** Every block whose selector list includes `selector` exactly. */
const blocks = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(',').some((one) => one.trim() === selector))
    .map(([, , body]) => body)
    .join('\n');

describe('Pagination row', () => {
  it('wraps page numbers in a box of their own, between Previous and Next', () => {
    const { container } = render(Pagination, { count: 100, perPage: 10, page: 5 });
    const list = container.querySelector('.ldt-pagination__list');
    const pages = list?.querySelector(':scope > .ldt-pagination__pages');
    expect(pages).not.toBeNull();
    expect(pages?.contains(screen.getByRole('button', { name: 'Page 5' }))).toBe(true);
    expect(list?.firstElementChild).toBe(screen.getByRole('button', { name: 'Previous' }));
    expect(list?.lastElementChild).toBe(screen.getByRole('button', { name: 'Next' }));
  });

  it('keeps Previous and Next on the row and balances the wrapped numbers', () => {
    const css = components('selection.css');
    expect(blocks(css, '.ldt-pagination__list:has(> .ldt-pagination__pages)')).toMatch(
      /flex-wrap:\s*nowrap/
    );
    expect(blocks(css, '.ldt-pagination__pages')).toMatch(/text-wrap:\s*balance/);
  });
});

describe('touch targets', () => {
  it('hangs a 44px square on small controls that keep their drawn size', () => {
    const css = coarse();
    for (const selector of [
      '.ldt-brand::after',
      '.ldt-combobox__trigger::after',
      '.ldt-password-input__toggle::after',
      '.ldt-chip__remove::after',
    ]) {
      expect(blocks(css, selector), selector).toMatch(/height:\s*44px/);
    }
  });

  it('gives the row checkbox, the page-size select and the speed select 44px of width', () => {
    const css = coarse();
    expect(css).toMatch(
      /:where\(\.ldt-data-table__select \.ldt-choice\)\s*\{[^}]*min-width:\s*44px/
    );
    const widened = /:where\(([^)]*)\)\s*\{\s*min-width:\s*44px/g;
    const lists = [...css.matchAll(widened)].map(([, list]) => list).join(',');
    expect(lists).toContain('.ldt-select');
    expect(lists).toContain('.ldt-media-controls__speed');
  });

  it('pads disclosure summaries to 44px', () => {
    expect(coarse()).toMatch(
      /summary\.ldt-map-legend__summary\)\s*\{\s*padding-block:\s*max\(var\(--loidolt-space-3\), calc\(\(44px - 1lh\) \/ 2\)\)/
    );
  });

  it('keeps the sort press inside its header cell', () => {
    const css = coarse();
    expect(css).toMatch(
      /:where\(\.ldt-table th:has\(> \.ldt-table__sort\)\)\s*\{\s*height:\s*44px/
    );
    const press = blocks(css, '.ldt-table__sort::after');
    expect(press).toMatch(/inset:\s*0/);
    expect(press).not.toMatch(/translate/);
  });
});

describe('scroll cues', () => {
  it('shadows the edges of a scrolling diagram and filmstrip', () => {
    for (const [file, selector] of [
      ['docs.css', '.ldt-mermaid'],
      ['selection.css', '.ldt-filmstrip--horizontal'],
    ]) {
      const body = blocks(components(file), selector);
      expect(body, selector).toMatch(/no-repeat\s+local/);
      expect(body, selector).toMatch(/no-repeat\s+scroll/);
    }
  });
});

describe('largest text sizes', () => {
  it('caps the page title at 2x and the brand at 1.5x, through iOS text zoom too', () => {
    const css = components('layout.css');
    const title = blocks(css, '.ldt-page-header__title');
    expect(title).toMatch(
      /var\(--ldt-text-zoom, 1\)\),\s*calc\(var\(--loidolt-font-size-xl\) \* 2\)/
    );
    expect(title).toMatch(
      /-webkit-text-size-adjust:\s*calc\(var\(--ldt-text-zoom\) \* 0% \+ 100%\)/
    );
    expect(blocks(css, '.ldt-brand__name')).toMatch(
      /calc\(var\(--loidolt-font-size-lg\) \* 1\.5\)/
    );
    expect(blocks(css, '.ldt-brand')).toMatch(/-webkit-text-size-adjust/);
  });
});

describe('disabled fields', () => {
  it('sets the fill colour and full opacity WebKit needs for the muted text', () => {
    const body = blocks(components('forms.css'), '.ldt-input:disabled');
    expect(body).toMatch(/-webkit-text-fill-color:\s*var\(--loidolt-text-muted\)/);
    expect(body).toMatch(/opacity:\s*1/);
    expect(body).toMatch(/background-color:\s*transparent/);
  });
});
