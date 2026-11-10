import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * AnnotatedText draws its marks in a mirror under a real textarea. These checks need real layout:
 * that the mirror wraps exactly like the textarea, that marks follow edits, and that the native
 * undo stack and the shortcuts still work.
 */
const field = (page: Page) =>
  page.locator('#docs-content').getByRole('textbox', { name: 'Page text' });

/** The words under each drawn mark, and whether the mirror lays text out like the textarea. */
const overlay = (page: Page) =>
  page.locator('#docs-content .ldt-annotated-text').evaluate((root) => {
    const textarea = root.querySelector('textarea')!;
    const mirror = root.querySelector<HTMLElement>('.ldt-annotated-text__mirror')!;
    const [a, b] = [getComputedStyle(textarea), getComputedStyle(mirror)];
    const properties = [
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'letter-spacing',
      'white-space',
      'overflow-wrap',
      'tab-size',
      'padding-top',
      'padding-left',
      'border-top-width',
      'border-left-width',
    ];
    const contentWidth = (element: HTMLElement, style: CSSStyleDeclaration) =>
      element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return {
      words: [...mirror.querySelectorAll('[data-mark-ids]')].map((mark) => mark.textContent),
      mismatched: properties.filter(
        (name) => a.getPropertyValue(name) !== b.getPropertyValue(name)
      ),
      sameWidth: Math.abs(contentWidth(textarea, a) - contentWidth(mirror, b)) < 0.5,
      sameHeight: Math.abs(textarea.scrollHeight - mirror.scrollHeight) < 1,
      sameScroll: textarea.scrollTop === mirror.scrollTop,
      mirrorText: mirror.textContent?.replace(/\u200b$/, ''),
      value: textarea.value,
    };
  });

const remaining = (page: Page) =>
  page
    .locator('#docs-content')
    .getByRole('list', { name: 'Remaining marks' })
    .getByRole('listitem')
    .allTextContents();

const select = (page: Page, start: number, end = start) =>
  field(page).evaluate(
    (textarea: HTMLTextAreaElement, [start, end]) => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    },
    [start, end]
  );

const selection = (page: Page) =>
  field(page).evaluate((textarea: HTMLTextAreaElement) => [
    textarea.value.slice(textarea.selectionStart, textarea.selectionEnd),
  ]);

test.describe('AnnotatedText', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/annotated-text');
    // Edits made before hydration would reach no handler.
    await page.waitForLoadState('networkidle');
    await expect(field(page)).toBeVisible();
  });

  test('marks stay over their characters while typing before, inside and after them', async ({
    page,
  }) => {
    const initial = await overlay(page);
    expect(initial.words).toEqual(['birch', 'Off-cuts', 'door', 'sanded']);
    expect(initial.mismatched).toEqual([]);
    expect(initial.sameWidth).toBe(true);
    expect(initial.sameHeight).toBe(true);

    const value = initial.value;
    // Before every mark.
    await select(page, 0);
    await page.keyboard.type('Each day, ');
    // Inside "birch": between "bir" and "ch".
    await select(page, value.indexOf('birch') + 10 + 3);
    await page.keyboard.type('rr');
    // Right after "door": does not extend it.
    const afterDoor = (await field(page).inputValue()).indexOf('door') + 4;
    await select(page, afterDoor);
    await page.keyboard.type(' at the back');
    // A long run at the end, so the text wraps and scrolls.
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type(
      ' The shop closes at six, and the floor is swept before anyone goes.'.repeat(3)
    );

    const after = await overlay(page);
    expect(after.words).toEqual(['birrrch', 'Off-cuts', 'door', 'sanded']);
    expect(after.mirrorText).toBe(after.value);
    expect(after.mismatched).toEqual([]);
    expect(after.sameWidth).toBe(true);
    expect(after.sameHeight).toBe(true);
    expect(after.sameScroll).toBe(true);
    expect(await remaining(page)).toContainEqual(expect.stringContaining('“birrrch”'));
  });

  test('deleting a whole mark drops it from the list', async ({ page }) => {
    const value = await field(page).inputValue();
    await select(page, value.indexOf('door'), value.indexOf('door') + 4);
    await page.keyboard.press('Backspace');
    expect((await overlay(page)).words).toEqual(['birch', 'Off-cuts', 'sanded']);
    expect(await remaining(page)).toHaveLength(3);
  });

  test('undo from the keyboard restores the text and the marks', async ({ page }) => {
    const value = await field(page).inputValue();
    await select(page, value.indexOf('birch') + 2);
    await page.keyboard.type('xyz');
    expect((await overlay(page)).words[0]).toBe('bixyzrch');
    // Chromium may keep each typed character as its own undo step.
    await expect(async () => {
      await page.keyboard.press('ControlOrMeta+z');
      expect(await field(page).inputValue()).toBe(value);
    }).toPass({ intervals: [0, 0, 0, 100] });
    expect((await overlay(page)).words).toEqual(['birch', 'Off-cuts', 'door', 'sanded']);
  });

  test('F8 and Shift+F8 select the next and previous marks', async ({ page }) => {
    await select(page, 0);
    await page.keyboard.press('F8');
    expect(await selection(page)).toEqual(['birch']);
    await page.keyboard.press('F8');
    expect(await selection(page)).toEqual(['Off-cuts']);
    await page.keyboard.press('Shift+F8');
    expect(await selection(page)).toEqual(['birch']);
    await page.keyboard.press('Shift+F8');
    expect(await selection(page)).toEqual(['sanded']);
    await expect(page.locator('#docs-content .ldt-annotated-text .ldt-live-region')).toContainText(
      'Spelling corrected, mark 4 of 4'
    );
    await expect(page.locator('#docs-content .ldt-annotated-text__tooltip')).toHaveText(
      'Spelling corrected'
    );
    const describedBy = await field(page).getAttribute('aria-describedby');
    expect(describedBy?.split(' ')).toHaveLength(2);

    await page.locator('#docs-content').getByRole('button', { name: 'Next mark' }).click();
    expect(await selection(page)).toEqual(['birch']);
  });

  test('hovering a mark shows its label', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Needs a hovering pointer.');
    await field(page).scrollIntoViewIfNeeded();
    const mark = page.locator('#docs-content [data-mark-ids="door"]');
    const box = (await mark.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const tooltip = page.locator('#docs-content .ldt-annotated-text__tooltip');
    await expect(tooltip).toHaveText('Unreadable, guessed');
    await expect(tooltip).toBeVisible();
    // Above the mark, and kept inside the field's width.
    const [tip, area] = [(await tooltip.boundingBox())!, (await field(page).boundingBox())!];
    expect(tip.y + tip.height).toBeLessThanOrEqual(box.y);
    expect(tip.x + tip.width).toBeLessThanOrEqual(area.x + area.width + 0.5);
    await page.mouse.move(0, 0);
    await expect(page.locator('#docs-content .ldt-annotated-text__tooltip')).toHaveCount(0);
  });

  test('tapping into a mark shows its label', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-touch', 'Touch only.');
    await field(page).scrollIntoViewIfNeeded();
    const mark = page.locator('#docs-content [data-mark-ids="birch"]');
    const box = (await mark.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(field(page)).toBeFocused();
    await expect(page.locator('#docs-content .ldt-annotated-text__tooltip')).toHaveText(
      'Low confidence'
    );
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });

  test('passes axe with the caret in a mark', async ({ page }) => {
    await select(page, 0);
    await page.keyboard.press('F8');
    const results = await new AxeBuilder({ page })
      .include('#docs-content')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
