import { expect, POST_PATH, test } from './fixtures';

test.describe('post page', () => {
  test('shows breadcrumb, title and metadata', async ({ page }) => {
    await page.goto(POST_PATH);

    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link');
    await expect(crumbs).toHaveText(['Home', 'APIs', 'Authentication', 'OAuth 2.0']);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'The client credentials flow, end to end',
    );
    await expect(page.getByText(/\d+ min read/)).toBeVisible();
    await expect(page.getByText('Oct 18, 2026')).toBeVisible();
  });

  test('links to the previous and next post in the folder', async ({ page }) => {
    await page.goto(POST_PATH);

    const prevNext = page.getByRole('navigation', { name: 'More in this folder' });
    await expect(prevNext.getByRole('link', { name: /Previous in OAuth 2.0/ })).toContainText(
      'What OAuth solves',
    );
    await prevNext.getByRole('link', { name: /Next in OAuth 2.0/ }).click();
    await expect(page).toHaveURL('/apis/authentication/oauth-2-0/auth-code-pkce');
  });

  test('the progress bar grows as the reader scrolls', async ({ page }) => {
    await page.goto(POST_PATH);
    const fill = page.getByTestId('reading-progress');
    await expect.poll(async () => (await fill.boundingBox())?.width ?? 0).toBe(0);

    await page.locator('#main').evaluate((main) => {
      main.scrollTop = (main.scrollHeight - main.clientHeight) / 2;
    });
    await expect.poll(async () => (await fill.boundingBox())?.width ?? 0).toBeGreaterThan(50);
  });

  test('the table of contents lists the h2s and scrolls to them', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The side table of contents only appears on wide screens');
    await page.goto(POST_PATH);

    const toc = page.getByRole('navigation', { name: 'On this page' });
    await expect(toc.getByRole('link')).toHaveText([
      'Overview',
      'Requesting a token',
      'Calling the API',
      'Caching tokens',
      'Common errors',
    ]);
    await expect(toc.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'location',
    );

    await toc.getByRole('link', { name: 'Caching tokens' }).click();
    await expect(toc.getByRole('link', { name: 'Caching tokens' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    await expect
      .poll(() => page.locator('#main').evaluate((main) => main.scrollTop))
      .toBeGreaterThan(300);
    await expect(toc.getByText(/\d+ min left/)).toBeVisible();
  });

  test('the copy button copies the code and confirms', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are Chromium specific');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(POST_PATH);

    const block = page.locator('.code-block').first();
    const button = block.getByRole('button', { name: 'Copy code' });
    await button.scrollIntoViewIfNeeded();
    await button.click();

    await expect(button).toContainText('Copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('curl -X POST');
    await expect(button).toContainText('Copy', { timeout: 3000 });
    await expect(button).not.toContainText('Copied');
  });

  test('labels code blocks with the language as written', async ({ page }) => {
    await page.goto(POST_PATH);
    await expect(page.locator('.code-block__lang')).toHaveText(['bash', 'json', 'c#', 'c#']);
  });

  test('shows that comments are not available without Supabase', async ({ page }) => {
    await page.goto(POST_PATH);

    const comments = page.locator('#comments');
    await expect(comments.getByRole('heading', { name: 'Comments' })).toBeVisible();
    await expect(comments).toContainText("Comments aren't available yet.");
    await expect(comments.getByRole('button', { name: 'Post comment' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /jump to comments/ })).toHaveCount(0);
  });
});
