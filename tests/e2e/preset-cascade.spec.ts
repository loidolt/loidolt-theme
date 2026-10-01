import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/*
 * The preset selectors are designed so that specificity, not import order, decides between the
 * base tokens, the base dark theme and each preset. This drives the generated stylesheets
 * through every order an app could plausibly write and checks what a component would read.
 */

const dist = new URL('../../packages/tokens/dist/', import.meta.url);
const css = (path: string) => readFileSync(new URL(path, dist), 'utf8');

const sheets = {
  tokens: `@layer loidolt.tokens { ${css('tokens.css')} }`,
  dark: css('dark.css'),
  darkAuto: css('dark-auto.css'),
  soft: css('presets/soft.css'),
  softDark: css('presets/soft-dark.css'),
  softDarkAuto: css('presets/soft-dark-auto.css'),
  compact: css('presets/compact.css'),
  compactDark: css('presets/compact-dark.css'),
  softRoot: css('presets/soft.root.css'),
  softRootDarkAuto: css('presets/soft.root-dark-auto.css'),
};

const accent = {
  base: '#c65224',
  baseDark: '#e0672f',
  soft: '#2563eb',
  softDark: '#6aa1ff',
};

type Sheet = keyof typeof sheets;

/** Every ordering of the given sheets, so no assertion can lean on a lucky import order. */
const permutations = <T>(items: T[]): T[][] =>
  items.length <= 1
    ? [items]
    : items.flatMap((item, index) =>
        permutations([...items.slice(0, index), ...items.slice(index + 1)]).map((rest) => [
          item,
          ...rest,
        ])
      );

async function mount(page: Page, order: Sheet[], html: string, rootAttributes = '') {
  await page.setContent(
    `<!doctype html><html ${rootAttributes}><head>${order
      .map((sheet) => `<style>${sheets[sheet]}</style>`)
      .join('')}</head><body>${html}</body></html>`
  );
}

const read = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name).trim(), property);

test.describe('preset cascade', () => {
  test.skip(
    ({ isMobile }) => isMobile,
    'Cascade order is engine behaviour; one viewport is enough.'
  );

  for (const order of permutations<Sheet>(['dark', 'soft', 'softDark'])) {
    test(`a root preset wins in both schemes, imported as ${order.join(' → ')}`, async ({
      page,
    }) => {
      await mount(page, ['tokens', ...order], '', `data-preset="soft" data-theme="light"`);
      expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.soft);
      expect(await read(page, 'html', '--loidolt-radius-control')).toBe('6px');

      await page.locator('html').evaluate((html) => html.setAttribute('data-theme', 'dark'));
      expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.softDark);
      expect(await read(page, 'html', '--loidolt-radius-control')).toBe('6px');
      expect(await read(page, 'html', 'color-scheme')).toBe('dark');
    });
  }

  for (const order of permutations<Sheet>(['darkAuto', 'soft', 'softDarkAuto'])) {
    test(`a preset follows a dark system unless light is chosen, imported as ${order.join(' → ')}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await mount(page, ['tokens', ...order], '', `data-preset="soft"`);
      expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.softDark);

      await page.locator('html').evaluate((html) => html.setAttribute('data-theme', 'light'));
      expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.soft);
    });
  }

  test('a subtree preset restyles only its subtree, in either scheme', async ({ page }) => {
    await mount(
      page,
      ['tokens', 'dark', 'soft', 'softDark'],
      `<p id="outside"></p><section data-preset="soft"><p id="inside"></p></section>`,
      `data-theme="light"`
    );
    expect(await read(page, '#outside', '--loidolt-accent')).toBe(accent.base);
    expect(await read(page, '#inside', '--loidolt-accent')).toBe(accent.soft);
    expect(await read(page, '#inside', '--loidolt-label-transform')).toBe('none');

    await page.locator('html').evaluate((html) => html.setAttribute('data-theme', 'dark'));
    expect(await read(page, '#outside', '--loidolt-accent')).toBe(accent.baseDark);
    expect(await read(page, '#inside', '--loidolt-accent')).toBe(accent.softDark);
  });

  test('a nested preset replaces the outer one rather than blending with it', async ({ page }) => {
    await mount(
      page,
      ['tokens', 'dark', 'soft', 'softDark', 'compact', 'compactDark'],
      `<section data-preset="compact"><p id="inside"></p></section>`,
      `data-preset="soft" data-theme="dark"`
    );
    expect(await read(page, '#inside', '--loidolt-accent')).toBe(accent.baseDark);
    expect(await read(page, '#inside', '--loidolt-radius-control')).toBe('0px');
    expect(await read(page, '#inside', '--loidolt-pad-control-x')).toBe('0.6375rem');
  });

  test('a preset whose dark sheet was not imported falls back to the base dark colours', async ({
    page,
  }) => {
    await mount(page, ['tokens', 'soft', 'dark'], '', `data-preset="soft" data-theme="dark"`);
    expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.baseDark);
    expect(await read(page, 'html', '--loidolt-radius-control')).toBe('6px');
  });

  test('an unknown preset leaves the base system in place', async ({ page }) => {
    await mount(
      page,
      ['tokens', 'dark', 'soft'],
      '',
      `data-preset="nonexistent" data-theme="light"`
    );
    expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.base);
    expect(await read(page, 'html', '--loidolt-radius-control')).toBe('0px');
  });

  for (const order of permutations<Sheet>(['darkAuto', 'softRoot', 'softRootDarkAuto'])) {
    test(`a :root preset needs no attribute, imported as ${order.join(' → ')}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await mount(page, ['tokens', ...order], '');
      expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.softDark);
      expect(await read(page, 'html', '--loidolt-radius-surface')).toBe('8px');

      await page.locator('html').evaluate((html) => html.setAttribute('data-theme', 'light'));
      expect(await read(page, 'html', '--loidolt-accent')).toBe(accent.soft);
    });
  }
});
