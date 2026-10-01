import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

import { routes as catalogRoutes } from './routes';

/*
 * A computed-style fingerprint of every catalog route: for each element the package styles, the
 * resolved value of every property a theme or preset can move. Refactors of the stylesheets (moving
 * literals onto tokens) must leave these snapshots untouched; an intended visual change updates
 * them with `--update-snapshots` and the diff is reviewed like any other.
 *
 * Box sizes are deliberately left out: they depend on fonts and viewport, not on the stylesheet.
 */

const properties = [
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'row-gap',
  'column-gap',
  'min-height',
  'min-width',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'outline-width',
  'outline-style',
  'outline-color',
  'outline-offset',
  'box-shadow',
  'color',
  'background-color',
  'background-image',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-transform',
  'color-scheme',
];

const selector = '[class*="ldt-"], html, body, h1, h2, h3, h4, label, legend, th, td';

/** Unique `element-key { styles }` lines for the current page, sorted so order is stable. */
const fingerprint = (page: Page) =>
  page.evaluate(
    ({ properties, selector }) => {
      const keyOf = (element: Element) => {
        const classes = [...element.classList]
          // Svelte's scoping hashes change whenever the catalog source does.
          .filter((name) => !name.startsWith('svelte-'))
          .sort()
          .map((name) => `.${name}`)
          .join('');
        const state = ['data-state', 'aria-selected', 'aria-current', 'aria-pressed', 'disabled']
          .filter((name) => element.hasAttribute(name))
          .map((name) => `[${name}=${element.getAttribute(name)}]`)
          .join('');
        return `${element.tagName.toLowerCase()}${classes}${state}`;
      };

      // Values a plain element computes to anyway; printing them would only bloat the baseline.
      const initial: Record<string, string[]> = {
        padding: ['0px'],
        margin: ['0px'],
        gap: ['normal'],
        'min-height': ['auto', '0px'],
        'min-width': ['auto', '0px'],
        'border-radius': ['0px'],
        'box-shadow': ['none'],
        'background-color': ['rgba(0, 0, 0, 0)'],
        'background-image': ['none'],
        'font-style': ['normal'],
        'letter-spacing': ['normal'],
        'text-transform': ['none'],
      };
      const sides = ['top', 'right', 'bottom', 'left'];
      const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

      const describe = (style: CSSStyleDeclaration) => {
        const get = (name: string) => style.getPropertyValue(name);
        const out: string[] = [];
        const emit = (name: string, value: string) => {
          if (!initial[name]?.includes(value)) out.push(`${name}:${value}`);
        };
        // Four longhands collapse to one value when they agree.
        const box = (name: string, parts: string[]) => {
          const values = parts.map(get);
          emit(name, new Set(values).size === 1 ? values[0] : values.join(' '));
        };

        box(
          'padding',
          sides.map((side) => `padding-${side}`)
        );
        box(
          'margin',
          sides.map((side) => `margin-${side}`)
        );
        box(
          'border-radius',
          corners.map((corner) => `border-${corner}-radius`)
        );
        // A side with no border style draws nothing, whatever its width and colour say.
        const edge = (side: string) =>
          ['width', 'style', 'color'].map((part) => get(`border-${side}-${part}`)).join(' ');
        const drawn = sides.filter((side) => get(`border-${side}-style`) !== 'none');
        if (drawn.length === 4 && new Set(sides.map(edge)).size === 1) {
          out.push(`border:${edge('top')}`);
        } else if (drawn.length) {
          out.push(`border:${drawn.map((side) => `${side} ${edge(side)}`).join(', ')}`);
        }
        const [rowGap, columnGap] = [get('row-gap'), get('column-gap')];
        if (rowGap === columnGap) emit('gap', rowGap);
        else out.push(`gap:${rowGap} ${columnGap}`);
        if (get('outline-style') !== 'none') {
          out.push(
            `outline:${['width', 'style', 'color'].map((part) => get(`outline-${part}`)).join(' ')} offset ${get('outline-offset')}`
          );
        }
        for (const name of properties) {
          if (/^(padding|margin|border|outline|row-gap|column-gap)/.test(name)) continue;
          emit(name, get(name));
        }
        return out.join('; ');
      };

      const lines = new Set<string>();
      for (const element of document.querySelectorAll(selector)) {
        const key = keyOf(element);
        lines.add(`${key} { ${describe(getComputedStyle(element))} }`);
        for (const pseudo of ['::before', '::after']) {
          const style = getComputedStyle(element, pseudo);
          if (style.content !== 'none' && style.content !== 'normal') {
            lines.add(`${key}${pseudo} { ${describe(style)} }`);
          }
        }
        if (element instanceof HTMLInputElement && element.type === 'file') {
          lines.add(
            `${key}::file-selector-button { ${describe(getComputedStyle(element, '::file-selector-button'))} }`
          );
        }
      }
      return [...lines].sort().join('\n');
    },
    { properties, selector }
  );

/** Styles of whatever holds focus after each of the first few Tab presses. */
const focusFingerprint = async (page: Page, stops = 4) => {
  const lines: string[] = [];
  for (let stop = 1; stop <= stops; stop += 1) {
    await page.keyboard.press('Tab');
    lines.push(
      await page.evaluate(
        ({ properties, stop }) => {
          const element = document.activeElement;
          if (!element || element === document.body) return `focus ${stop}: none`;
          const style = getComputedStyle(element);
          const values = properties.map((name) => `${name}:${style.getPropertyValue(name)}`);
          return `focus ${stop}: ${element.tagName.toLowerCase()} { ${values.join('; ')} }`;
        },
        {
          properties: ['outline-width', 'outline-style', 'outline-color', 'outline-offset'],
          stop,
        }
      )
    );
  }
  return lines.join('\n');
};

const snapshotName = (route: string, preset?: string) =>
  `${route === '/' ? 'index' : route.slice(1).replaceAll('/', '-')}${preset ? `.${preset}` : ''}.txt`;

/** Both schemes, plus the focus ring, for one route under one preset. */
async function capture(page: Page, route: string, preset?: string) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  // Nothing may be caught mid-transition when the scheme flips below.
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  if (preset) {
    await page.evaluate((value) => {
      document.documentElement.dataset.preset = value;
    }, preset);
  }

  const sections: string[] = [];
  for (const scheme of ['light', 'dark'] as const) {
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, scheme);
    sections.push(`## ${scheme}\n${await fingerprint(page)}`);
  }
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
  });
  sections.push(`## focus\n${await focusFingerprint(page)}`);
  return `${sections.join('\n\n')}\n`;
}

test.describe('computed-style fingerprint', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const route of catalogRoutes) {
    test(`${route} keeps its computed styles`, async ({ page }) => {
      expect(await capture(page, route)).toMatchSnapshot(snapshotName(route));
    });

    // The other built-in presets get their own baselines, so a change to the role tier or a
    // preset definition shows up as a reviewable diff too. One viewport is enough for these.
    for (const preset of ['soft', 'compact']) {
      test(`${route} keeps its computed styles under ${preset}`, async ({ page, isMobile }) => {
        test.skip(isMobile, 'Preset baselines are recorded on desktop only.');
        expect(await capture(page, route, preset)).toMatchSnapshot(snapshotName(route, preset));
      });
    }
  }
});
