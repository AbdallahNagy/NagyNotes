import { expect, POST_PATH, test } from './fixtures';

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile layout only');

  test('the menu opens the drawer, a link navigates and closes it', async ({ page }) => {
    await page.goto('/');
    const drawer = page.locator('#sidebar');
    await expect(drawer).not.toHaveAttribute('data-open', '');

    await page.getByRole('button', { name: 'Open library' }).click();
    await expect(drawer).toHaveAttribute('data-open', '');
    await expect(page.locator('#main')).toHaveJSProperty('inert', true);

    await drawer.getByRole('link', { name: /^DevOps/ }).click();
    await expect(page).toHaveURL('/devops');
    await expect(drawer).not.toHaveAttribute('data-open', '');
    await expect(page.locator('#main')).toHaveJSProperty('inert', false);
  });

  test('Escape and the close button dismiss the drawer and restore focus', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('button', { name: 'Open library' });

    await menu.click();
    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sidebar')).not.toHaveAttribute('data-open', '');
    await expect(menu).toBeFocused();

    await menu.click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#sidebar')).not.toHaveAttribute('data-open', '');
  });

  test('the drawer closes from its scrim', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open library' }).click();
    await page.mouse.click(400, 400);
    await expect(page.locator('#sidebar')).not.toHaveAttribute('data-open', '');
  });

  test('the bottom bar opens a contents sheet that scrolls to a heading', async ({ page }) => {
    await page.goto(POST_PATH);

    await page.getByRole('button', { name: /^Contents/ }).click();
    const sheet = page.getByRole('dialog', { name: 'On this page' });
    await expect(sheet.getByRole('link')).toHaveCount(5);

    await sheet.getByRole('link', { name: 'Caching tokens' }).click();
    await expect(sheet).toBeHidden();
    await expect
      .poll(() => page.locator('#main').evaluate((main) => main.scrollTop))
      .toBeGreaterThan(300);
  });

  test('the bottom bar steps between posts and dims missing targets', async ({ page }) => {
    await page.goto('/apis/authentication/oauth-2-0/what-oauth-solves');

    await expect(
      page
        .locator('span[aria-hidden="true"]')
        .filter({ has: page.locator('svg') })
        .first(),
    ).toBeVisible();
    await page.getByRole('link', { name: /^Next:/ }).click();
    await expect(page).toHaveURL(POST_PATH);
    await expect(page.getByRole('link', { name: /^Previous:/ })).toBeVisible();
  });

  test('the reading settings fit the screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reading settings' }).click();
    const box = await page.getByRole('dialog', { name: 'Reading settings' }).boundingBox();
    expect(box).not.toBeNull();
    expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 412).toBe(true);
  });
});
