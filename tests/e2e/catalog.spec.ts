import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';
import { componentRoutes, routes } from './routes';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('catalog in a real browser', () => {
  test('the sweep covers every page the component index links to', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One browser check is sufficient.');
    await page.goto('/components');
    const linked = await page
      .locator('a[href^="/components/"]')
      .evaluateAll(
        (links) =>
          [...new Set(links.map((link) => link.getAttribute('href')).filter(Boolean))] as string[]
      );
    expect(linked.sort()).toEqual([...componentRoutes].sort());
  });

  for (const route of routes) {
    test(`${route} passes axe in light and dark themes`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'desktop-chromium',
        'One full browser sweep is sufficient.'
      );
      await page.goto(route);
      for (const theme of ['light', 'dark'] as const) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
        expect.soft(results.violations, `${route} in ${theme} theme`).toEqual([]);
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
