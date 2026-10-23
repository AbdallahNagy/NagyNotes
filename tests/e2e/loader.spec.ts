import { expect, test } from '@playwright/test';

test.describe('intro loader', () => {
  test('shows on the first visit of a session, then never again', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('[data-loader]')).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('data-loaded', '', { timeout: 5000 });
    await expect(page.locator('[data-loader]')).toBeHidden();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-loaded', '');
    await expect(page.locator('[data-loader]')).toBeHidden();
  });

  test('does not come back during client-side navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-loaded', '', { timeout: 5000 });

    await page.getByRole('link', { name: 'Open folder APIs' }).click();
    await expect(page).toHaveURL('/apis');
    await expect(page.locator('html')).toHaveAttribute('data-loaded', '');
    await expect(page.locator('[data-loader]')).toBeHidden();
  });
});
