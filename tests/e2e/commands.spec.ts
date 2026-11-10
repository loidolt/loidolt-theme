import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/*
 * The prerendered page is visible before it hydrates, and a key pressed before the listener is
 * attached is simply lost. Retry the first press until it lands; a press that did land is never
 * repeated, so nothing runs twice.
 */
async function firstPress(action: () => Promise<void>, landed: () => Promise<void>) {
  await expect(async () => {
    await action();
    await landed();
  }).toPass({ timeout: 10_000 });
}

/*
 * The command registry in a real browser: real keydown events, real focus, and Bits UI's dialog
 * returning focus when the shortcut help closes.
 */
test.describe('commands and shortcut help', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Keyboard shortcuts: desktop only.');
    await page.goto('/components/shortcut-help');
    await expect(page.getByText('Sheet 1 of 5')).toBeVisible();
  });

  test('shortcuts run their commands and are logged', async ({ page }) => {
    const log = page.getByTestId('command-log');
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await firstPress(
      () => page.keyboard.press('Alt+ArrowDown'),
      () => expect(log).toContainText('Next sheet: Site plan', { timeout: 1000 })
    );
    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Alt+ArrowUp');
    await expect(log.locator('li').first()).toHaveText('Previous sheet: Site plan');
    await page.keyboard.press('Alt+Equal');
    await expect(page.getByText('at 125%')).toBeVisible();
    await page.keyboard.press('Alt+Minus');
    await expect(page.getByText('at 100%')).toBeVisible();
  });

  test('keys typed into a field are left alone', async ({ page }) => {
    // Prove the listener is live first, or this test would pass on an unhydrated page.
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await firstPress(
      () => page.keyboard.press('Alt+ArrowDown'),
      () => expect(page.getByText('Sheet 2 of 5')).toBeVisible({ timeout: 1000 })
    );
    const note = page.getByRole('textbox', { name: 'Note' });
    await note.click();
    await page.keyboard.type('Why?');
    await page.keyboard.press('Alt+ArrowDown');
    await expect(note).toHaveValue('Why?');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Sheet 2 of 5')).toBeVisible();
  });

  test('? opens the help, which lists the shortcuts and returns focus on close', async ({
    page,
  }) => {
    const next = page.getByRole('button', { name: 'Next', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await firstPress(
      async () => {
        await next.focus();
        await page.keyboard.press('?');
      },
      () => expect(dialog).toBeVisible({ timeout: 1000 })
    );
    await expect(dialog.getByRole('heading', { name: 'Navigation' })).toBeVisible();
    await expect(dialog).toContainText('Zoom in');
    await expect(dialog.locator('kbd.ldt-kbd').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(next).toBeFocused();
  });

  test('the visible trigger opens the help too, and ? can be turned off', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Keyboard shortcuts' });
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await firstPress(
      () => trigger.click(),
      () => expect(dialog).toBeVisible({ timeout: 1000 })
    );
    await dialog.getByRole('button', { name: 'Close dialog' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.getByRole('switch', { name: 'Open shortcuts with ?' }).click();
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('?');
    await expect(dialog).toHaveCount(0);
  });
});
