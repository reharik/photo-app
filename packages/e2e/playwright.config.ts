import { defineConfig, devices } from '@playwright/test';
import { env } from './fixtures/env';

/**
 * Playwright config for end-to-end tests.
 *
 * These tests assume the api (default http://localhost:3001) and web
 * (default http://localhost:5173) are already running, and that the
 * database has the standard `01_user.ts` seed applied so User A and
 * User B exist, and that api storage for media uploads is configured.
 * Tests create media through the Upload Media UI (no direct DB inserts).
 * Start api + web before running `npm test` here.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // Non-TTY terminals (e.g. Cursor) make `list` print only one truncated line.
  // verboseFailuresReporter dumps the full error immediately on failure.
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [
        ['list', { printSteps: true }],
        ['./reporters/verboseFailuresReporter.ts'],
        ['html', { open: 'never' }],
      ],
  use: {
    baseURL: env.webBaseUrl,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
