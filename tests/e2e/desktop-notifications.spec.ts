import { expect, test } from './fixtures';

/*
 * The notifications demo on /patterns/desktop runs createNotifications against the browser's Web
 * Notifications API, the fallback outside a Tauri window. Headless Chromium denies notifications
 * whatever the context grants, so the granting path swaps in a stand-in for `Notification`.
 */
test.describe('notifications in a browser', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One browser check is sufficient.');
  });

  const demo = (page: import('@playwright/test').Page) =>
    page.locator('.docs-demo').filter({ hasText: 'createNotifications' });

  test('asks on a click, then sends a system notification', async ({ page }) => {
    await page.addInitScript(() => {
      const scope = window as unknown as { shown: string[]; Notification: unknown };
      scope.shown = [];
      class StandIn {
        static permission = 'default';
        static async requestPermission() {
          StandIn.permission = 'granted';
          return 'granted';
        }
        constructor(title: string) {
          scope.shown.push(title);
        }
      }
      scope.Notification = StandIn;
    });
    await page.goto('/patterns/desktop');
    const ask = demo(page).getByRole('button', { name: 'Ask for permission' });
    await expect(ask).toBeEnabled();
    await ask.click();
    await expect(ask).toBeDisabled();
    await expect(demo(page).locator('.ldt-badge', { hasText: 'granted' })).toBeVisible();
    await demo(page).getByRole('button', { name: 'Send a sample notification' }).click();
    await expect(demo(page).locator('p[role="status"]')).toHaveText(
      'Sent as a system notification.'
    );
    expect(await page.evaluate(() => (window as unknown as { shown: string[] }).shown)).toEqual([
      'Export finished',
    ]);
  });

  test('shows a toast instead, without throwing, when it may not notify', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/patterns/desktop');
    await demo(page).getByRole('button', { name: 'Send a sample notification' }).click();
    await expect(demo(page).locator('p[role="status"]')).toHaveText('Shown as a toast instead.');
    await expect(page.locator('.ldt-toast').getByText('Export finished')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
