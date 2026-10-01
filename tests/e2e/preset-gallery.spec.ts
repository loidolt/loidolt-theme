import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/*
 * The /presets gallery frames one bare sampler page per preset and scheme. Its promise is that
 * each frame shows exactly its own preset and scheme — before any script runs, and no matter
 * what the visitor has chosen for the site itself.
 */

const presets = ['loidolt', 'soft', 'compact'] as const;
const schemes = ['light', 'dark'] as const;
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('preset gallery', () => {
  test.skip(({ isMobile }) => isMobile, 'One viewport is enough for the gallery contract.');

  test('stamps each preview with its preset and scheme on the server', async ({ request }) => {
    for (const preset of presets) {
      for (const scheme of schemes) {
        const html = await (await request.get(`/preview/${preset}/${scheme}`)).text();
        expect(html).toContain(`<html lang="en" data-preset="${preset}" data-theme="${scheme}">`);
        // The stored choice is never consulted, so no theme script is inlined.
        expect(html).not.toContain('loidolt-preset');
      }
    }
  });

  test('keeps a preview on its own preset whatever the visitor has stored', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('loidolt-preset', 'compact');
      localStorage.setItem('loidolt-theme', 'light');
    });
    await page.goto('/preview/soft/dark');
    await page.waitForLoadState('networkidle');
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-preset', 'soft');
    await expect(root).toHaveAttribute('data-theme', 'dark');
    // A bare page: no catalog chrome around the sampler.
    await expect(page.getByRole('banner')).toHaveCount(0);
  });

  test('switches the site without repainting the frames', async ({ page }) => {
    await page.goto('/presets');
    const frame = page.frameLocator('iframe[title="Soft preset, dark scheme"]');
    await expect(frame.locator('html')).toHaveAttribute('data-preset', 'soft');

    // Loidolt starts in use, so the offers are soft, then compact.
    await page.getByRole('button', { name: 'Use on this site' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'soft');
    await expect(page.getByRole('button', { name: 'In use' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await page.getByRole('button', { name: 'Use on this site' }).last().click();
    await expect(page.locator('html')).toHaveAttribute('data-preset', 'compact');
    await expect(frame.locator('html')).toHaveAttribute('data-preset', 'soft');
    await expect(frame.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  for (const preset of presets) {
    for (const scheme of schemes) {
      test(`the ${preset} ${scheme} sampler passes axe as served`, async ({ page }) => {
        await page.goto(`/preview/${preset}/${scheme}`);
        const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
