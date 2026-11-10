import { expect, test } from './fixtures';

/*
 * Workspace's resizable split in a real browser: real layout, real pointer capture, real storage
 * and a real reload through server-rendered markup.
 */
const frame = '[data-testid="workspace-resizable"]';

test.describe('workspace resizable split', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Wide layouts only.');
  });

  test('drags with the pointer', async ({ page }) => {
    await page.goto('/components/workspace');
    const divider = page.getByRole('separator', { name: 'Resize notes' });
    const notes = page.locator(`${frame} .ldt-workspace__inspector`);
    await expect(divider).toHaveAttribute('aria-valuenow', '45');
    await divider.scrollIntoViewIfNeeded();
    const before = (await notes.boundingBox())!;
    const box = (await divider.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 60, y, { steps: 5 });
    await page.mouse.move(x - 120, y, { steps: 5 });
    await page.mouse.up();
    const after = (await notes.boundingBox())!;
    expect(after.width).toBeGreaterThan(before.width + 110);
    expect(Number(await divider.getAttribute('aria-valuenow'))).toBeGreaterThan(45);
    await expect(divider).toBeFocused();
    // Dragging past the limit stops at it.
    const moved = (await divider.boundingBox())!;
    await page.mouse.move(moved.x, y);
    await page.mouse.down();
    await page.mouse.move(moved.x - 2000, y, { steps: 4 });
    await page.mouse.up();
    await expect(divider).toHaveAttribute('aria-valuenow', '75');
  });

  test('resizes from the keyboard', async ({ page }) => {
    await page.goto('/components/workspace');
    const divider = page.getByRole('separator', { name: 'Resize notes' });
    await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    await expect(divider).toHaveAttribute('aria-valuemin', '25');
    await expect(divider).toHaveAttribute('aria-valuemax', '75');
    const controls = await divider.getAttribute('aria-controls');
    await expect(page.locator(`[id="${controls}"]`)).toContainText('Ridge relief');
    await divider.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(divider).toHaveAttribute('aria-valuenow', '47');
    await page.keyboard.press('Shift+ArrowRight');
    await expect(divider).toHaveAttribute('aria-valuenow', '37');
    await expect(page.getByText('Notes at 37%.')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(divider).toHaveAttribute('aria-valuenow', '25');
    await page.keyboard.press('End');
    await expect(divider).toHaveAttribute('aria-valuenow', '75');
    await page.keyboard.press('Enter');
    await expect(divider).toHaveAttribute('aria-valuenow', '25');
    await page.keyboard.press('Enter');
    await expect(divider).toHaveAttribute('aria-valuenow', '75');
  });

  test('keeps the size across a reload with a storage key', async ({ page }) => {
    await page.goto('/components/workspace');
    const divider = page.getByRole('separator', { name: 'Resize notes' });
    await divider.focus();
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(divider).toHaveAttribute('aria-valuenow', '57');
    const notes = page.locator(`${frame} .ldt-workspace__inspector`);
    const width = (await notes.boundingBox())!.width;

    // The first paint, before hydration, already has the stored size.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const frame = document.querySelector('[data-testid="workspace-resizable"] .ldt-workspace');
        (window as unknown as { firstShare: string }).firstShare = frame
          ? getComputedStyle(frame).getPropertyValue('--ldt-inspector-share')
          : '';
      });
    });
    await page.reload();
    expect(
      await page.evaluate(() => (window as unknown as { firstShare: string }).firstShare)
    ).toBe('57fr');
    await expect(divider).toHaveAttribute('aria-valuenow', '57');
    await expect(page.getByText('Notes at 57%.')).toBeVisible();
    expect(Math.abs((await notes.boundingBox())!.width - width)).toBeLessThan(1);
  });
});

test.describe('workspace resizable split on a phone', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-touch', 'Phone layout only.');
  });

  test('stacks the panes and takes the divider out', async ({ page }) => {
    await page.goto('/components/workspace');
    const main = page.locator(`${frame} .ldt-workspace__main`);
    const notes = page.locator(`${frame} .ldt-workspace__inspector`);
    await expect(page.locator(`${frame} .ldt-workspace__divider`)).toBeHidden();
    await expect(page.getByRole('separator', { name: 'Resize notes' })).toHaveCount(0);
    const top = (await main.boundingBox())!;
    const below = (await notes.boundingBox())!;
    expect(below.y).toBeGreaterThanOrEqual(top.y + top.height - 1);
    expect(Math.abs(below.width - top.width)).toBeLessThan(1);
  });
});
