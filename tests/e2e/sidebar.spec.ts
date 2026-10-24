import type { Page } from '@playwright/test';
import { expect, POST_PATH, test } from './fixtures';

const handle = (page: Page) => page.getByRole('separator', { name: 'Resize sidebar' });
const sidebarWidth = (page: Page) =>
  page.locator('#sidebar').evaluate((el) => Math.round(el.getBoundingClientRect().width));

/** Polls, because the sidebar animates its width after a programmatic change. */
const expectWidth = (page: Page, width: number) =>
  expect.poll(() => sidebarWidth(page)).toBe(width);

/** Drags the handle so the sidebar ends up `width` px wide (before clamping). */
async function dragTo(page: Page, width: number) {
  const box = await handle(page).boundingBox();
  if (!box) throw new Error('handle is not visible');
  const y = box.y + 200;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + width - (await sidebarWidth(page)), y, { steps: 5 });
  await page.mouse.up();
}

test.describe('resizable sidebar', () => {
  test.skip(({ isMobile }) => isMobile, 'the drag handle is desktop only');

  test.beforeEach(async ({ page }) => {
    await page.goto(POST_PATH);
  });

  test('dragging the handle sets the width and it survives a reload', async ({ page }) => {
    await expectWidth(page, 280);
    await dragTo(page, 400);
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '400');
    await expectWidth(page, 400);

    await page.reload();
    await expectWidth(page, 400);
  });

  test('the width is clamped to the allowed range', async ({ page }) => {
    await dragTo(page, 700);
    await expectWidth(page, 480);

    await dragTo(page, 200);
    await expectWidth(page, 220);
  });

  test('dragging past the minimum closes it, and Show sidebar restores the width', async ({
    page,
  }) => {
    await dragTo(page, 350);
    await dragTo(page, 100);
    await expect(page.locator('html')).toHaveAttribute('data-sidebar-hidden', '');
    await expectWidth(page, 0);

    await page.getByRole('button', { name: 'Show sidebar' }).click();
    await expectWidth(page, 350);
  });

  test('the tree controls do not overlap the first folder row', async ({ page }) => {
    const gap = await page.evaluate(() => {
      const controls = document.querySelector('[role="group"][aria-label="Folder view"]');
      const firstRow = document.querySelector('nav[aria-label="Folders"] li');
      if (!controls || !firstRow) throw new Error('Missing tree controls or rows');
      return firstRow.getBoundingClientRect().top - controls.getBoundingClientRect().bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(4);
  });

  test('the handle works from the keyboard and resets on double-click', async ({ page }) => {
    await handle(page).focus();
    await page.keyboard.press('ArrowRight');
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '296');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '264');

    await page.keyboard.press('Home');
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '280');

    await dragTo(page, 420);
    await handle(page).dblclick();
    await expectWidth(page, 280);
  });

  test('the width carries across client navigations', async ({ page }) => {
    await dragTo(page, 380);
    await page.getByRole('link', { name: 'Nagy Notes.' }).click();
    await expect(page).toHaveURL('/');
    await expectWidth(page, 380);
  });
});

test.describe('sidebar overflow', () => {
  for (const width of [220, 280]) {
    test(`never scrolls horizontally at ${width}px`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'the width is fixed in the drawer');
      await page.goto(POST_PATH);
      await page.evaluate((px) => {
        document.documentElement.style.setProperty('--sidebar-width', `${px}px`);
        const longTitle = 'A very long post title that has to be cut off with an ellipsis '.repeat(
          3,
        );
        for (const title of document.querySelectorAll('#sidebar nav a')) title.prepend(longTitle);
      }, width);

      const scroll = page.locator('#sidebar div:has(> nav)');
      const { scrollWidth, clientWidth } = await scroll.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});
