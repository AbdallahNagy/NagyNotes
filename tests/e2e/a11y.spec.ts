import AxeBuilder from '@axe-core/playwright';
import { expect, POST_PATH, test } from './fixtures';

const PAGES = ['/', '/apis/authentication/oauth-2-0', POST_PATH];
const THEMES = ['light', 'sepia', 'dark'] as const;

test.describe('accessibility', () => {
  for (const path of PAGES) {
    for (const theme of THEMES) {
      test(`${path} has no detectable violations in the ${theme} theme`, async ({ page }) => {
        await page.addInitScript((value) => {
          localStorage.setItem(
            'nagy-notes:prefs',
            JSON.stringify({ theme: value, size: 'm', measure: 'normal', font: 'serif' }),
          );
        }, theme);
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      });
    }
  }
});
