import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
/** Lets a machine with a pre-installed Chromium (not the revision Playwright expects) run the suite. */
const executablePath = process.env.PW_CHROMIUM_PATH;
const port = 4321;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    // --ignore-lock keeps the server in the foreground, which Playwright needs, even when the
    // command is started by an AI agent (Astro otherwise backgrounds the preview server).
    command: 'pnpm build && pnpm preview --ignore-lock',
    // The suite asserts on known posts, so it builds against fixtures rather than src/content.
    env: { CONTENT_DIR: './tests/e2e/content/posts' },
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
