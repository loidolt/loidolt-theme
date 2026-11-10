import type { Page } from '@playwright/test';
import { samplePage } from '../../examples/catalog/src/lib/sample-page';
import { expect, test } from './fixtures';

/*
 * ImageViewer in a real browser: regions must sit exactly on the image at every zoom level, and
 * the zoom, pan and region contracts must hold from the keyboard.
 */

const NATURAL = { width: samplePage.width, height: samplePage.height };
const rects = samplePage.blocks.map(({ id, x, y, width, height }) => ({ id, x, y, width, height }));

/**
 * How far any region's box is from where its natural-pixel rectangle lands on the image as drawn
 * right now, in screen pixels.
 */
async function misalignment(page: Page) {
  return page.evaluate(
    ({ natural, rects }) => {
      const image = document.querySelector('.ldt-image-viewer__image')!.getBoundingClientRect();
      const ratio = image.width / natural.width;
      let worst = 0;
      for (const rect of rects) {
        const region = document.querySelector(`[data-region-id="${rect.id}"]`)!;
        const box = region.getBoundingClientRect();
        worst = Math.max(
          worst,
          Math.abs(box.left - (image.left + rect.x * ratio)),
          Math.abs(box.top - (image.top + rect.y * ratio)),
          Math.abs(box.width - rect.width * ratio),
          Math.abs(box.height - rect.height * ratio)
        );
      }
      return { worst, count: rects.length, ratio, height: image.height / natural.height };
    },
    { natural: NATURAL, rects }
  );
}

test.describe('ImageViewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/image-viewer');
    await expect(page.locator('.ldt-image-viewer__layer[data-ready]')).toBeVisible();
  });

  test('regions stay on the image at every zoom level', async ({ page }) => {
    const frame = page.getByRole('group', { name: 'Scanned page' });
    const level = page.locator('.ldt-image-viewer__level');
    const regions = page.getByRole('listbox', { name: 'Text blocks' }).getByRole('option');
    expect(await regions.count()).toBeGreaterThanOrEqual(20);

    const levels = new Set<string>();
    const check = async () => {
      const result = await misalignment(page);
      expect(result.count).toBeGreaterThanOrEqual(20);
      // The image keeps its proportions, so both axes scale alike...
      expect(Math.abs(result.ratio - result.height)).toBeLessThan(0.001);
      // ...and every region sits where its image coordinates say, to the pixel.
      expect(result.worst).toBeLessThan(1);
      levels.add((await level.textContent()) ?? '');
    };

    await check();
    await frame.focus();
    for (let step = 0; step < 4; step += 1) {
      await page.keyboard.press('+');
      await check();
    }
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await check();
    await page.getByRole('button', { name: 'Fit width' }).click();
    await check();
    await page.getByRole('button', { name: 'Fit height' }).click();
    await check();
    // Ctrl + wheel zooms around the pointer.
    const box = (await frame.boundingBox())!;
    await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Control');
    await check();
    expect(levels.size).toBeGreaterThanOrEqual(5);
  });

  test('regions also match their image coordinates exactly', async ({ page }) => {
    // The first block is the heading at (80, 70), 520 × 64 natural pixels.
    const frame = page.getByRole('group', { name: 'Scanned page' });
    await frame.focus();
    for (const key of ['+', '+', '+']) {
      await page.keyboard.press(key);
      const image = (await page.locator('.ldt-image-viewer__image').boundingBox())!;
      const heading = (await page.getByRole('option', { name: /^Heading 1/ }).boundingBox())!;
      const ratio = image.width / NATURAL.width;
      expect(Math.abs(heading.x - (image.x + 80 * ratio))).toBeLessThan(1);
      expect(Math.abs(heading.y - (image.y + 70 * ratio))).toBeLessThan(1);
      expect(Math.abs(heading.width - 520 * ratio)).toBeLessThan(1);
      expect(Math.abs(heading.height - 64 * ratio)).toBeLessThan(1);
    }
  });

  test('zooms and pans from the keyboard', async ({ page }) => {
    const frame = page.getByRole('group', { name: 'Scanned page' });
    const level = page.locator('.ldt-image-viewer__level');
    const layer = page.locator('.ldt-image-viewer__layer');
    const fitted = await level.textContent();
    await frame.focus();
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    const zoomed = await level.textContent();
    expect(parseInt(zoomed!)).toBeGreaterThan(parseInt(fitted!));
    await expect(page.getByRole('status').filter({ hasText: zoomed! })).toHaveCount(1);

    const before = await layer.getAttribute('style');
    await page.keyboard.press('ArrowDown');
    expect(await layer.getAttribute('style')).not.toBe(before);

    await page.keyboard.press('-');
    expect(parseInt((await level.textContent())!)).toBeLessThan(parseInt(zoomed!));
    await page.keyboard.press('0');
    await expect(level).toHaveText(fitted!);
    await expect(page.getByRole('button', { name: 'Fit whole image' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('regions are reachable by keyboard, selectable, and linked to the list', async ({
    page,
  }) => {
    const frame = page.getByRole('group', { name: 'Scanned page' });
    const listbox = page.getByRole('listbox', { name: 'Text blocks' });
    await frame.focus();
    await page.keyboard.press('Tab');
    const first = listbox.getByRole('option').first();
    await expect(first).toBeFocused();
    await expect(first).toHaveAccessibleName(/^Heading 1: Workshop notes/);

    await page.keyboard.press('ArrowDown');
    const second = listbox.getByRole('option').nth(1);
    await expect(second).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    const row = page.getByRole('list', { name: 'Recognised text' }).getByRole('button').nth(1);
    await expect(row).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('End');
    await expect(listbox.getByRole('option').last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(second).toHaveAttribute('aria-selected', 'false');

    // Zoom in, then select from the list: the region is brought into view and announced.
    await frame.focus();
    for (const key of ['+', '+', '+', '+', '+']) await page.keyboard.press(key);
    const last = listbox.getByRole('option').last();
    const lastRow = page.getByRole('list', { name: 'Recognised text' }).getByRole('button').last();
    await lastRow.click();
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.getByRole('status').filter({ hasText: /Page 3 of 12, selected/ })
    ).toHaveCount(1);
    const [frameBox, regionBox] = [(await frame.boundingBox())!, (await last.boundingBox())!];
    expect(regionBox.x).toBeGreaterThanOrEqual(frameBox.x);
    expect(regionBox.y).toBeGreaterThanOrEqual(frameBox.y);
    expect(regionBox.x + regionBox.width).toBeLessThanOrEqual(frameBox.x + frameBox.width);
    expect(regionBox.y + regionBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height);
  });

  test('a pointer click selects a region, and hovering one highlights its row', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Hover is a desktop pointer contract.');
    const region = page.getByRole('listbox', { name: 'Text blocks' }).getByRole('option').nth(2);
    await region.hover();
    const row = page.getByRole('list', { name: 'Recognised text' }).getByRole('button').nth(2);
    await expect(row).toHaveAttribute('data-hovered', '');
    await region.click();
    await expect(region).toHaveAttribute('aria-selected', 'true');
    await expect(row).toHaveAttribute('aria-pressed', 'true');
    await row.hover();
    await expect(
      page.getByRole('listbox', { name: 'Text blocks' }).getByRole('option').nth(2)
    ).toHaveAttribute('data-hovered', '');
  });
});
