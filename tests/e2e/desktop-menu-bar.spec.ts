import { expect, test } from './fixtures';

/*
 * The menu bar section on /patterns/desktop lists what a sample registry's commands get in the
 * native menu bar, through the real menuAccelerator(). In a browser there is no menu bar to build.
 */
test.describe('menu bar accelerators', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One browser check is sufficient.');
  });

  test('turns chords and function keys into accelerators and leaves plain keys alone', async ({
    page,
  }) => {
    await page.goto('/patterns/desktop');
    const table = page.getByRole('table', { name: /menuAccelerator/ });
    const row = (item: string) => table.getByRole('row').filter({ hasText: item });
    await expect(row('New note')).toContainText('CmdOrCtrl+N');
    await expect(row('Export…')).toContainText('CmdOrCtrl+Shift+E');
    await expect(row('Next item')).toContainText('Alt+Down');
    await expect(row('Documentation')).toContainText('F1');
    await expect(row('Keyboard shortcuts')).toContainText('none: left to the page');
  });
});
