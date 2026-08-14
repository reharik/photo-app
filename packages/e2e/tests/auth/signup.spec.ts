import type { Page } from '@playwright/test';

import {
  AUTH_PASSWORD,
  authTestEmail,
  cleanupAuthIdentities,
  drainIpVerificationBucket,
  expectLoggedIn,
  startSignup,
  waitForVerificationCode,
} from '../../fixtures/authFlows';
import { countLocalStackSesMessages } from '../../fixtures/localstackSes';
import { expectMediaItemLoaded, selectMediaItems } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { openSharedAlbum, sharedItemsAlbumTitle } from '../../routines/openSharedAlbum';
import { setup } from '../../routines/setup';

/**
 * RAI-76 — e2e for the unified signup door (email → verification code → set password → in the
 * app). See root CLAUDE.md for the code lifecycle: 6-digit code, 10-min TTL, lockout at the 4th
 * submit (backend rejects once `attemptCount >= 3`).
 *
 * Two tests:
 *  - a single JOURNEY that walks the happy path and DETOURS through every recoverable failure a
 *    real fat-fingering user hits — whitespace-only names (client gate), a wrong code, the
 *    attempt lockout, and resend recovery — because each failure leaves the user able to retry.
 *  - an ISOLATED pending-user activation test: it exercises a different read path (item-scoped
 *    grant materialization surfacing in "Shared with me"), so it stays on its own.
 */

const EMAIL_PREFIX = 'rai76-signup';

/** Per-test email prefix: embeds uniqueSuffix so cleanup only matches this test's rows. */
const prefixFor = (uniqueSuffix: string): string => `${EMAIL_PREFIX}-${uniqueSuffix}`;

/** Fill the details-step fields without submitting, so a test can re-submit to retry. */
const fillDetails = async (
  page: Page,
  {
    code,
    firstName = 'Given',
    lastName = 'Family',
    password = AUTH_PASSWORD,
  }: { code: string; firstName?: string; lastName?: string; password?: string },
): Promise<void> => {
  await page.getByTestId('signup-code').fill(code);
  await page.locator('#signup-first-name').fill(firstName);
  await page.locator('#signup-last-name').fill(lastName);
  await page.getByTestId('login-password').fill(password);
};

const clickCreateAccount = (page: Page): Promise<void> =>
  page.getByRole('button', { name: 'Create Account' }).click();

test.describe('Signup (email → code → password)', () => {
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

  test('journey: existence-blind email step, name + code errors recover, resend completes signup', async ({
    anonPage,
    request,
    uniqueSuffix,
  }) => {
    const email = authTestEmail(prefixFor(uniqueSuffix));

    await test.step('email step is existence-blind and advances to the details step', async () => {
      await startSignup(anonPage, email);
      await expect(
        anonPage.getByText('a 6-digit code is on its way', { exact: false }),
      ).toBeVisible();
    });

    // A real code is now issued. Grab it up front; the wrong-code detour below never consumes it.
    const firstCode = await waitForVerificationCode(request, email);

    await test.step('DETOUR: whitespace-only names are rejected client-side', async () => {
      // Code is a valid length so validation falls through to the name gate (which trims).
      await fillDetails(anonPage, { code: '000000', firstName: '   ', lastName: 'Family' });
      await clickCreateAccount(anonPage);
      await expect(anonPage.getByText('Enter your first name.')).toBeVisible();

      await anonPage.locator('#signup-first-name').fill('Given');
      await anonPage.locator('#signup-last-name').fill('   ');
      await clickCreateAccount(anonPage);
      await expect(anonPage.getByText('Enter your last name.')).toBeVisible();

      await anonPage.locator('#signup-last-name').fill('Family');
    });

    await test.step('DETOUR: wrong code three times, then a fourth submit trips the lockout', async () => {
      // Names are valid now, so each submit reaches the API with the wrong code. Attempts 1-3
      // are rejected as a bad code (each bumps the server-side counter); the 4th is locked out
      // BEFORE the code is even checked, so a valid code would be refused here too.
      for (let attempt = 1; attempt <= 3; attempt++) {
        await clickCreateAccount(anonPage);
        await expect(anonPage.getByText("That code isn't right.")).toBeVisible();
      }
      await clickCreateAccount(anonPage);
      await expect(anonPage.getByText('Too many tries — resend a new code.')).toBeVisible();
    });

    await test.step('resend issues a fresh code and the correct one completes signup', async () => {
      // Baseline before resend so the poll returns the NEW code, not the stale first one (which
      // resend invalidates anyway). The old `firstCode` is now dead.
      const sesBaseline = await countLocalStackSesMessages(request);
      await anonPage.getByRole('button', { name: 'Send again' }).click();
      const resentCode = await waitForVerificationCode(request, email, sesBaseline);
      expect(resentCode).not.toBe(firstCode);

      await anonPage.getByTestId('signup-code').fill(resentCode);
      await clickCreateAccount(anonPage);
      await expectLoggedIn(anonPage);
    });
  });

  // Sharing an INDIVIDUAL item with a not-yet-registered email and then activating that
  // account surfaces the item to the recipient. Loose items are wrapped in a generated
  // shadow album, so the grant is album-scoped on that album and the recipient reaches the
  // item by opening it from the Shared list. Kept ISOLATED: this exercises activation
  // materializing a PENDING grant, which the guest-conversion suite does not cover.
  test('pending-user activation materializes the shadow user and their grant', async ({
    userA,
    anonPage,
    request,
    grabTestImages,
    uniqueSuffix,
  }) => {
    const [item] = await setup(grabTestImages, userA, 1);
    const email = authTestEmail(prefixFor(uniqueSuffix), 'pending');

    // User A shares the item with a not-yet-registered email → mints a pending (shadow) user
    // plus a pending grant to them.
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

    // The shadow user signs up through the SAME flow; activation should flip them active and
    // materialize the pending grant.
    await startSignup(anonPage, email);
    const code = await waitForVerificationCode(request, email);
    await fillDetails(anonPage, { code, firstName: 'Pending', lastName: 'Activated' });
    await clickCreateAccount(anonPage);
    await expectLoggedIn(anonPage);

    // The pending grant materializes via the post-commit `pendingUserActivated` handler
    // (AuthorizationReconciliation), which is asynchronous — poll with reloads so a brief
    // materialization lag doesn't flake the check.
    await expect(async () => {
      await openSharedAlbum(anonPage, sharedItemsAlbumTitle(userA.user), { timeout: 2000 });
      await expect(anonPage.getByTestId(`media-tile-${item.id}`)).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await expectMediaItemLoaded(anonPage, item.id);
  });
});
