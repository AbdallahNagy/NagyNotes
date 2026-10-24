import { expect, POST_PATH, test } from './fixtures';

test.describe('theme and reading settings', () => {
  test('the theme button cycles light, sepia, dark and back', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    const button = page.getByRole('button', { name: 'Switch theme' });
    await button.click();
    await expect(html).toHaveAttribute('data-theme', 'sepia');
    await button.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await button.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('the saved theme is applied before any script bundle runs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch theme' }).click();
    await page.getByRole('button', { name: 'Switch theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.route('**/*.js', (route) => route.abort());
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe('rgb(30, 31, 36)');
  });

  test('follows the system colour scheme on the first visit', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await context.close();
  });

  test('reading settings change the article and persist', async ({ page }) => {
    await page.goto(POST_PATH);
    const article = page.locator('article');
    const fontSize = () => article.evaluate((el) => getComputedStyle(el).fontSize);
    const baseSize = await fontSize();

    await page.getByRole('button', { name: 'Reading settings' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reading settings' });
    await expect(dialog).toBeVisible();

    await dialog
      .getByRole('radiogroup', { name: 'Text size' })
      .getByRole('radio', { name: 'A+' })
      .click();
    await dialog.getByRole('radio', { name: 'Sans' }).click();
    await dialog.getByRole('radio', { name: 'Wide' }).click();

    await expect(page.locator('html')).toHaveAttribute('data-size', 'l');
    await expect(page.locator('html')).toHaveAttribute('data-font', 'sans');
    await expect(page.locator('html')).toHaveAttribute('data-measure', 'wide');
    expect(await fontSize()).not.toBe(baseSize);
    expect(await article.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Inter');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-size', 'l');
    await expect(page.locator('html')).toHaveAttribute('data-font', 'sans');
  });

  test('the settings popover closes with Escape and returns focus', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Reading settings' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Reading settings' });
    await expect(dialog.getByRole('radio', { name: 'A', exact: true })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('the settings popover closes on an outside click', async ({ page }) => {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Reading settings' });

    await page.getByRole('button', { name: 'Reading settings' }).click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 880);
    await expect(dialog).toBeHidden();
  });

  test('the settings popover closes when navigating', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reading settings' }).click();
    await expect(page.getByRole('dialog', { name: 'Reading settings' })).toBeVisible();

    await page.getByRole('link', { name: 'Open folder APIs' }).click({ force: true });
    await expect(page).toHaveURL('/apis');
    await expect(page.getByRole('dialog', { name: 'Reading settings' })).toBeHidden();
  });

  test('arrow keys move the selection inside a setting group', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reading settings' }).click();
    const theme = page.getByRole('radiogroup', { name: 'Theme' });

    await theme.getByRole('radio', { name: 'Light' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(theme.getByRole('radio', { name: 'Sepia' })).toBeFocused();
    await expect(theme.getByRole('radio', { name: 'Sepia' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sepia');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(theme.getByRole('radio', { name: 'Dark' })).toBeFocused();
  });

  test('the sidebar hides completely and remembers it', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Hiding the sidebar is a desktop layout');
    await page.goto('/');
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveCSS('width', '280px');
    await expect(page.getByRole('button', { name: 'Show sidebar' })).toBeHidden();

    await page.getByRole('button', { name: 'Hide sidebar' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-sidebar-hidden', '');
    await expect(sidebar).toHaveCSS('width', '0px');

    await page.reload();
    await expect(sidebar).toHaveCSS('width', '0px');

    await page.getByRole('button', { name: 'Show sidebar' }).click();
    await expect(sidebar).toHaveCSS('width', '280px');
  });
});
