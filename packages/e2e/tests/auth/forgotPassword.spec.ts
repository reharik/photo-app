import type { Page } from '@playwright/test';

import { addMediaItemsToNewAlbum } from '../../fixtures/album';
import { logoutViaApi } from '../../fixtures/auth';
import {
  AUTH_PASSWORD,
  authTestEmail,
  cleanupAuthIdentities,
  drainIpVerificationBucket,
  expectLoggedIn,
  startSignup,
  waitForVerificationCode,
} from '../../fixtures/authFlows';
import { getDb } from '../../fixtures/db';
import { countLocalStackSesMessages } from '../../fixtures/localstackSes';
import { expectMediaItemLoaded } from '../../fixtures/mediaSelection';
import { shareAlbumWithEmail } from '../../fixtures/shareAlbumModal';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * A3 — the forgot-password "door". Same two REST calls as signup (request code → set password);
 * the ONLY difference is it sends no names, so the backend tells reset from create without
 * leaking existence. A name-less account (brand-new email OR an invited pending shadow user)
 * comes back NAME_REQUIRED and the screen reveals name fields IN PLACE for a same-code resubmit.
 *
 * Four tests:
 *  - JOURNEY (never-registered): the whole reveal mechanic, reached by actually navigating —
 *    a wrong code must NOT reveal names, a valid code without names DOES, whitespace names are
 *    re-rejected, and the SAME code resubmits to completion.
 *  - FOLDED (pending shadow user): the grant-materialization-best-effort surface — a user
 *    invited via a share activates through THIS door and must then SEE the shared album.
 *  - ISOLATED (active user): the plain-reset branch (active → setPassword, never activate) with
 *    NO reveal; its own throwaway account so it never mutates a shared seed user's password.
 *  - LOCKOUT (never-registered): the brute-force guard. Three wrong codes must lock the issued
 *    code out for good — including against the CORRECT code — and only a resend reopens it.
 *    Lives here rather than in an api test because the bug it pins was entirely about which
 *    db handle the attempt-count increment went through; only a real commit can show it.
 */

const EMAIL_PREFIX = 'rai-forgot';

/** Per-test email prefix: embeds uniqueSuffix so cleanup only matches this test's rows. */
const prefixFor = (uniqueSuffix: string): string => `${EMAIL_PREFIX}-${uniqueSuffix}`;

/** Drive the forgot-password email step and return once the code step is showing. */
const requestPasswordReset = async (page: Page, email: string): Promise<void> => {
  await page.goto('/forgot-password');
  await page.locator('#forgot-password-email').fill(email);
  await page.getByRole('button', { name: 'Send reset code' }).click();
  await expect(page.getByTestId('forgot-password-code')).toBeVisible();
};

const submitReset = (page: Page): Promise<void> =>
  page.getByRole('button', { name: 'Set password & sign in' }).click();

const nameFields = (page: Page) => ({
  first: page.locator('#forgot-password-first-name'),
  last: page.locator('#forgot-password-last-name'),
});

/**
 * The committed attempt counter for this email's live verification row. Read straight from
 * the db because the counter is written on a handle OUTSIDE the request's unit of work —
 * no UI surface can distinguish "incremented and committed" from "incremented and rolled back".
 */
const readAttemptCount = async (email: string): Promise<number | undefined> => {
  const db = getDb();
  // Same predicate the api's `getValidVerification` uses, so a resend (which expires the
  // old row and inserts a new one) can never make this read the wrong row's counter.
  const row = await db<{
    email: string;
    consumedAt: string | null;
    expiresAt: string;
    attemptCount: number;
  }>('emailVerification')
    .where({ email, consumedAt: null })
    .andWhere('expiresAt', '>', db.fn.now())
    .first();
  return row?.attemptCount;
};

/** User A shares a freshly-created album with `email`, minting a pending user + pending grant. */
const shareNewAlbumWithEmail = async (
  ownerPage: Page,
  mediaItemIds: string[],
  albumTitle: string,
  email: string,
): Promise<string> => {
  const { albumId } = await addMediaItemsToNewAlbum(ownerPage, albumTitle, mediaItemIds);
  await shareAlbumWithEmail(ownerPage, email);
  return albumId;
};

test.describe('Forgot-password door', () => {
  // Only relieves a counter shared by every worker (same loopback IP) — safe to
  // run per-test even while sibling tests are mid-flight in other workers.
  test.beforeEach(async () => {
    await drainIpVerificationBucket();
  });

  // Per-test scope: the prefix embeds uniqueSuffix, so this delete can only
  // ever match THIS test's identities. A per-file prefix here ran on every
  // worker under fullyParallel and deleted sibling tests' in-flight users.
  test.afterEach(async ({ uniqueSuffix }) => {
    await cleanupAuthIdentities(prefixFor(uniqueSuffix));
  });

  test('journey: never-registered email — code error hides names, valid code reveals them, same code resubmits', async ({
    anonPage,
    request,
    uniqueSuffix,
  }) => {
    const email = authTestEmail(prefixFor(uniqueSuffix), 'new');
    await requestPasswordReset(anonPage, email);
    const code = await waitForVerificationCode(request, email);
    const { first, last } = nameFields(anonPage);

    await test.step('DETOUR: a wrong code stays on the code step and does NOT reveal names', async () => {
      await anonPage.getByTestId('forgot-password-code').fill('000000');
      await anonPage.locator('#forgot-password-new-password').fill(AUTH_PASSWORD);
      await submitReset(anonPage);
      await expect(anonPage.getByText("That code isn't right.")).toBeVisible();
      // The reveal is keyed off NAME_REQUIRED ONLY — a code error must never expose name fields.
      await expect(first).toHaveCount(0);
      await expect(last).toHaveCount(0);
    });

    await test.step('a valid code with no names reveals the name fields in place', async () => {
      await anonPage.getByTestId('forgot-password-code').fill(code);
      await submitReset(anonPage);
      await expect(
        anonPage.getByText('We just need your name to finish setting up your account.'),
      ).toBeVisible();
      await expect(first).toBeVisible();
      await expect(last).toBeVisible();
      // Same code, same door: the email field stays put (disabled) — no new code is issued.
      await expect(anonPage.locator('#forgot-password-email')).toHaveValue(email);
    });

    await test.step('DETOUR: whitespace-only revealed names are rejected client-side', async () => {
      await first.fill('   ');
      await last.fill('Rivera');
      await submitReset(anonPage);
      await expect(anonPage.getByText('Enter your first name.')).toBeVisible();

      await first.fill('Nina');
      await last.fill('   ');
      await submitReset(anonPage);
      await expect(anonPage.getByText('Enter your last name.')).toBeVisible();
    });

    await test.step('resubmitting with the SAME code + valid names lands in the app', async () => {
      await first.fill('Nina');
      await last.fill('Rivera');
      await submitReset(anonPage);
      await expectLoggedIn(anonPage);
    });
  });

  test('folded: a pending shadow user activates via this door and then sees the shared album', async ({
    userA,
    anonPage,
    request,
    grabTestImages,
    uniqueSuffix,
  }) => {
    const [a, b] = await setup(grabTestImages, userA, 2);
    const email = authTestEmail(prefixFor(uniqueSuffix), 'pending');

    const albumId = await shareNewAlbumWithEmail(
      userA.page,
      [a.id, b.id],
      `e2e-forgot-album-${uniqueSuffix}`,
      email,
    );

    // The invited (name-less) shadow user activates through the FORGOT-PASSWORD door, not signup.
    await requestPasswordReset(anonPage, email);
    const code = await waitForVerificationCode(request, email);
    await anonPage.getByTestId('forgot-password-code').fill(code);
    await anonPage.locator('#forgot-password-new-password').fill(AUTH_PASSWORD);
    await submitReset(anonPage);

    // First submit returns NAME_REQUIRED and reveals the fields; the same code then completes.
    await expect(
      anonPage.getByText('We just need your name to finish setting up your account.'),
    ).toBeVisible();
    const { first, last } = nameFields(anonPage);
    await first.fill('Pending');
    await last.fill('Reset');
    await submitReset(anonPage);
    await expectLoggedIn(anonPage);

    // The pending album grant materializes via the post-commit `pendingUserActivated` handler
    // (best-effort, no outbox — see grant-materialization risk). Poll with reloads so a brief
    // lag doesn't flake, then confirm she can actually SEE the album she was invited to.
    await expect(async () => {
      await anonPage.goto(`/albums/${albumId}`);
      await expect(anonPage.getByTestId(`media-tile-${a.id}`)).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await expectMediaItemLoaded(anonPage, a.id);
    await expectMediaItemLoaded(anonPage, b.id);
  });

  test('isolated: an active account resets its password with no reveal, and the new password logs in', async ({
    anonPage,
    anonContext,
    request,
    uniqueSuffix,
  }) => {
    const email = authTestEmail(prefixFor(uniqueSuffix), 'active');
    const newPassword = 'resetPassword9';

    await test.step('create an active account via signup', async () => {
      await startSignup(anonPage, email);
      const code = await waitForVerificationCode(request, email);
      await anonPage.getByTestId('signup-code').fill(code);
      await anonPage.locator('#signup-first-name').fill('Active');
      await anonPage.locator('#signup-last-name').fill('Account');
      await anonPage.getByTestId('login-password').fill(AUTH_PASSWORD);
      await anonPage.getByRole('button', { name: 'Create Account' }).click();
      await expectLoggedIn(anonPage);
      await logoutViaApi(anonContext);
    });

    await test.step('forgot-password on the ACTIVE account: no reveal, lands in app', async () => {
      // SES baseline so the reset poll returns the reset code, not the earlier signup code.
      const sesBaseline = await countLocalStackSesMessages(request);
      await requestPasswordReset(anonPage, email);
      const code = await waitForVerificationCode(request, email, sesBaseline);
      await anonPage.getByTestId('forgot-password-code').fill(code);
      await anonPage.locator('#forgot-password-new-password').fill(newPassword);
      // An active account is a plain reset — names are never required, so no reveal.
      await expect(nameFields(anonPage).first).toHaveCount(0);
      await submitReset(anonPage);
      await expectLoggedIn(anonPage);
      await logoutViaApi(anonContext);
    });

    await test.step('the NEW password logs in (the reset actually took)', async () => {
      await anonPage.goto('/login');
      await anonPage.getByTestId('login-email').fill(email);
      await anonPage.getByTestId('login-password').fill(newPassword);
      await anonPage.getByRole('button', { name: 'Sign In' }).click();
      await expectLoggedIn(anonPage);
    });
  });

  test('lockout: three wrong codes lock the code out, and only a resent code reopens the door', async ({
    anonPage,
    request,
    uniqueSuffix,
  }) => {
    const email = authTestEmail(prefixFor(uniqueSuffix), 'lockout');
    await requestPasswordReset(anonPage, email);
    const code = await waitForVerificationCode(request, email);
    const { first, last } = nameFields(anonPage);

    // Six digits (the screen refuses to submit anything shorter) and provably NOT the real
    // code — a lucky collision would silently turn a wrong-code step into a valid one.
    const [wrongA, wrongB, wrongC, wrongAfterLockout] = [
      '000000',
      '111111',
      '222222',
      '333333',
      '444444',
    ].filter((candidate) => candidate !== code);

    // Filled once; the screen keeps it across failed submits, and it must be >= 8 chars or
    // the client-side gate rejects before the code ever reaches the server.
    await anonPage.locator('#forgot-password-new-password').fill(AUTH_PASSWORD);

    await test.step('three wrong codes are each rejected as an invalid code', async () => {
      for (const wrong of [wrongA, wrongB, wrongC]) {
        await anonPage.getByTestId('forgot-password-code').fill(wrong);
        // The submit button is disabled while in flight, so this click auto-waits for the
        // previous attempt to land — the three submits can't collapse into one.
        await submitReset(anonPage);
        await expect(anonPage.getByText("That code isn't right.")).toBeVisible();
      }
    });

    await test.step('the increments SURVIVED the rollback: attempt_count reads 3 on the committed row', async () => {
      // The regression this test exists for, and the one probe no UI surface can make.
      // `bumpValidationAttempts` must write on the raw `database` handle — autocommit,
      // outside the uow. Through `uow.db()` every increment lived inside the transaction
      // the invalid-code path rolls back, so this read stayed 0 forever and the >= 3
      // lockout below could never fire.
      await expect.poll(() => readAttemptCount(email)).toBe(3);
    });

    await test.step('the CORRECT code is now refused — the lockout actually locks', async () => {
      await anonPage.getByTestId('forgot-password-code').fill(code);
      await submitReset(anonPage);
      await expect(anonPage.getByText('Too many tries — resend a new code.')).toBeVisible();
      // With the counter rolled back, this correct code sails through and reveals the name
      // fields instead. Their absence is the sharp edge of the assertion above.
      await expect(first).toHaveCount(0);
      await expect(last).toHaveCount(0);
    });

    await test.step('a wrong code after lockout ALSO reports the lockout, not an invalid code', async () => {
      // The threshold guard is evaluated BEFORE the hash comparison: past the limit, a
      // mismatched code must not fall through to "That code isn't right." The correct-code
      // case alone can't show that ordering, since it never reaches the comparison anyway.
      await anonPage.getByTestId('forgot-password-code').fill(wrongAfterLockout);
      await submitReset(anonPage);
      await expect(anonPage.getByText('Too many tries — resend a new code.')).toBeVisible();
      // Returning early also skips the bump — the counter is a threshold, not a running tally.
      expect(await readAttemptCount(email)).toBe(3);
    });

    await test.step('resending issues a fresh code whose attempt count starts over', async () => {
      // Baseline BEFORE the resend: `verifyEmail` expires the locked row and inserts a new
      // one, so the poll must return the NEW code — the old one is now both expired and
      // locked out, and reading it back would be a silent false failure.
      const sesBaseline = await countLocalStackSesMessages(request);
      await anonPage.getByRole('button', { name: 'Send again' }).click();
      const freshCode = await waitForVerificationCode(request, email, sesBaseline);
      expect(freshCode).not.toBe(code);

      // Resend clears the code box; refill both fields so this step stands on its own.
      await anonPage.getByTestId('forgot-password-code').fill(freshCode);
      await anonPage.locator('#forgot-password-new-password').fill(AUTH_PASSWORD);
      await submitReset(anonPage);

      // Accepted. A never-registered email answers NAME_REQUIRED — a state only a code that
      // cleared BOTH the threshold guard and the hash check can reach. The lockout is per
      // issued code, not a wedge on the address.
      await expect(
        anonPage.getByText('We just need your name to finish setting up your account.'),
      ).toBeVisible();
      await first.fill('Locked');
      await last.fill('Out');
      await submitReset(anonPage);
      await expectLoggedIn(anonPage);
    });
  });
});
