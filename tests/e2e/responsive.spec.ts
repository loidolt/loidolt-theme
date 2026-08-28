import { expect, test } from '@playwright/test';

const staticRoutes = ['/', '/404', '/components', '/foundations', '/patterns'];
const widths = [320, 360, 390, 768, 844];

const dimensions = (element: HTMLElement) => ({
  clientWidth: element.clientWidth,
  scrollWidth: element.scrollWidth,
});

test.describe('responsive catalog', () => {
  test('every route reflows without document-level horizontal scrolling', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One browser sweep covers all widths.');

    await page.goto('/components');
    const componentRoutes = await page
      .locator('a[href^="/components/"]')
      .evaluateAll(
        (links) =>
          [...new Set(links.map((link) => link.getAttribute('href')).filter(Boolean))] as string[]
      );
    const routes = [...staticRoutes, ...componentRoutes].sort();

    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
      for (const route of routes) {
        await page.goto(route);
        const root = await page.locator('html').evaluate(dimensions);
        expect
          .soft(root.scrollWidth, `${route} at ${width}px`)
          .toBeLessThanOrEqual(root.clientWidth);
      }
    }
  });

  test('long localized tabs and toggle options stay in their own scrollers', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One narrow viewport is sufficient.');
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto('/components/tabs');
    await page.locator('.ldt-tabs__trigger').evaluateAll((elements) =>
      elements.forEach((element, index) => {
        element.textContent = `Long localized tab label ${index + 1}`;
      })
    );
    const tabsRoot = await page.locator('html').evaluate(dimensions);
    const tabList = await page.locator('.ldt-tabs__list').evaluate(dimensions);
    expect(tabsRoot.scrollWidth).toBeLessThanOrEqual(tabsRoot.clientWidth);
    expect(tabList.scrollWidth).toBeGreaterThan(tabList.clientWidth);

    await page.goto('/components/toggle-group');
    await page.locator('.ldt-toggle-group__item').evaluateAll((elements) =>
      elements.forEach((element, index) => {
        element.textContent = `Long localized option ${index + 1}`;
      })
    );
    const togglesRoot = await page.locator('html').evaluate(dimensions);
    const groups = await page.locator('.ldt-toggle-group').evaluateAll((elements) =>
      elements.map((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }))
    );
    expect(togglesRoot.scrollWidth).toBeLessThanOrEqual(togglesRoot.clientWidth);
    expect(groups.every((group) => group.scrollWidth > group.clientWidth)).toBe(true);
  });

  test('buttons and context details preserve content at compact widths', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One narrow viewport is sufficient.');
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto('/components/button');
    const button = page.locator('#docs-content .ldt-button').first();
    await button.evaluate((element) => {
      element.textContent =
        'Create a localized fabrication package with every selected drawing and attachment';
    });
    const buttonRoot = await page.locator('html').evaluate(dimensions);
    const buttonSize = await button.evaluate(dimensions);
    expect(buttonRoot.scrollWidth).toBeLessThanOrEqual(buttonRoot.clientWidth);
    expect(buttonSize.scrollWidth).toBeLessThanOrEqual(buttonSize.clientWidth);

    await page.goto('/components/context-bar');
    const detail = page.locator('.ldt-contextbar__detail');
    await expect(detail).toBeVisible();
    await expect(detail).toContainText('Real-data preview ready');
  });

  test('selected inset controls retain a 3:1 focus indicator', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chromium',
      'One browser contrast check is sufficient.'
    );
    await page.goto('/components/toggle-group');
    const selected = page.locator('.ldt-toggle-group__item[data-state="on"]').first();
    await selected.focus();
    const colors = await selected.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, outline: style.outlineColor };
    });
    const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const luminance = (value: string) => {
      const linear = channels(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const lighter = Math.max(luminance(colors.background), luminance(colors.outline));
    const darker = Math.min(luminance(colors.background), luminance(colors.outline));
    expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(3);
  });

  test('embedded workspaces stack based on their container, not only the viewport', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One desktop viewport is sufficient.');
    await page.setViewportSize({ width: 844, height: 640 });
    await page.goto('/components/workspace');

    const frame = page.locator('.docs-frame');
    const workspace = frame.locator('.ldt-workspace');
    expect((await frame.evaluate(dimensions)).clientWidth).toBeLessThan(760);
    await expect(workspace).toHaveCSS('display', 'block');
    const frameSize = await frame.evaluate(dimensions);
    expect(frameSize.scrollWidth).toBeLessThanOrEqual(frameSize.clientWidth);
  });

  test('localized overlay actions wrap inside compact dialogs and drawers', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One narrow viewport is sufficient.');
    await page.setViewportSize({ width: 320, height: 568 });

    await page.goto('/components/dialog');
    await page.getByRole('button', { name: 'Open dialog' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('.ldt-dialog__footer .ldt-button').evaluateAll((buttons) =>
      buttons.forEach((button, index) => {
        button.textContent = `Very long localized dialog action ${index + 1}`;
      })
    );
    const dialogSize = await dialog.evaluate(dimensions);
    expect(dialogSize.scrollWidth).toBeLessThanOrEqual(dialogSize.clientWidth);

    await page.keyboard.press('Escape');
    await page.goto('/components/drawer');
    await page.getByRole('button', { name: 'Open from the left' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.locator('.ldt-drawer__footer .ldt-button').evaluateAll((buttons) =>
      buttons.forEach((button) => {
        button.textContent = 'Very long localized drawer action that must wrap';
      })
    );
    const drawerSize = await drawer.evaluate(dimensions);
    expect(drawerSize.scrollWidth).toBeLessThanOrEqual(drawerSize.clientWidth);
  });

  test('touch contexts enlarge primary targets without shrinking form text', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-touch', 'Requires a coarse-pointer context.');
    await page.goto('/patterns');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);

    const targets = page.locator(
      '#docs-content :is(.ldt-button, .ldt-switch, .ldt-number-field__button, .ldt-select)'
    );
    const boxes = await targets.evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().height))
    );
    expect(boxes.length).toBeGreaterThan(0);
    expect(Math.min(...boxes)).toBeGreaterThanOrEqual(44);

    const fontSizes = await page
      .locator('#docs-content :is(input, select, textarea)')
      .evaluateAll((elements) =>
        elements.map((element) => parseFloat(getComputedStyle(element).fontSize))
      );
    expect(fontSizes.length).toBeGreaterThan(0);
    expect(Math.min(...fontSizes)).toBeGreaterThanOrEqual(16);
  });
});
