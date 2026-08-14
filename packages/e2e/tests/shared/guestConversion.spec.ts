import type { APIRequestContext, Page } from '@playwright/test';

import { addMediaItemsToNewAlbum } from '../../fixtures/album';
import {
  AUTH_PASSWORD,
  authTestEmail,
  cleanupAuthIdentities,
  drainIpVerificationBucket,
  expectLoggedIn,
  waitForVerificationCode,
} from '../../fixtures/authFlows';
import { env } from '../../fixtures/env';
import {
  countLocalStackSesMessages,
  extractShareInviteUrl,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded } from '../../fixtures/mediaSelection';
import {
  closeShareAlbumModal,
  commitShareEmail,
  openShareAlbumModal,
} from '../../fixtures/shareAlbumModal';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * Cluster B — guest conversion. A guest opens a shared album via a public link, the "living
 * album" offer in the header takes her email inline, and completing signup with the BANKED
 * email lands her inside her account on /albums/{id} because her pending grant materializes
 * on activation.
 *
 *  - B1 (JOURNEY): one real-user walk — open the public album, reveal the offer in place,
 *    hand it the banked email, and confirm the handoff SKIPS the signup email form and lands
 *    her straight on the code screen, then finish signup and land on the album seeing its
 *    items. The prefill-only variant (the notification-email `?email=` link, which must NOT
 *    auto-fire) is folded in as a one-step probe.
 *  - B2 (ISOLATED): the wrong-email bounce is a genuinely DIVERGENT terminal outcome ('/' vs
 *    the album), so it gets its own path. It is hardened so it can't pass for the wrong
 *    reason — landing on '/' is necessary but not sufficient (materialization failing for the
 *    RIGHT email, a thrown visibility query, or returnTo never applying all also end on '/').
 */

const EMAIL_PREFIX = 'rai-guest';

/** Per-test email prefix: embeds uniqueSuffix so cleanup only matches this test's rows. */
const prefixFor = (uniqueSuffix: string): string => `${EMAIL_PREFIX}-${uniqueSuffix}`;

/**
 * User A creates an album and shares it with a not-yet-registered email. Returns the album id
 * and the public `/shared/{token}` URL lifted from the invite email (the same path the recipient
 * would click). The share mints a pending user + a pending album grant for `email`.
 */
const shareAlbumWithGuest = async (
  ownerPage: Page,
  request: APIRequestContext,
  mediaItemIds: string[],
  albumTitle: string,
  email: string,
): Promise<{ albumId: string; shareUrl: string }> => {
  const { albumId } = await addMediaItemsToNewAlbum(ownerPage, albumTitle, mediaItemIds);
  const dialog = await openShareAlbumModal(ownerPage);
  // Captured BEFORE the commit: on the one-surface modal the share (and its
  // emails) fires the moment Enter lands — there is no submit button.
  const sesBaseline = await countLocalStackSesMessages(request);
  await commitShareEmail(dialog, email);
  await closeShareAlbumModal(ownerPage);

  // A non-user album share sends the recipient TWO emails: an "…shared an album with you"
  // notification (no link) and the actual invite ("…sent you photos") carrying the public
  // /shared/{token} URL. Order isn't guaranteed, so match on the message that actually yields a
  // share URL rather than the first one addressed to the recipient.
  let resolvedShareUrl = '';
  await expect
    .poll(
      async () => {
        const messages = (await retrieveLocalStackSesMessages(request)).slice(sesBaseline);
        for (const message of messages) {
          if (!findSesMessageForRecipient([message], email)) {
            continue;
          }
          const url = extractShareInviteUrl(message, env.webBaseUrl) ?? '';
          if (url.length > 0) {
            resolvedShareUrl = url;
            return true;
          }
        }
        return false;
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  return { albumId, shareUrl: resolvedShareUrl };
};

/**
 * Drive the public-album offer: reveal the inline field, type an address, submit. Scoped to
 * the offer's own testid because the mobile bar carries the same "A living album" / "Join in"
 * copy and is present in the DOM (CSS-hidden) at desktop widths.
 */
const submitOffer = async (page: Page, email: string): Promise<void> => {
  await page.getByTestId('public-offer-join').click();
  await page.getByTestId('public-offer-email').fill(email);
  await page.getByTestId('public-offer-submit').click();
};

/** The signup door's code step, reached WITHOUT the guest re-submitting her email. */
const expectOnCodeStep = async (page: Page, email: string): Promise<void> => {
  await expect(page.getByTestId('signup-code')).toBeVisible();
  await expect(page.getByText(`Code sent to ${email}`)).toBeVisible();
};

test.describe('Guest conversion (public album → offer → signup → album)', () => {
  // Only relieves a counter shared by every worker (same loopback IP) — safe to
  // run per-test even while sibling tests are mid-flight in other workers.
  test.beforeEach(async () => {
    await drainIpVerificationBucket();
  });

  // Per-test scope: the prefix embeds uniqueSuffix, so this delete can only
  // ever match THIS test's identities. A per-file prefix here ran on every
  // worker under fullyParallel and deleted sibling tests' in-flight users
  // mid-test — the Phase 2c failure took out both tests in this file.
  test.afterEach(async ({ uniqueSuffix }) => {
    await cleanupAuthIdentities(prefixFor(uniqueSuffix));
  });

  test('journey: the offer reveals in place, carries the email past the signup form, and banked signup lands on the album', async ({
    userA,
    anonPage,
    request,
    grabTestImages,
    uniqueSuffix,
    browser,
  }) => {
    const [a, b] = await setup(grabTestImages, userA, 2);
    // The offer's attribution renders the owner's first + last name — exactly
    // how the factory user's displayName is composed.
    const ownerName = userA.user.displayName;
    const bankedEmail = authTestEmail(prefixFor(uniqueSuffix), 'banked');
    const { albumId, shareUrl } = await shareAlbumWithGuest(
      userA.page,
      request,
      [a.id, b.id],
      `e2e-guest-album-${uniqueSuffix}`,
      bankedEmail,
    );

    await test.step('the public album shows the items and the living-album offer', async () => {
      await anonPage.goto(shareUrl);
      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      const offer = anonPage.getByTestId('public-offer');
      await expect(offer.getByText('A living album')).toBeVisible();
      await expect(offer.getByText(`shared with you by ${ownerName}`)).toBeVisible();
      await expect(anonPage.getByTestId('public-offer-join')).toBeVisible();
    });

    await test.step('revealing swaps ONLY the button for the field — the offer copy stays', async () => {
      await anonPage.getByTestId('public-offer-join').click();
      const offer = anonPage.getByTestId('public-offer');
      await expect(anonPage.getByTestId('public-offer-email')).toBeVisible();
      await expect(anonPage.getByTestId('public-offer-join')).toHaveCount(0);
      // The field must not appear as an unlabeled box: both lines above it survive the swap.
      await expect(offer.getByText('A living album')).toBeVisible();
      await expect(offer.getByText(`shared with you by ${ownerName}`)).toBeVisible();
    });

    await test.step('prefill WITHOUT autoSubmit still lands on the editable email form', async () => {
      // The share notification links to /signup?email=…&returnTo=… and deliberately carries no
      // autoSubmit — she never typed anything, so no code should be sent on arrival. Proves the
      // auto-fire is gated on the explicit signal, not merely on `email` being present.
      const probeContext = await browser.newContext({ storageState: undefined });
      try {
        const probePage = await probeContext.newPage();
        await probePage.goto(
          `/signup?email=${encodeURIComponent(bankedEmail)}&returnTo=${encodeURIComponent(
            `/albums/${albumId}`,
          )}`,
        );
        await expect(probePage.getByTestId('login-email')).toHaveValue(bankedEmail);
        await expect(probePage.getByTestId('signup-code')).toHaveCount(0);
      } finally {
        await probeContext.close();
      }
    });

    await test.step('submitting the offer skips the email form and lands on the code screen', async () => {
      await anonPage.getByTestId('public-offer-email').fill(bankedEmail);
      await anonPage.getByTestId('public-offer-submit').click();

      await expect(anonPage).toHaveURL(/\/signup\?.*autoSubmit=1/);
      // The whole point of the handoff: she is past the email step without re-submitting it.
      await expectOnCodeStep(anonPage, bankedEmail);
      await expect(anonPage.getByTestId('login-email')).toHaveCount(0);
    });

    await test.step('completing signup with the BANKED email lands on the album', async () => {
      const code = await waitForVerificationCode(request, bankedEmail);
      await anonPage.getByTestId('signup-code').fill(code);
      await anonPage.locator('#signup-first-name').fill('Banked');
      await anonPage.locator('#signup-last-name').fill('Guest');
      await anonPage.getByTestId('login-password').fill(AUTH_PASSWORD);
      await anonPage.getByRole('button', { name: 'Create Account' }).click();

      // Landing on /albums/{id} AT ALL is the proof: the signup screen gates the album returnTo
      // behind a live visibility check and quietly falls back to '/' unless the grant exists. So
      // reaching the album means the pending grant materialized on activation.
      await expect(anonPage).toHaveURL(new RegExp(`/albums/${albumId}$`));
      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
    });
  });

  test('isolated: signing up with the WRONG email bounces to "/" quietly, and the album is genuinely inaccessible', async ({
    userA,
    anonPage,
    request,
    grabTestImages,
    uniqueSuffix,
  }) => {
    const [a, b] = await setup(grabTestImages, userA, 2);
    const bankedEmail = authTestEmail(prefixFor(uniqueSuffix), 'banked');
    // B1 proves this exact setup DOES land the banked email on the album — the positive control.
    // B2 changes ONLY the email handed to the offer.
    const { albumId, shareUrl } = await shareAlbumWithGuest(
      userA.page,
      request,
      [a.id, b.id],
      `e2e-guest-wrong-${uniqueSuffix}`,
      bankedEmail,
    );

    // If the quiet pre-nav guard ever regresses into a swallowed AlbumScreen throw, the app logs
    // "Album not found" from the error boundary. Capture it so we can prove the throw did NOT
    // happen during the bounce.
    const albumNotFoundLogs: string[] = [];
    const record = (text: string) => {
      if (text.includes('Album not found')) albumNotFoundLogs.push(text);
    };
    anonPage.on('console', (msg) => {
      if (msg.type() === 'error') record(msg.text());
    });
    anonPage.on('pageerror', (err) => record(err.message));

    const wrongEmail = authTestEmail(prefixFor(uniqueSuffix), 'wrong');

    await test.step('open the public album and hand the offer a DIFFERENT email', async () => {
      await anonPage.goto(shareUrl);
      await expectMediaItemLoaded(anonPage, a.id);
      await submitOffer(anonPage, wrongEmail);
      await expect(anonPage).toHaveURL(/\/signup\?.*autoSubmit=1/);
      await expectOnCodeStep(anonPage, wrongEmail);
    });

    await test.step('complete signup as that different account', async () => {
      const code = await waitForVerificationCode(request, wrongEmail);
      await anonPage.getByTestId('signup-code').fill(code);
      await anonPage.locator('#signup-first-name').fill('Wrong');
      await anonPage.locator('#signup-last-name').fill('Guest');
      await anonPage.getByTestId('login-password').fill(AUTH_PASSWORD);
      await anonPage.getByRole('button', { name: 'Create Account' }).click();
    });

    await test.step('she lands on "/" — quietly, via the guard, not a swallowed error', async () => {
      await expectLoggedIn(anonPage);
      await expect.poll(() => new URL(anonPage.url()).pathname).toBe('/');
      // Not /albums/{id}, and no error-boundary fallback rendered during the bounce.
      await expect(anonPage).not.toHaveURL(new RegExp(`/albums/${albumId}`));
      await expect(anonPage.getByText('Something went wrong')).toHaveCount(0);
      expect(
        albumNotFoundLogs,
        'the bounce must be the pre-nav visibility guard, not a caught AlbumScreen throw',
      ).toEqual([]);
    });

    await test.step('the album is GENUINELY inaccessible to this account (no grant, not a swallowed error)', async () => {
      // Navigating directly bypasses the signup-screen guard and hits AlbumScreen, which throws
      // "Album not found" when the viewer has no grant → error-boundary fallback + no items. This
      // confirms the earlier bounce reflected real absence of a grant, not a silenced error on a
      // grant that actually exists.
      await anonPage.goto(`/albums/${albumId}`);
      await expect(anonPage.getByText('Something went wrong')).toBeVisible();
      await expect(anonPage.getByTestId(`media-tile-${a.id}`)).toHaveCount(0);
      await expect(anonPage.getByTestId(`media-tile-${b.id}`)).toHaveCount(0);
    });
  });
});
