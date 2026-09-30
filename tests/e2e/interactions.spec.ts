import { expect, test } from './fixtures';

/*
 * The keyboard contracts of the chart and map packages, in a real browser with real ECharts and
 * MapLibre. The unit suites cover the same ground against stand-ins; this is the proof that the
 * libraries themselves do not break it.
 */
test.describe('chart and map interactions', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop only.');
  });

  test('a chart names its picture and discloses its data table', async ({ page }) => {
    await page.goto('/components/line-chart');
    await expect(page.getByRole('img', { name: 'Sheets cut per month' })).toBeVisible();
    await expect(page.locator('.ldt-chart__canvas canvas').first()).toBeVisible();
    const toggle = page.getByRole('button', { name: 'Show data table' });
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Hide data table' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expect(page.getByRole('region', { name: 'Sheets cut per month' })).toBeVisible();
  });

  test('a map marker opens its popup from the keyboard and takes focus back', async ({ page }) => {
    await page.goto('/components/map-marker');
    await expect(page.locator('.ldt-map[data-loaded]')).toBeVisible();
    const gallery = page.getByRole('button', { name: 'Gallery' });
    await gallery.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Gallery' });
    await expect(dialog).toBeFocused();
    await expect(dialog).toContainText('framed prints');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(gallery).toBeFocused();
  });

  test('the map canvas moves by keyboard and says where it landed', async ({ page }) => {
    await page.goto('/components/map-view');
    await expect(page.locator('.ldt-map[data-loaded]')).toBeVisible();
    const canvas = page.getByRole('region', { name: 'Portland' });
    await canvas.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ldt-map [aria-live]').first()).toContainText('Map centred on', {
      timeout: 5000,
    });
  });

  test('the layer manager reorders from the keyboard, announced', async ({ page }) => {
    await page.goto('/components/layer-manager');
    await expect(page.getByRole('switch', { name: 'Stops' })).toBeVisible();
    await page.getByRole('button', { name: 'Move Stops down' }).focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(page.locator('.ldt-layer-manager [aria-live]')).toContainText(
      'Stops moved to position 2 of 4.'
    );
    await expect(page.getByRole('button', { name: 'Move Stops down' })).toBeFocused();
  });

  test('GeoJSON layers draw, so MapLibre found its worker', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /worker/i.test(message.text())) errors.push(message.text());
    });
    await page.goto('/components/circle-layer');
    await expect(page.locator('.ldt-map[data-loaded]')).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test('deck.gl loads on demand and draws without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/components/deck-overlay');
    await page.getByRole('button', { name: 'Show a deck.gl layer' }).click();
    await expect(page.getByRole('button', { name: 'deck.gl layer shown' })).toBeDisabled();
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});
