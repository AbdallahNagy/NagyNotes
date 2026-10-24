import { expect, expectCentred, test } from './fixtures';

test.describe('home', () => {
  test('shows the heading, browse folders and the five latest posts', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Notes on business apps and APIs',
    );
    const browse = page.locator('section', {
      has: page.getByRole('heading', { name: 'Browse folders' }),
    });
    await expect(browse.locator('.card')).toHaveCount(3);

    const latest = page.locator('section', { has: page.getByRole('heading', { name: 'Latest' }) });
    await expect(latest.getByRole('listitem')).toHaveCount(5);
    await expect(latest.getByRole('listitem').first()).toContainText(
      "Web resources that don't fight you",
    );
  });

  test('the content column is centred on wide screens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the column fills a narrow screen');
    await page.goto('/');
    await expectCentred(page, '.home');
    await page.goto('/no-such-page');
    await expectCentred(page, '.missing');
  });

  test('a folder card opens the folder page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Open folder APIs' }).click();

    await expect(page).toHaveURL('/apis');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('APIs');
  });

  test('has a 404 page that links home', async ({ page }) => {
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);
    await page.getByRole('link', { name: 'Back to the home page' }).click();
    await expect(page).toHaveURL('/');
  });
});
