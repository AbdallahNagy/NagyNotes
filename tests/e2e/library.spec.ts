import { expect, openSidebar, POST_PATH, test } from './fixtures';

test.describe('library', () => {
  test('a bookmarked post appears on the home card and in the tree', async ({ page, isMobile }) => {
    await page.goto(POST_PATH);
    const bookmark = page.getByRole('button', { name: 'Bookmark', exact: true });
    await bookmark.click();
    await expect(page.getByRole('button', { name: 'Bookmarked' })).toBeVisible();

    await page.getByRole('link', { name: 'Nagy Notes.' }).click();
    await expect(page).toHaveURL('/');
    const card = page.locator('section', { has: page.getByRole('heading', { name: /Bookmarks/ }) });
    await expect(card).toContainText('Bookmarks · 1');
    await expect(
      card.getByRole('link', { name: 'The client credentials flow, end to end' }),
    ).toBeVisible();

    await openSidebar(page, isMobile);
    await expect(
      page
        .getByRole('navigation', { name: 'Folders' })
        .getByRole('link', { name: /client credentials/ }),
    ).toContainText('(bookmarked)');
  });

  test('bookmarks can be removed again', async ({ page }) => {
    await page.goto(POST_PATH);
    await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
    await page.getByRole('button', { name: 'Bookmarked' }).click();
    await expect(page.getByRole('button', { name: 'Bookmark', exact: true })).toBeVisible();
  });

  test('opening a post expands its folders and highlights the row', async ({ page, isMobile }) => {
    await page.goto(POST_PATH);
    await openSidebar(page, isMobile);

    const tree = page.getByRole('navigation', { name: 'Folders' });
    await expect(tree.getByRole('button', { name: 'Collapse OAuth 2.0' })).toBeVisible();
    await expect(tree.getByRole('link', { name: /client credentials/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('the folder tree works from the keyboard', async ({ page, isMobile }) => {
    await page.goto('/');
    await openSidebar(page, isMobile);

    const tree = page.getByRole('navigation', { name: 'Folders' });
    const dynamics = tree.getByRole('link', { name: 'Microsoft Dynamics' });
    const caret = tree.getByRole('button', { name: 'Expand Business Applications' });
    await caret.focus();
    await page.keyboard.press('Enter');
    await expect(
      tree.getByRole('button', { name: 'Collapse Business Applications' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(dynamics).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(dynamics).toHaveCount(0);
  });

  test('Collapse all closes every folder', async ({ page, isMobile }) => {
    await page.goto(POST_PATH);
    await openSidebar(page, isMobile);

    await page.getByRole('button', { name: 'Collapse all' }).click();
    await expect(
      page.getByRole('navigation', { name: 'Folders' }).getByRole('button', { name: /^Collapse / }),
    ).toHaveCount(0);
  });

  test('Expand one level opens folders a depth at a time and Collapse all resets', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    await openSidebar(page, isMobile);

    const tree = page.getByRole('navigation', { name: 'Folders' });
    const expand = page.getByRole('button', { name: 'Expand one level' });
    const collapse = page.getByRole('button', { name: 'Collapse all' });
    await expect(collapse).toBeDisabled();

    await expand.click();
    await expect(tree.getByRole('button', { name: /^Collapse / })).toHaveCount(3);
    await expect(tree.getByRole('link', { name: 'Authentication' })).toBeVisible();
    await expect(tree.getByRole('link', { name: 'Microsoft Dynamics' })).toBeVisible();
    await expect(tree.getByRole('link', { name: /client credentials/ })).toHaveCount(0);

    await expand.click();
    await expect(tree.getByRole('link', { name: 'OAuth 2.0' })).toBeVisible();
    await expect(collapse).toBeEnabled();

    while (await expand.isEnabled()) await expand.click();
    await expect(tree.getByRole('link', { name: /client credentials/ })).toBeVisible();

    await collapse.click();
    await expect(tree.getByRole('button', { name: /^Collapse / })).toHaveCount(0);
    await expect(expand).toBeEnabled();
  });

  test('the flat view lists every post newest first with its folder and persists', async ({
    page,
    isMobile,
  }) => {
    await page.goto(POST_PATH);
    await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
    await openSidebar(page, isMobile);
    await page.getByRole('button', { name: 'Flat view' }).click();

    const list = page.getByRole('navigation', { name: 'All posts' });
    await expect(page.getByText(/^All posts · \d+$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Collapse all' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Expand one level' })).toHaveCount(0);

    const first = list.getByRole('link').first();
    await expect(first).toContainText("Web resources that don't fight you");
    await expect(first).toContainText('Business Applications');
    await expect(list.getByRole('link', { name: /client credentials/ })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await expect(list.getByRole('link', { name: /client credentials/ })).toContainText(
      '(bookmarked)',
    );

    await page.reload();
    await openSidebar(page, isMobile);
    await expect(page.getByRole('button', { name: 'Flat view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Tree view' }).click();
    await expect(page.getByRole('navigation', { name: 'Folders' })).toBeVisible();
  });

  test('recent posts show up in the sidebar', async ({ page, isMobile }) => {
    await page.goto(POST_PATH);
    await page.goto('/apis/authentication/api-keys');
    await openSidebar(page, isMobile);

    const recent = page.getByRole('region', { name: 'Recent' });
    await expect(recent.getByRole('link')).toHaveText([
      'API keys done right',
      'The client credentials flow, end to end',
    ]);
  });

  test('the filter finds a post by text in its body', async ({ page, isMobile }) => {
    await page.goto('/');
    await openSidebar(page, isMobile);

    await page.getByRole('searchbox', { name: 'Filter posts' }).fill('AuthenticationHeaderValue');
    const results = page.getByRole('navigation', { name: 'Search results' });
    await expect(results.getByRole('link')).toHaveCount(1);
    await expect(results.getByRole('link')).toContainText(
      'The client credentials flow, end to end',
    );
    await expect(results.getByRole('link')).toContainText('APIs');

    await results.getByRole('link').click();
    await expect(page).toHaveURL(/client-credentials$/);
  });

  test('the filter says when nothing matches and clears with Escape', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');
    await openSidebar(page, isMobile);

    const filter = page.getByRole('searchbox', { name: 'Filter posts' });
    await filter.fill('zzzzzz');
    await expect(page.getByText('No posts match “zzzzzz”.')).toBeVisible();

    await filter.press('Escape');
    await expect(filter).toHaveValue('');
    await expect(page.getByRole('navigation', { name: 'Folders' })).toBeVisible();
  });
});

test.describe('sidebar across client navigations', () => {
  test('never duplicates rows or marks, however the reader navigates', async ({
    page,
    isMobile,
  }) => {
    await page.goto(POST_PATH);
    await openSidebar(page, isMobile);
    await page.getByRole('button', { name: 'Collapse all' }).click();
    if (isMobile) await page.getByRole('button', { name: 'Close' }).click();

    const tree = page.getByRole('navigation', { name: 'Folders' });
    const expectCleanTree = async () => {
      const rows = tree.locator('li:has(> div > a)');
      const texts = await rows.evaluateAll((items) =>
        items.map((item) => item.querySelector('a')?.textContent ?? ''),
      );
      expect(new Set(texts).size).toBe(texts.length);
      const marks = await rows.evaluateAll((items) =>
        items.map((item) => item.querySelectorAll(':scope > div > svg').length),
      );
      expect(Math.max(0, ...marks)).toBeLessThanOrEqual(1);
    };

    await page.getByRole('link', { name: 'Nagy Notes.' }).click();
    await expect(page).toHaveURL('/');
    await page
      .locator('main')
      .getByRole('link', { name: /client credentials/ })
      .first()
      .click();
    await expect(page).toHaveURL(/client-credentials$/);
    await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Bookmarked' })).toBeVisible();
    await expectCleanTree();

    await page.locator('main').getByRole('navigation').getByRole('link', { name: 'APIs' }).click();
    await expect(page).toHaveURL('/apis');
    await expectCleanTree();

    await page
      .locator('main')
      .getByRole('link', { name: /client credentials/ })
      .first()
      .click();
    await expect(page).toHaveURL(/client-credentials$/);
    await expectCleanTree();
    await openSidebar(page, isMobile);
    await expect(tree.getByRole('link', { name: /client credentials/ })).toHaveCount(1);
  });
});
