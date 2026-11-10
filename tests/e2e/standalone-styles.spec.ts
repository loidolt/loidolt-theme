import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * The CSS-only use case: one HTML file with `@loidolt/theme-styles/standalone.css` pasted into its
 * <style>, no Svelte, no bundler, no other files. The page is the example the catalog documents.
 */
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const placeholder = '/* Paste the contents of @loidolt/theme-styles/standalone.css here. */';
const example = read('../../examples/catalog/src/lib/examples/standalone-report.html');
const standalone = read('../../packages/styles/dist/standalone.css');
const fontsEmbedded = read('../../packages/styles/dist/fonts-embedded.css');
const preset = (file: string) => read(`../../packages/tokens/dist/presets/${file}`);
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function load(page: Page, css: string) {
  expect(example).toContain(placeholder);
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.setContent(
    example.replace(placeholder, () => css),
    { waitUntil: 'load' }
  );
  await page.evaluate(() => document.fonts.ready);
  return requests;
}

const styleOf = (page: Page, selector: string, properties: string[]) =>
  page
    .locator(selector)
    .evaluate(
      (element, properties) =>
        Object.fromEntries(
          properties.map((property) => [
            property,
            getComputedStyle(element).getPropertyValue(property),
          ])
        ),
      properties
    );

const palettes = {
  light: {
    background: 'rgb(235, 231, 220)',
    surface: 'rgb(245, 242, 233)',
    text: 'rgb(32, 35, 29)',
    success: 'rgb(63, 81, 57)',
    onSuccess: 'rgb(255, 255, 255)',
  },
  dark: {
    background: 'rgb(22, 24, 20)',
    surface: 'rgb(30, 33, 28)',
    text: 'rgb(235, 231, 220)',
    success: 'rgb(127, 160, 116)',
    onSuccess: 'rgb(22, 24, 20)',
  },
};

async function expectPalette(page: Page, scheme: keyof typeof palettes) {
  const palette = palettes[scheme];
  expect(await styleOf(page, 'body', ['background-color', 'color'])).toEqual({
    'background-color': palette.background,
    color: palette.text,
  });
  expect(await styleOf(page, 'html', ['color-scheme'])).toEqual({ 'color-scheme': scheme });
  const stat = await styleOf(page, '.ldt-stat:first-child', [
    'background-color',
    'border-top-style',
  ]);
  expect(stat).toEqual({ 'background-color': palette.surface, 'border-top-style': 'solid' });
  expect(
    await styleOf(page, '.ldt-badge--success', ['background-color', 'color', 'display'])
  ).toEqual({
    'background-color': palette.success,
    color: palette.onSuccess,
    display: 'inline-flex',
  });
}

test.describe('theme-styles without Svelte', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`a plain HTML page with the standalone CSS follows prefers-color-scheme: ${scheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const requests = await load(page, standalone);
      // Nothing to fetch: no @import, no font file, no other stylesheet.
      expect(requests.filter((url) => !url.startsWith('data:'))).toEqual([]);
      await expectPalette(page, scheme);

      // Component layout, not only colour: the table, the visually hidden caption, the button.
      expect(await styleOf(page, '.ldt-table', ['border-collapse'])).toEqual({
        'border-collapse': 'collapse',
      });
      expect(await styleOf(page, 'caption.ldt-sr-only', ['position', 'width'])).toEqual({
        position: 'absolute',
        width: '1px',
      });
      const button = await page.locator('.ldt-button').boundingBox();
      expect(button?.height).toBeGreaterThanOrEqual(24);
      // Without the font files the stacks fall back to installed and generic faces.
      expect(await styleOf(page, 'html', ['font-family'])).toEqual({
        'font-family': expect.stringMatching(/^"?Jost"?, .*sans-serif$/),
      });

      const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('data-theme overrides the system preference both ways', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await load(page, standalone);
    await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
    await expectPalette(page, 'dark');
    expect((await new AxeBuilder({ page }).withTags(wcagTags).analyze()).violations).toEqual([]);

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
    await expectPalette(page, 'light');
  });

  test('a preset appended after it applies under data-preset, in both schemes', async ({
    page,
  }) => {
    const css = [standalone, preset('soft.css'), preset('soft-dark-auto.css')].join('\n');
    for (const [scheme, background] of [
      ['light', 'rgb(244, 246, 248)'],
      ['dark', 'rgb(17, 21, 27)'],
    ] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await load(page, css);
      await page.evaluate(() => (document.documentElement.dataset.preset = 'soft'));
      expect(await styleOf(page, 'body', ['background-color'])).toEqual({
        'background-color': background,
      });
      expect(await styleOf(page, 'html', ['color-scheme'])).toEqual({ 'color-scheme': scheme });
      expect((await new AxeBuilder({ page }).withTags(wcagTags).analyze()).violations).toEqual([]);
    }
  });

  test('the embedded fonts load from data URIs alone', async ({ page }) => {
    const requests = await load(page, `${fontsEmbedded}\n${standalone}`);
    expect(requests.filter((url) => !url.startsWith('data:'))).toEqual([]);
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family)
    );
    expect(loaded.map((family) => family.replace(/"/g, '')).sort()).toEqual(['Archivo', 'Jost']);
  });
});
