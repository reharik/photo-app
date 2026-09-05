import type { APIRequestContext, Page } from '@playwright/test';

import { clearGrantDeliveryRecords } from './cleanup';
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
 * Drains the IP-keyed 'email_verification:issue' throttle bucket (30 / 15 min —
 * loopback for everyone locally, since app.proxy is false outside prod). The api
 * has NO sweep job for `rate_limit_event`, so this is the bucket's ONLY drain;
 * without it the third back-to-back run inside 15 minutes trips the limit —
 * which returns a blind 200 and silently sends no code, surfacing 30s later as
 * an unrelated-looking SES poll timeout.
 *
 * Deliberately NOT per-test-scoped: the bucket is shared by nature (one IP for
 * every local worker). Deleting its rows can only RELIEVE a counter that would
 * otherwise block, so a worker draining it mid-sibling-test is harmless —
 * unlike the identity cleanup below, which must never see another test's rows.
 */
export const drainIpVerificationBucket = async (): Promise<void> => {
  await getDb()('rate_limit_event').where({ bucket: 'email_verification:issue' }).delete();
};

/**
 * Removes the identities ONE test created, matched by that test's own email
 * prefix — the prefix must embed `uniqueSuffix` (see each spec's `prefixFor`)
 * so this can never match a sibling test's in-flight rows. The per-FILE prefix
 * version of this ran in beforeEach/afterAll and, under fullyParallel, each
 * worker re-ran the file's hooks and deleted other workers' in-flight users
 * mid-test (the Phase 2c parallelism failure). Keep it per-test.
 *
 * Every FK into `user` is ON DELETE CASCADE, so deleting the user row also
 * clears its grants, authorizations, share-contacts, and pending notifications.
 * Email-keyed rate-limit rows for these throwaway addresses are cleared too —
 * they'd otherwise accumulate forever (no api-side sweep). One residue this
 * does NOT cover: a run killed mid-test leaves that test's rows behind, since
 * no later run shares its prefix. Unique emails make those orphans inert.
 */
export const cleanupAuthIdentities = async (emailPrefix: string): Promise<void> => {
  const db = getDb();
  await db('rate_limit_event').where('key', 'like', `${emailPrefix}-%`).delete();

  const users = await db<{ id: string }>('user')
    .where('email', 'like', `${emailPrefix}-%`)
    .select('id');
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    // `email_delivery` / `async_notification` reference `access_grant` with no
    // cascade, so they must be cleared before the grant deletes below.
    await clearGrantDeliveryRecords(ids);
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
