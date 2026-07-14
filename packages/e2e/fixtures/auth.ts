import { expect, type BrowserContext, type Page } from '@playwright/test';
import { getDb } from './db';
import type { TestUser } from './users';

/**
 * Clears the `login:attempt` throttle rows for one email. The api throttles login
 * to 5 / 15 min per email, and `rate_limit_event` rows persist across runs against
 * the shared dev DB. Nearly every test logs the seed users in through `setup()`, so
 * without this the counter accumulates across specs and trips ("Too many attempts")
 * partway through the suite — typically by the time the shared tests run. Keyed to
 * the login bucket + this email so it never touches unrelated bookkeeping.
 */
export const resetLoginRateLimit = async (email: string): Promise<void> => {
  await getDb()('rate_limit_event')
    .where({ bucket: 'login:attempt', key: email.toLowerCase().trim() })
    .delete();
};

/**
 * Logs the user in by posting directly to the api `/auth/login` endpoint
 * and storing the resulting cookie on the browser context. This is the
 * fast/stable path for setup work in tests whose subject is not the
 * login UI itself.
 *
 * Use `loginViaUi` when the test actually exercises the login screen.
 */
export const loginViaApi = async (context: BrowserContext, user: TestUser): Promise<void> => {
  await resetLoginRateLimit(user.email);
  const response = await context.request.post(`/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(
      `loginViaApi failed for ${user.email}: ${response.status()} ${await response.text()}`,
    );
  }
};

/**
 * Logs in through the visible login form. Returns once the app shell
 * is showing the Media nav link, which is the agreed signal that the
 * authenticated app has booted.
 */
export const loginViaUi = async (page: Page, user: TestUser): Promise<void> => {
  await resetLoginRateLimit(user.email);
  await page.goto('/login');
  const email = page.getByTestId('login-email');
  const password = page.getByTestId('login-password');
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await email.fill(user.email);
  await password.fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('link', { name: 'Recent', exact: true })).toBeVisible();
};

export const logoutViaApi = async (context: BrowserContext): Promise<void> => {
  await context.request.post(`/api/auth/logout`).catch(() => {
    /* best-effort */
  });
};
