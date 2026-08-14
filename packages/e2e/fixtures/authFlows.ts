import type { APIRequestContext, Page } from '@playwright/test';

import { getDb } from './db';
import {
  extractVerificationCode,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from './localstackSes';
import { expect } from './test';

/**
 * Shared plumbing for the code-based auth doors (signup + forgot-password). Both doors
 * run the same two REST calls — request a code, then verify code + set password — so the
 * email-polling, throttle reset, and "logged in" signal are identical and live here
 * rather than being re-inlined per spec.
 */

/** Every auth email a spec creates should use its own prefix so cleanup can target it. */
export const authTestEmail = (prefix: string, kind = 'user'): string =>
  `${prefix}-${kind}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

/** Password used across the auth specs; satisfies the >= 8 char rule. */
export const AUTH_PASSWORD = 'newPassword9';

/**
 * Resets throttle bookkeeping and removes users a suite created (matched by email prefix).
 * Every FK into `user` is ON DELETE CASCADE, so deleting the user row also clears its grants,
 * authorizations, share-contacts, and pending notifications.
 *
 * The rate-limit deletes are SCOPED, not a global wipe (a global wipe would erase other
 * concurrent workers' counters). But the 'email_verification:issue' bucket delete must stay:
 * that bucket is keyed by IP (30 / 15 min — loopback for everyone locally, since app.proxy
 * is false outside prod) and the api has NO sweep job for `rate_limit_event`, so this is the
 * bucket's ONLY drain. Without it, the third back-to-back run inside 15 minutes trips the
 * limit — which returns a blind 200 and silently sends no code, surfacing 30s later as an
 * unrelated-looking SES poll timeout. Email-keyed buckets are cleared only for this suite's
 * own prefix.
 */
export const resetAuthState = async (emailPrefix: string): Promise<void> => {
  const db = getDb();
  await db('rate_limit_event').where({ bucket: 'email_verification:issue' }).delete();
  await db('rate_limit_event').where('key', 'like', `${emailPrefix}-%`).delete();

  const users = await db<{ id: string }>('user')
    .where('email', 'like', `${emailPrefix}-%`)
    .select('id');
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await db('access_grant').whereIn('granted_to_user', ids).delete();
    await db('access_grant').whereIn('granted_by', ids).delete();
    await db('share_contact').whereIn('contact_user_id', ids).delete();
    await db('share_contact').whereIn('user_id', ids).delete();
  }
  await db('email_verification').where('email', 'like', `${emailPrefix}-%`).delete();
  await db('user').where('email', 'like', `${emailPrefix}-%`).delete();
};

/** Drive the signup email step and return once the code/details step is showing. */
export const startSignup = async (page: Page, email: string): Promise<void> => {
  await page.goto('/signup');
  await page.getByTestId('login-email').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('signup-code')).toBeVisible();
};

/**
 * Poll LocalStack SES for the verification email and return its 6-digit code. `fromIndex`
 * slices off already-delivered mail (take a `retrieveLocalStackSesMessages(...).length`
 * baseline before a resend so the poll returns the NEW code, not the stale first one).
 */
export const waitForVerificationCode = async (
  request: APIRequestContext,
  email: string,
  fromIndex = 0,
): Promise<string> => {
  let code = '';
  await expect
    .poll(
      async () => {
        const messages = (await retrieveLocalStackSesMessages(request)).slice(fromIndex);
        const message = findSesMessageForRecipient(messages, email, 'verification code');
        if (!message) {
          return false;
        }
        code = extractVerificationCode(message) ?? '';
        return code.length === 6;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  return code;
};

/** The authenticated app shell is booted once the "Recent" nav link is visible. */
export const expectLoggedIn = async (page: Page): Promise<void> => {
  await expect(page.getByRole('link', { name: 'Recent', exact: true })).toBeVisible();
};
