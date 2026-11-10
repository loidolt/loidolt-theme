import { expect, test } from './fixtures';

/*
 * The files demo on /patterns/desktop runs createDesktopFiles outside a Tauri window: `pick()`
 * opens a hidden file input, its files go into the Dropzone through `addFiles()`, and `save()`
 * downloads.
 */
test.describe('desktop files in a browser', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One browser check is sufficient.');
  });

  const demo = (page: import('@playwright/test').Page) =>
    page.locator('.docs-demo').filter({ hasText: 'acceptToFilters' });

  test('picks through the browser picker into the Dropzone, then downloads the list', async ({
    page,
  }) => {
    await page.goto('/patterns/desktop');
    const chooser = page.waitForEvent('filechooser');
    await demo(page).getByRole('button', { name: 'Open files' }).click();
    const picker = await chooser;
    expect(picker.isMultiple()).toBe(true);
    await picker.setFiles([
      { name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('# Notes') },
      { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('png') },
    ]);
    await expect(demo(page).locator('p[role="status"]')).toHaveText('Received notes.md.');
    await expect(demo(page).locator('.ldt-dropzone__error')).toContainText('photo.png');

    const download = page.waitForEvent('download');
    await demo(page).getByRole('button', { name: 'Save the list' }).click();
    expect((await download).suggestedFilename()).toBe('files.txt');
    await expect(demo(page).locator('p[role="status"]')).toContainText('Downloaded as files.txt.');
  });

  test('shows the dialog filters made from an accept string', async ({ page }) => {
    await page.goto('/patterns/desktop');
    await expect(demo(page).locator('dd')).toContainText('"extensions":["pdf","jpeg","jpg"]');
  });
});
