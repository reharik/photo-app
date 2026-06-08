import { expect, type BrowserContext, type Page } from '@playwright/test';
import type { TestUser } from './users';

/**
 * Logs the user in by posting directly to the api `/auth/login` endpoint
 * and storing the resulting cookie on the browser context. This is the
 * fast/stable path for setup work in tests whose subject is not the
 * login UI itself.
 *
 * Use `loginViaUi` when the test actually exercises the login screen.
 */
export const loginViaApi = async (context: BrowserContext, user: TestUser): Promise<void> => {
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
