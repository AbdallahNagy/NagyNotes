import { expect, test as base, type Page } from '@playwright/test';

const LOADER_SEEN_KEY = 'nagy-notes:loader-seen';

/** Most tests skip the intro loader, as a returning reader in the same session would. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((key) => {
      sessionStorage.setItem(key, '1');
    }, LOADER_SEEN_KEY);
    await use(page);
  },
});

export { expect };

export const POST_PATH = '/apis/authentication/oauth-2-0/client-credentials';

/** The sidebar is a drawer on mobile: open it so its contents can be used. */
export async function openSidebar(page: Page, isMobile: boolean): Promise<void> {
  if (!isMobile) return;
  await page.getByRole('button', { name: 'Open library' }).click();
  await expect(page.locator('#sidebar')).toHaveAttribute('data-open', '');
}

/** Asserts the page's content column sits in the middle of <main>, not against its left edge. */
export async function expectCentred(page: Page, column: string): Promise<void> {
  const gaps = await page.evaluate((selector) => {
    const main = document.getElementById('main')?.getBoundingClientRect();
    const box = document.querySelector(selector)?.getBoundingClientRect();
    if (!main || !box) throw new Error(`Missing ${selector} or #main`);
    return { left: box.left - main.left, right: main.right - box.right };
  }, column);
  expect(gaps.left).toBeGreaterThan(40);
  expect(Math.abs(gaps.left - gaps.right)).toBeLessThanOrEqual(20);
}
