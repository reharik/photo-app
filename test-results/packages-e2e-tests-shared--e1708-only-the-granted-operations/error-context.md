# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/e2e/tests/shared/shareAlbumWithUser.spec.ts >> Share an album with an existing user >> When User A shares a multi-item album with User B >> should let User B see the album items in Shared-with-me with only the granted operations
- Location: packages/e2e/tests/shared/shareAlbumWithUser.spec.ts:23:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/login", waiting until "load"

```

# Test source

```ts
  1  | import { expect, type BrowserContext, type Page } from '@playwright/test';
  2  | import type { TestUser } from './users';
  3  | 
  4  | /**
  5  |  * Logs the user in by posting directly to the api `/auth/login` endpoint
  6  |  * and storing the resulting cookie on the browser context. This is the
  7  |  * fast/stable path for setup work in tests whose subject is not the
  8  |  * login UI itself.
  9  |  *
  10 |  * Use `loginViaUi` when the test actually exercises the login screen.
  11 |  */
  12 | export const loginViaApi = async (context: BrowserContext, user: TestUser): Promise<void> => {
  13 |   const response = await context.request.post(`/api/auth/login`, {
  14 |     data: { email: user.email, password: user.password },
  15 |   });
  16 |   if (!response.ok()) {
  17 |     throw new Error(
  18 |       `loginViaApi failed for ${user.email}: ${response.status()} ${await response.text()}`,
  19 |     );
  20 |   }
  21 | };
  22 | 
  23 | /**
  24 |  * Logs in through the visible login form. Returns once the app shell
  25 |  * is showing the Media nav link, which is the agreed signal that the
  26 |  * authenticated app has booted.
  27 |  */
  28 | export const loginViaUi = async (page: Page, user: TestUser): Promise<void> => {
> 29 |   await page.goto('/login');
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  30 |   const email = page.getByTestId('login-email');
  31 |   const password = page.getByTestId('login-password');
  32 |   await expect(email).toBeVisible();
  33 |   await expect(password).toBeVisible();
  34 |   await email.fill(user.email);
  35 |   await password.fill(user.password);
  36 |   await page.getByRole('button', { name: 'Sign In' }).click();
  37 |   await expect(page.getByRole('link', { name: 'Recent', exact: true })).toBeVisible();
  38 | };
  39 | 
  40 | export const logoutViaApi = async (context: BrowserContext): Promise<void> => {
  41 |   await context.request.post(`/api/auth/logout`).catch(() => {
  42 |     /* best-effort */
  43 |   });
  44 | };
  45 | 
```