import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const palette = (page: Page) => page.getByRole('dialog', { name: 'Search the library' });

/** Loads `path` and waits until the header's search island has hydrated. */
async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator('astro-island:has(button[aria-keyshortcuts])')).not.toHaveAttribute(
    'ssr',
  );
}

test.describe('command palette', () => {
  test('opens with the keyboard shortcut and closes with Escape', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Control+k');
    await expect(palette(page)).toBeVisible();
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
  });

  test('a folder lists its subfolders and posts, and Backspace goes back up', async ({ page }) => {
    await gotoReady(page, '/');
    await page.getByRole('button', { name: 'Search…' }).click();
    const dialog = palette(page);
    await dialog.getByRole('option', { name: /^APIs/ }).click();

    await expect(dialog.getByRole('option', { name: /Open “APIs” page/ })).toBeVisible();
    await expect(dialog.getByRole('option', { name: /^Authentication/ })).toBeVisible();
    await expect(dialog.getByRole('option', { name: /^Rate limiting/ })).toBeVisible();

    await dialog.getByRole('option', { name: /^Rate limiting/ }).click();
    await expect(dialog.getByRole('option', { name: /Rate limiting basics/ })).toBeVisible();
    await expect(dialog.getByRole('option', { name: /Retry policies with backoff/ })).toBeVisible();

    await page.keyboard.press('Backspace');
    await expect(dialog.getByRole('option', { name: /Open “APIs” page/ })).toBeVisible();
    await page.keyboard.press('Backspace');
    await expect(dialog.getByRole('option', { name: /^DevOps/ })).toBeVisible();
  });

  test('finds posts by body text and opens one with Enter', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('client_secret');
    const option = palette(page).getByRole('option', { name: /client credentials flow/ });
    await expect(option).toBeVisible();
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/apis/authentication/oauth-2-0/client-credentials');
    await expect(palette(page)).toBeHidden();
  });

  test('finds folders by name and searches only inside the chosen folder', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Control+k');
    const input = page.getByRole('combobox');
    await input.fill('oauth');
    await expect(palette(page).getByRole('option', { name: /^OAuth 2\.0/ })).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('');
    await input.fill('pipelines');
    await expect(palette(page).getByText(/Nothing matches “pipelines”/)).toBeVisible();
  });
});
