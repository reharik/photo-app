import type { APIRequestContext, Page } from '@playwright/test';

import { addMediaItemsToNewAlbum } from '../../fixtures/album';
import {
  AUTH_PASSWORD,
  authTestEmail,
  expectLoggedIn,
  resetAuthState,
  waitForVerificationCode,
} from '../../fixtures/authFlows';
import { env } from '../../fixtures/env';
import {
  countLocalStackSesMessages,
  extractShareInviteUrl,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded, mediaTile } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * Cluster B — guest conversion. A guest opens a shared album via a public link, the dismissible
 * CTA offers signup, and completing signup with the BANKED email lands her inside her account on
 * /albums/{id} because her pending grant materializes on activation.
 *
 *  - B1 (JOURNEY): one real-user walk — open public album, dismiss the CTA and confirm it stays
 *    gone across a tile→detail→back REMOUNT and an in-session RELOAD, then a FRESH visit restores
 *    it, sign up with the banked email, and land on the album seeing its items. The email-prefill
 *    variant (the notification-email `?email=` param) is folded in as a one-line probe.
 *  - B2 (ISOLATED): the wrong-email bounce is a genuinely DIVERGENT terminal outcome ('/' vs the
 *    album), so it gets its own path. It is hardened so it can't pass for the wrong reason —
 *    landing on '/' is necessary but not sufficient (materialization failing for the RIGHT email,
 *    a thrown visibility query, or returnTo never applying all also end on '/').
 */

const EMAIL_PREFIX = 'rai-guest';

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
  await ownerPage.getByRole('button', { name: 'Share album' }).click();
  const dialog = ownerPage.getByRole('dialog', { name: 'Share album' });
  const recipients = dialog.getByRole('combobox', { name: 'Recipients' });
  await recipients.fill(email);
  await recipients.press('Enter');
  await expect(dialog.getByRole('button', { name: `Remove ${email.toLowerCase()}` })).toBeVisible();
  const sesBaseline = await countLocalStackSesMessages(request);
  await dialog.getByRole('button', { name: 'Share with user' }).click();
  await expect(dialog).toBeHidden();

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

const signupCta = (page: Page) => page.getByRole('link', { name: 'Sign up' });

test.describe('Guest conversion (public album → CTA → signup → album)', () => {
  test.beforeEach(async () => {
    await resetAuthState(EMAIL_PREFIX);
  });

  test.afterAll(async () => {
    await resetAuthState(EMAIL_PREFIX);
  });

  test('journey: dismiss CTA persists across remount + reload, fresh visit restores, banked signup lands on the album', async ({
    userA,
    anonPage,
    request,
    grabTestImages,
    uniqueSuffix,
    browser,
  }) => {
    const [a, b] = await setup(grabTestImages, userA, 2);
    const bankedEmail = authTestEmail(EMAIL_PREFIX, 'banked');
    const { albumId, shareUrl } = await shareAlbumWithGuest(
      userA.page,
      request,
      [a.id, b.id],
      `e2e-guest-album-${uniqueSuffix}`,
      bankedEmail,
    );

    await test.step('the public album shows the items and the signup CTA', async () => {
      await anonPage.goto(shareUrl);
      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      await expect(signupCta(anonPage)).toBeVisible();
    });

    await test.step('dismissing the CTA hides it and it stays gone across remount + reload', async () => {
      await anonPage.getByRole('button', { name: 'Dismiss' }).click();
      await expect(signupCta(anonPage)).toHaveCount(0);

      // tile → media detail → back: the section unmounts and remounts. sessionStorage (not
      // component state) must keep it dismissed.
      await mediaTile(anonPage, a.id).getByRole('link').first().click();
      await expect(anonPage).toHaveURL(new RegExp(`/shared/[^/]+/media/${a.id}`));
      await anonPage.goBack();
      await expectMediaItemLoaded(anonPage, a.id);
      await expect(signupCta(anonPage)).toHaveCount(0);

      // In-session reload: still dismissed (sessionStorage survives a reload).
      await anonPage.reload();
      await expectMediaItemLoaded(anonPage, a.id);
      await expect(signupCta(anonPage)).toHaveCount(0);
    });

    await test.step('email-prefill: the notification-email `?email=` param seeds the signup field', async () => {
      // The share notification links to /signup?email=…&returnTo=…; the CTA itself only carries
      // returnTo. Prove the param prefills the (still-editable) email field.
      const probeContext = await browser.newContext({ storageState: undefined });
      try {
        const probePage = await probeContext.newPage();
        await probePage.goto(
          `/signup?email=${encodeURIComponent(bankedEmail)}&returnTo=${encodeURIComponent(
            `/albums/${albumId}`,
          )}`,
        );
        await expect(probePage.getByTestId('login-email')).toHaveValue(bankedEmail);
      } finally {
        await probeContext.close();
      }
    });

    await test.step('a FRESH visit restores the CTA; signing up with the BANKED email lands on the album', async () => {
      // A brand-new session (empty sessionStorage) — the per-token dismissal above does not carry
      // over, so the CTA is offered again. This is the real "re-open the CTA in a fresh visit".
      const freshContext = await browser.newContext({ storageState: undefined });
      try {
        const freshPage = await freshContext.newPage();
        await freshPage.goto(shareUrl);
        await expectMediaItemLoaded(freshPage, a.id);
        await expect(signupCta(freshPage)).toBeVisible();

        await signupCta(freshPage).click();
        await expect(freshPage).toHaveURL(/\/signup\?returnTo=/);

        await freshPage.getByTestId('login-email').fill(bankedEmail);
        await freshPage.getByRole('button', { name: 'Continue' }).click();
        const code = await waitForVerificationCode(request, bankedEmail);
        await freshPage.getByTestId('signup-code').fill(code);
        await freshPage.locator('#signup-first-name').fill('Banked');
        await freshPage.locator('#signup-last-name').fill('Guest');
        await freshPage.getByTestId('login-password').fill(AUTH_PASSWORD);
        await freshPage.getByRole('button', { name: 'Create Account' }).click();

        // Landing on /albums/{id} AT ALL is the proof: the signup screen gates the album returnTo
        // behind a live visibility check and quietly falls back to '/' unless the grant exists. So
        // reaching the album means the pending grant materialized on activation.
        await expect(freshPage).toHaveURL(new RegExp(`/albums/${albumId}$`));
        await expectMediaItemLoaded(freshPage, a.id);
        await expectMediaItemLoaded(freshPage, b.id);
      } finally {
        await freshContext.close();
      }
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
    const bankedEmail = authTestEmail(EMAIL_PREFIX, 'banked');
    // B1 proves this exact setup DOES land the banked email on the album — the positive control.
    // B2 changes ONLY the email typed at signup.
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

    const wrongEmail = authTestEmail(EMAIL_PREFIX, 'wrong');

    await test.step('open the public album and start signup via the CTA', async () => {
      await anonPage.goto(shareUrl);
      await expectMediaItemLoaded(anonPage, a.id);
      await signupCta(anonPage).click();
      await expect(anonPage).toHaveURL(/\/signup\?returnTo=/);
    });

    await test.step('complete signup with a DIFFERENT email', async () => {
      await anonPage.getByTestId('login-email').fill(wrongEmail);
      await anonPage.getByRole('button', { name: 'Continue' }).click();
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
