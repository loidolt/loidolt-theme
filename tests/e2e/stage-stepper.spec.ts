import { expect, test } from './fixtures';

test.describe('stage stepper', () => {
  test('advancing the run moves the current step and announces each change', async ({ page }) => {
    await page.goto('/components/stage-stepper');
    await page.waitForLoadState('networkidle');
    const demo = page.locator('#docs-content');
    const list = demo.getByRole('list', { name: 'Run stages', exact: true });
    const advance = demo.getByRole('button', { name: 'Advance run' });
    const region = demo.locator('.ldt-stage-stepper').first().getByRole('status');

    await expect(list.getByRole('listitem')).toHaveCount(5);
    await expect(list.locator('[aria-current="step"]')).toHaveCount(0);

    await advance.click();
    await expect(list.locator('[aria-current="step"]')).toContainText('Upload');
    await expect(region).toHaveText('Upload: In progress');
    await expect(list.getByRole('progressbar', { name: 'Upload progress' })).toHaveAttribute(
      'aria-valuenow',
      '35'
    );

    await advance.click();
    await expect(region).toHaveText('Upload: Done. Analyse: In progress');

    await advance.click();
    await expect(list.locator('[aria-current="step"]')).toContainText('Package');
    await expect(list.getByRole('listitem').nth(2)).toContainText('Convert, Skipped');

    // Keyboard: the button keeps focus and Enter advances to the failure.
    await advance.focus();
    await page.keyboard.press('Enter');
    await expect(region).toHaveText('Package: Failed. Verify: Skipped');
    await expect(list.locator('[aria-current="step"]')).toHaveCount(0);
    await expect(list.getByRole('progressbar', { name: 'Package progress' })).toHaveClass(
      /ldt-progress--error/
    );
    // The detailed copy does not announce: one run, one voice.
    await expect(demo.locator('.ldt-stage-stepper').getByRole('status')).toHaveCount(1);

    await demo.getByRole('button', { name: 'Reset run' }).click();
    await expect(list.getByRole('listitem').first()).toContainText('Upload, Pending');
  });

  test('selectable steps are buttons reachable from the keyboard', async ({ page }) => {
    await page.goto('/components/stage-stepper');
    await page.waitForLoadState('networkidle');
    const demo = page.locator('#docs-content');
    const detailed = demo.getByRole('list', { name: 'Run stages, detailed' });
    const verify = detailed.getByRole('button', { name: /^Verify ?, Pending$/ });
    await verify.focus();
    await page.keyboard.press('Enter');
    await expect(demo.getByText('Selected: Verify')).toBeVisible();
  });

  test('a horizontal run falls back to a column when narrow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Sets its own viewport.');
    const firstTwoTops = async () =>
      page
        .locator('.ldt-stage-stepper--horizontal .ldt-stage-stepper__step')
        .evaluateAll((items) => items.slice(0, 2).map((item) => item.getBoundingClientRect().top));

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/components/stage-stepper');
    const [wideA, wideB] = await firstTwoTops();
    expect(Math.abs(wideA - wideB)).toBeLessThan(1);

    await page.setViewportSize({ width: 360, height: 800 });
    const [narrowA, narrowB] = await firstTwoTops();
    expect(narrowB).toBeGreaterThan(narrowA + 10);
  });
});
