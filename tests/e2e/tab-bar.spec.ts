import { expect, test } from './fixtures';

/*
 * A phone that follows the system text size (iOS Dynamic Type, Android's font scale) can double
 * every rem. The TabBar's labels have to stay whole there: five short destinations on a 375px
 * phone, at 200%, with nothing cut off by an ellipsis or by the item's edge (WCAG 1.4.4).
 */
const labels = ['Chrome', 'Share', 'Files', 'Type', 'System'];

test('five short TabBar labels stay whole at 200% text size on a 375px phone', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One viewport is sufficient.');
  await page.setViewportSize({ width: 375, height: 812 });
  // Relabel only once the page has hydrated, so the demo cannot re-render over our labels.
  await page.goto('/components/tab-bar');
  await page.waitForLoadState('networkidle');

  const bar = page.locator('#tab-bar-demo .ldt-tab-bar');
  await bar.evaluate((element, labels) => {
    const demo = element.parentElement!;
    // The bar spans the phone, as it does in an app.
    demo.style.maxWidth = 'none';
    demo.style.border = '0';
    demo.style.position = 'fixed';
    demo.style.insetInline = '0';
    demo.style.bottom = '0';
    const items = [...element.querySelectorAll('.ldt-tab-bar__item')];
    while (items.length < labels.length) {
      const clone = items[items.length - 1].cloneNode(true) as Element;
      clone.removeAttribute('aria-current');
      element.append(clone);
      items.push(clone);
    }
    items.forEach((item, index) => {
      item.querySelector('.ldt-tab-bar__label')!.textContent = labels[index];
    });
    document.documentElement.style.fontSize = '200%';
  }, labels);

  const measured = await bar.locator('.ldt-tab-bar__item').evaluateAll((items) =>
    items.map((item) => {
      const label = item.querySelector<HTMLElement>('.ldt-tab-bar__label')!;
      const itemBox = item.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      return {
        text: label.textContent,
        fontSize: parseFloat(getComputedStyle(label).fontSize),
        // Clipped either way: a hidden overflow, or the label spilling past the item's edge.
        clipped:
          label.scrollWidth > label.clientWidth ||
          label.scrollHeight > label.clientHeight ||
          labelBox.left < itemBox.left - 0.5 ||
          labelBox.right > itemBox.right + 0.5,
        // A label may wrap to a second line, but these one-word labels have no reason to.
        lines: Math.round(labelBox.height / parseFloat(getComputedStyle(label).lineHeight)),
        right: itemBox.right,
      };
    })
  );

  for (const label of measured) {
    expect.soft(label.clipped, `"${label.text}" is cut off`).toBe(false);
    expect.soft(label.lines, `"${label.text}" breaks inside the word`).toBe(1);
    // Still larger than at 100%: the label follows the text size, up to what a tab can hold.
    expect.soft(label.fontSize, `"${label.text}" ignores the text size`).toBeGreaterThan(11);
  }
  expect(Math.max(...measured.map((label) => label.right))).toBeLessThanOrEqual(375.5);
});

/*
 * On iOS the text size arrives as `-webkit-text-size-adjust`, which desktop Chromium ignores, so
 * this only pins the other half: with `--ldt-text-zoom` published, the label's own size takes the
 * zoom and stops at the cap. (The opt-out from the adjustment itself was checked on iOS Safari.)
 */
test('a published --ldt-text-zoom grows the TabBar label up to the same cap', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One viewport is sufficient.');
  await page.goto('/components/tab-bar');
  const label = page.locator('#tab-bar-demo .ldt-tab-bar__label').first();
  const sizeAt = (zoom: string) =>
    label.evaluate((element, zoom) => {
      document.documentElement.style.setProperty('--ldt-text-zoom', zoom);
      return getComputedStyle(element).fontSize;
    }, zoom);
  expect(await sizeAt('1')).toBe('11px');
  expect(await sizeAt('1.2')).toBe('13.2px');
  expect(await sizeAt('1.94')).toBe('14px');
});
