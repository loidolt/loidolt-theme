import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/components/button', '/components/dialog', '/components/theme-toggle'];

test.describe('catalog in a real browser', () => {
  for (const route of routes) {
    test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
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
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
