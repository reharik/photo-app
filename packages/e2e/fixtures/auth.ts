import { expect, type BrowserContext, type Page } from '@playwright/test';
import { getDb } from './db';
import type { TestUser } from './users';

/**
 * Clears the `login:attempt` throttle rows for one email (5 / 15 min per email;
 * successful logins count too). With per-test factory users this is normally a
 * no-op — each attempt gets a fresh email — but it's kept as cheap insurance for
 * any caller that logs the same identity in repeatedly. Keyed to the login
 * bucket + this email so it never touches other workers' bookkeeping.
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
 *
 * This MUST stay a real POST to /api/auth/login with the server setting the
 * cookie. Never hand-construct a synthetic token/cookie here — that's how this
 * helper drifts from what real auth does without any test failing.
 * foundation.spec.ts deliberately keeps the UI login path as the canary for
 * that drift.
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
