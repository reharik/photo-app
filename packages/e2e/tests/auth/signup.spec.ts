import type { APIRequestContext, Page } from '@playwright/test';

import { getDb } from '../../fixtures/db';
import {
  extractVerificationCode,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded, selectMediaItems } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * RAI-76 — e2e for the unified signup flow (email → verification code → set
 * password → logged in). The earlier new-user-not-persisted source bug is fixed
 * (User.create no longer forwards an id, so isNew() is true and the row persists),
 * so the happy path now completes end to end.
 */

// All signup test emails share this prefix so cleanup can target them.
const EMAIL_PREFIX = 'rai76-signup';

const freshEmail = (kind = 'user'): string =>
  `${EMAIL_PREFIX}-${kind}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

/**
 * Resets throttle bookkeeping and removes users this suite created. The
 * email-verification endpoint throttles by IP (30 / 15 min) and email (5 / 15 min);
 * `rate_limit_event` rows persist across runs against the shared dev DB, so without
 * this a few reruns silently trip the IP limit and no code is ever emailed.
 */
const resetSignupState = async (): Promise<void> => {
  const db = getDb();
  await db('rate_limit_event').delete();

  const users = await db<{ id: string }>('user')
    .where('email', 'like', `${EMAIL_PREFIX}-%`)
    .select('id');
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await db('access_grant').whereIn('granted_to_user', ids).delete();
    await db('access_grant').whereIn('granted_by', ids).delete();
    await db('share_contact').whereIn('contact_user_id', ids).delete();
    await db('share_contact').whereIn('user_id', ids).delete();
  }
  await db('email_verification').where('email', 'like', `${EMAIL_PREFIX}-%`).delete();
  await db('user').where('email', 'like', `${EMAIL_PREFIX}-%`).delete();
};

/** Drive the signup email step and return once the code step is showing. */
const startSignup = async (page: Page, email: string): Promise<void> => {
  await page.goto('/signup');
  await page.getByTestId('login-email').fill(email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('signup-code')).toBeVisible();
};

/** Poll LocalStack SES for the verification email and return its 6-digit code. */
const waitForVerificationCode = async (
  request: APIRequestContext,
  email: string,
): Promise<string> => {
  let code = '';
  await expect
    .poll(
      async () => {
        const messages = await retrieveLocalStackSesMessages(request);
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

/** Fill the details step and submit. */
const submitDetails = async (
  page: Page,
  {
    code,
    firstName = 'Given',
    lastName = 'Family',
  }: { code: string; firstName?: string; lastName?: string },
): Promise<void> => {
  await page.getByTestId('signup-code').fill(code);
  await page.locator('#signup-first-name').fill(firstName);
  await page.locator('#signup-last-name').fill(lastName);
  await page.getByTestId('login-password').fill('newPassword9');
  await page.getByRole('button', { name: 'Create Account' }).click();
};

/** The authenticated app shell is booted once the "Recent" nav link is visible. */
const expectLoggedIn = async (page: Page): Promise<void> => {
  await expect(page.getByRole('link', { name: 'Recent', exact: true })).toBeVisible();
};

test.describe('Signup (email → code → password)', () => {
  test.beforeEach(async () => {
    await resetSignupState();
  });

  test.afterAll(async () => {
    await resetSignupState();
  });

  test('email step sends a code and advances to the details/code step', async ({ anonPage }) => {
    const email = freshEmail();
    await startSignup(anonPage, email);

    // Existence-blind: regardless of the email, the UI advances to the code step.
    await expect(
      anonPage.getByText('a 6-digit code is on its way', { exact: false }),
    ).toBeVisible();
  });

  test('an invalid code is rejected and keeps the user on the code step', async ({ anonPage }) => {
    const email = freshEmail();
    await startSignup(anonPage, email);

    // A real (random) verification code was just issued for this email; 000000 is wrong.
    await submitDetails(anonPage, { code: '000000' });

    // Backend rejects the bad code (and bumps the attempt counter); the FE surfaces a
    // friendly message and keeps the user on the code step — no navigation into the app.
    await expect(anonPage.getByText("That code isn't right.")).toBeVisible();
    await expect(anonPage.getByTestId('signup-code')).toBeVisible();
    await expect(anonPage).toHaveURL(/\/signup$/);
  });

  test('happy path: valid code creates the account and lands in the app', async ({
    anonPage,
    request,
  }) => {
    const email = freshEmail();
    await startSignup(anonPage, email);

    const code = await waitForVerificationCode(request, email);
    await submitDetails(anonPage, { code });

    await expectLoggedIn(anonPage);
  });

  test('bad code then correct code logs the new user in', async ({ anonPage, request }) => {
    const email = freshEmail();
    await startSignup(anonPage, email);

    const code = await waitForVerificationCode(request, email);

    // A wrong code bumps the attempt counter (well short of the 3-attempt lockout) and
    // keeps the user on the code step without consuming the real code.
    await submitDetails(anonPage, { code: '000000' });
    await expect(anonPage.getByText("That code isn't right.")).toBeVisible();

    // The correct code then completes signup and lands in the app.
    await anonPage.getByTestId('signup-code').fill(code);
    await anonPage.getByRole('button', { name: 'Create Account' }).click();
    await expectLoggedIn(anonPage);
  });

  // Sharing an INDIVIDUAL item with a not-yet-registered email and then activating that
  // account surfaces the item in the recipient's "Shared with me". This previously failed
  // on the read side (the item's grant was album-scoped on a public-link album, which
  // getMediaItemsSharedWithMe/getAlbumsSharedWithMe both dropped); the grants-from-domain-
  // events refactor now materializes the item-scoped grant on activation, so it works.
  test('pending-user activation materializes the shadow user and their grants', async ({
    userA,
    anonPage,
    request,
    grabTestImages,
  }) => {
    const [item] = await setup(grabTestImages, userA, 1);
    const email = freshEmail('pending');

    // User A shares the item with a not-yet-registered email → mints a pending
    // (shadow) user plus a pending grant to them.
    const selection = await selectMediaItems(userA.page, [item.id], {
      toolbarVariant: 'library',
      expectActions: ['Share', 'Add to album'],
    });
    await selection.clickAction('Share');
    // Single-item share dialog is titled "Share item" (no count); multi is "Share N items".
    const shareDialog = userA.page.getByRole('dialog', { name: /^Share (item|\d+ items?)$/ });
    const recipientInput = shareDialog.getByRole('combobox', { name: 'Recipients' });
    await recipientInput.fill(email);
    await recipientInput.press('Enter');
    await expect(
      shareDialog.getByRole('button', { name: `Remove ${email.toLowerCase()}` }),
    ).toBeVisible();
    await shareDialog.getByRole('button', { name: 'Share with user' }).click();
    await expect(shareDialog).toBeHidden();

    // The shadow user signs up through the SAME flow; activation should flip them
    // active and materialize the pending grant.
    await startSignup(anonPage, email);
    const code = await waitForVerificationCode(request, email);
    await submitDetails(anonPage, { code, firstName: 'Pending', lastName: 'Activated' });
    await expectLoggedIn(anonPage);

    // The pending grant materializes via the post-commit `pendingUserActivated` handler
    // (AuthorizationReconciliation), which is asynchronous — poll with reloads so a brief
    // materialization lag doesn't flake the check.
    await expect(async () => {
      await anonPage.goto('/shared/items');
      await expect(anonPage.getByTestId(`media-tile-${item.id}`)).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await expectMediaItemLoaded(anonPage, item.id);
  });
});
