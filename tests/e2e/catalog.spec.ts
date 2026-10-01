import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { catalogRoutes } from './catalog-routes.js';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const presets = ['loidolt', 'soft', 'compact'] as const;

test.describe('catalog in a real browser', () => {
  for (const route of catalogRoutes) {
    test(`${route} passes axe under every preset, light and dark`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'desktop-chromium',
        'One desktop browser check is sufficient.'
      );

      await page.goto(route);
      for (const preset of presets) {
        for (const theme of ['light', 'dark'] as const) {
          await page.evaluate(
            ([preset, theme]) => Object.assign(document.documentElement.dataset, { preset, theme }),
            [preset, theme] as const
          );
          const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
          expect.soft(results.violations, `${route}, ${preset} preset, ${theme}`).toEqual([]);
        }
      }
    });
  }

  test('theme and dialog keyboard interactions preserve their contracts', async ({ page }) => {
    await page.goto('/components/theme-toggle');
    const toggle = page.locator('#docs-content').getByRole('button', { name: /Colour scheme:/ });
    await expect(toggle).toBeVisible();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('data-theme-preference', /light|dark|system/);

    await page.goto('/components/dialog');
    const trigger = page.locator('#docs-content').getByRole('button', { name: 'Open dialog' });
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const openResults = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(openResults.violations).toEqual([]);
    await expect(page.getByRole('banner')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
