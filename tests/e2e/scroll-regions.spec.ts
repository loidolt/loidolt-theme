import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * A bounded scroll region has to be the containing block of what it scrolls. Visually hidden
 * text (`.ldt-sr-only`: a table caption, the live region inside every Button) is absolutely
 * positioned; if no ancestor inside the region is positioned it is laid out against one outside
 * it, escapes the region's overflow clipping, and stretches the page to wherever the last row
 * would have been. A long table in a short wrapper made a page thousands of pixels taller than
 * its content, and scrolled sticky chrome (an AppShell's TabBar) out of view.
 */

const rows = 60;
const bound = 12 * 16; // 12rem

/** A Button as it renders: its polite live region is always mounted. */
const button =
  '<button type="button" class="ldt-button ldt-button--secondary ldt-button--sm">Edit' +
  '<span class="ldt-sr-only" role="status"></span></button>';

/** How much taller the document gets while `fill` runs. */
async function growth(page: Page, fill: () => Promise<unknown>) {
  const height = () => page.evaluate(() => document.documentElement.scrollHeight);
  const before = await height();
  await fill();
  return (await height()) - before;
}

/** Appends a height-bounded fixture to the page's main column and returns its scroll region. */
async function mount(page: Page, route: string, markup: string, region: string): Promise<Locator> {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page
    .locator('main')
    .first()
    .evaluate((main, markup) => {
      const frame = document.createElement('div');
      frame.dataset.testid = 'bounded';
      frame.style.height = '12rem';
      frame.innerHTML = markup;
      main.append(frame);
    }, markup);
  return page.locator(`[data-testid="bounded"] ${region}`);
}

/** Fills a region with one Button per paragraph. */
const fillWithButtons = (region: Locator) =>
  region.evaluate(
    (element, { button, rows }) => {
      for (let index = 0; index < rows; index += 1) {
        const item = document.createElement('p');
        item.innerHTML = button;
        element.append(item);
      }
    },
    { button, rows }
  );

test.describe('bounded scroll regions contain their hidden text', () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Layout, not viewport, is under test.');
  });

  test('a sticky Table with a Button in every row does not grow the page', async ({ page }) => {
    await page.goto('/components/table');
    await page.waitForLoadState('networkidle');
    const wrap = page.locator('.ldt-table-wrap--sticky').first();
    await wrap.evaluate((element) => element.style.setProperty('--ldt-table-height', '12rem'));
    const heightBefore = (await wrap.boundingBox())!.height;

    const grew = await growth(page, () =>
      wrap.evaluate(
        (element, { button, rows }) => {
          const body = element.querySelector('tbody')!;
          const template = body.querySelector('tr')!;
          for (let index = 0; index < rows; index += 1) {
            const row = template.cloneNode(true) as HTMLTableRowElement;
            row.lastElementChild!.innerHTML = button;
            body.append(row);
          }
        },
        { button, rows }
      )
    );

    // The demo's few rows sit under the bound, so the wrapper itself grows up to it; the page may
    // grow by that much and no more.
    const heightAfter = (await wrap.boundingBox())!.height;
    expect(heightAfter).toBeLessThanOrEqual(bound + 2);
    expect(grew).toBeLessThanOrEqual(heightAfter - heightBefore + 1);
    // The caption and every live region resolve against the wrapper, not an ancestor outside it.
    const parents = await wrap
      .locator('.ldt-sr-only')
      .evaluateAll((elements) =>
        elements.map((element) => (element as HTMLElement).offsetParent?.className ?? '')
      );
    expect(parents.length).toBeGreaterThan(rows);
    for (const parent of parents) expect(parent).toContain('ldt-table-wrap');
  });

  test('a DataTable scrolls in the same contained wrapper', async ({ page }) => {
    await page.goto('/components/data-table');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ldt-table-wrap').first()).toHaveCSS('position', 'relative');
  });

  test('a height-bounded Workspace sidebar does not grow the page', async ({ page }) => {
    const sidebar = await mount(
      page,
      '/components/sidebar',
      '<div class="ldt-workspace ldt-workspace--sidebar" style="height: 100%">' +
        '<aside class="ldt-sidebar"></aside><div class="ldt-workspace__main">Main</div></div>',
      '.ldt-sidebar'
    );
    expect(await growth(page, () => fillWithButtons(sidebar))).toBeLessThanOrEqual(1);
  });

  test('a vertical rail’s scrolling panels do not grow the page', async ({ page }) => {
    const panels = await mount(
      page,
      '/components/tabs',
      '<div class="ldt-tabs ldt-tabs--rail" data-orientation="vertical">' +
        '<div class="ldt-tabs__list" data-orientation="vertical"></div>' +
        '<div class="ldt-tabs__panels"></div></div>',
      '.ldt-tabs__panels'
    );
    expect(await growth(page, () => fillWithButtons(panels))).toBeLessThanOrEqual(1);
  });
});
