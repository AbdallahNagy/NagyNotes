import { expect, test } from './fixtures';

test.describe('folder page', () => {
  test('lists subfolders and posts with counts', async ({ page }) => {
    await page.goto('/apis/authentication');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Authentication');
    await expect(page.getByText('How clients prove who they are')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /OAuth 2.0/ }).filter({ hasText: '3 posts' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Posts · 2' })).toBeVisible();
  });

  test('the sort toggle switches between reading order and newest', async ({ page }) => {
    await page.goto('/apis/authentication/oauth-2-0');
    const titles = page.locator('ol > li a span:first-child');

    await expect(titles).toHaveText([
      'What OAuth solves',
      'The client credentials flow, end to end',
      'Auth code + PKCE for single-page apps',
    ]);

    await page.getByRole('radio', { name: 'Newest' }).click();
    await expect(titles).toHaveText([
      'The client credentials flow, end to end',
      'Auth code + PKCE for single-page apps',
      'What OAuth solves',
    ]);
  });

  test('a folder without posts of its own lists everything below it', async ({ page }) => {
    await page.goto('/business-applications');

    await expect(page.getByRole('heading', { name: 'All posts · 5' })).toBeVisible();
    await expect(page.getByText('Microsoft Dynamics / Plugins').first()).toBeVisible();
  });

  test('bookmarking from the list updates the toggle', async ({ page }) => {
    await page.goto('/apis/authentication/oauth-2-0');
    const toggle = page.getByRole('button', { name: 'Bookmark: What OAuth solves' });

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows read progress for posts the reader has scrolled', async ({ page }) => {
    await page.goto('/apis/authentication/oauth-2-0/client-credentials');
    await page.locator('#main').evaluate((main) => {
      main.scrollTop = main.scrollHeight;
    });
    await expect(page.getByTestId('reading-progress')).toHaveAttribute('style', /width: 100%/);

    await page.goto('/apis/authentication/oauth-2-0');
    await expect(page.getByText(/Oct 18, 2026 · Read/)).toBeVisible();
  });
});
