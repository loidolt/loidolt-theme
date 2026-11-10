import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * Dropzone in a real browser: a real DataTransfer through dragenter/dragover/drop, the native
 * picker through its file input, keyboard activation, and the whole-window target.
 */

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** A DataTransfer built in the page, as a real drag from the desktop would carry. */
const files = (page: Page, list: Array<{ name: string; type: string }>) =>
  page.evaluateHandle((list) => {
    const transfer = new DataTransfer();
    for (const { name, type } of list) transfer.items.add(new File(['sample'], name, { type }));
    return transfer;
  }, list);

test.describe('Dropzone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/dropzone');
    // Drag events dispatched before hydration reach markup with no listeners yet.
    await page.waitForLoadState('networkidle');
  });

  test('takes a drop, filters it, fills the form input and says what it turned away', async ({
    page,
  }) => {
    const zone = page.locator('.ldt-dropzone').first();
    const area = zone.locator('.ldt-dropzone__target');
    const dataTransfer = await files(page, [
      { name: 'scan.pdf', type: 'application/pdf' },
      { name: 'notes.txt', type: 'text/plain' },
    ]);
    await area.dispatchEvent('dragenter', { dataTransfer });
    await expect(zone).toHaveAttribute('data-dragging', 'true');
    await area.dispatchEvent('dragover', { dataTransfer });
    await area.dispatchEvent('drop', { dataTransfer });
    await expect(zone).not.toHaveAttribute('data-dragging');

    await expect(page.getByRole('list', { name: 'Received files' })).toContainText('scan.pdf');
    await expect(zone.locator('.ldt-dropzone__error')).toHaveText(
      'notes.txt is not an accepted file type.'
    );
    const input = page.getByLabel('Drop PDFs or images');
    await expect(input).toHaveAccessibleDescription(/notes\.txt is not an accepted file type\./);
    expect(
      await input.evaluate((el: HTMLInputElement) => [...el.files!].map((f) => f.name))
    ).toEqual(['scan.pdf']);
    await expect(page.getByRole('alert').filter({ hasText: 'notes.txt' })).toBeAttached();

    const results = await new AxeBuilder({ page })
      .include('.ldt-dropzone')
      .withTags(wcagTags)
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('a nested drag does not flicker the drag state', async ({ page }) => {
    const zone = page.locator('.ldt-dropzone').first();
    const area = zone.locator('.ldt-dropzone__target');
    const label = zone.locator('.ldt-dropzone__label');
    const dataTransfer = await files(page, [{ name: 'scan.pdf', type: 'application/pdf' }]);
    await area.dispatchEvent('dragenter', { dataTransfer });
    await label.dispatchEvent('dragenter', { dataTransfer });
    await area.dispatchEvent('dragleave', { dataTransfer });
    await expect(zone).toHaveAttribute('data-dragging', 'true');
    await label.dispatchEvent('dragleave', { dataTransfer });
    await expect(zone).not.toHaveAttribute('data-dragging');
  });

  test('the picker path runs through the same filter', async ({ page }) => {
    await page.getByLabel('Drop PDFs or images').setInputFiles([
      { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('png') },
      { name: 'sheet.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b') },
    ]);
    await expect(page.getByRole('list', { name: 'Received files' })).toContainText('photo.png');
    await expect(page.locator('.ldt-dropzone__error')).toHaveText(
      'sheet.csv is not an accepted file type.'
    );
  });

  test('Enter and Space open the file picker from the keyboard', async ({ page }) => {
    const input = page.getByLabel('Drop PDFs or images');
    await input.focus();
    await expect(page.locator('.ldt-dropzone__target')).toHaveCSS('outline-style', 'solid');
    for (const key of ['Enter', ' ']) {
      const chooser = page.waitForEvent('filechooser');
      await page.keyboard.press(key === ' ' ? 'Space' : key);
      const opened = await chooser;
      expect(opened.isMultiple()).toBe(true);
      await opened.setFiles([]);
    }
  });

  test('a source other than a drop can feed it through addFiles', async ({ page }) => {
    await page.getByRole('button', { name: 'Add a sample file' }).click();
    await expect(page.getByRole('list', { name: 'Received files' })).toContainText(
      'sample-sheet.pdf'
    );
  });

  test('the whole-window target shows an overlay and takes a drop anywhere', async ({ page }) => {
    await page.getByRole('switch', { name: 'Accept drops anywhere on the page' }).click();
    const zone = page.locator('.ldt-dropzone').first();
    const dataTransfer = await files(page, [{ name: 'far-away.pdf', type: 'application/pdf' }]);
    const body = page.locator('body');
    await body.dispatchEvent('dragenter', { dataTransfer });
    await expect(zone).toHaveAttribute('data-window-dragging', 'true');
    await expect(page.locator('.ldt-dropzone__overlay')).toBeVisible();
    await body.dispatchEvent('dragover', { dataTransfer });
    await body.dispatchEvent('drop', { dataTransfer });
    await expect(page.locator('.ldt-dropzone__overlay')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Received files' })).toContainText('far-away.pdf');
  });
});
