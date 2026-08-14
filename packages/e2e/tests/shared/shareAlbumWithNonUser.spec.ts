import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  removeMediaItemsFromAlbum,
} from '../../fixtures/album';
import { cleanupRecipientByEmail } from '../../fixtures/cleanup';
import { env } from '../../fixtures/env';
import {
  countLocalStackSesMessages,
  extractShareInviteUrl,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded } from '../../fixtures/mediaSelection';
import { buildPublicMediaDetailUrl, expectPublicMediaUnavailable } from '../../fixtures/navigation';
import {
  closeShareAlbumModal,
  commitShareEmail,
  openShareAlbumModal,
  shareAlbumEmailInput,
} from '../../fixtures/shareAlbumModal';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

// Per-test unique (uniqueSuffix embeds the worker index): a fixed address here
// would let concurrent tests delete each other's in-flight shadow user and match
// each other's invite mail in the shared SES store. Must stay lowercase — the
// share flow creates a `user` row from it and email has a lowercase CHECK.
const recipientEmailFor = (uniqueSuffix: string): string =>
  `nonuser-album-${uniqueSuffix}@example.test`;

/**
 * Scenario 2 — Share an album with a non-user email.
 */
test.describe('Share an album with an email that is not a user', () => {
  test.afterEach(async ({ uniqueSuffix }) => {
    // The recipient email is unique per test, so this isn't defending against
    // cross-spec reuse — it stops the shadow user (and its pending grant rows)
    // this test minted from accumulating in the shared dev DB run after run.
    await cleanupRecipientByEmail(recipientEmailFor(uniqueSuffix));
  });

  test.describe('When User A shares a multi-item album with User X', () => {
    test('should create a public link and email it to the email', async ({
      userA,
      anonPage,
      request,
      grabTestImages,
      uniqueSuffix,
    }) => {
      const [a, b, c, d] = await setup(grabTestImages, userA, 4);

      const albumTitle = `e2e-share-album-${uniqueSuffix}`;
      const recipientEmail = recipientEmailFor(uniqueSuffix);

      await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id, b.id]);

      const shareDialog = await openShareAlbumModal(userA.page);
      // Only mail sent after this share counts, without wiping the shared SES
      // store. Captured BEFORE the commit: on the one-surface modal the share
      // fires the moment Enter lands.
      const sesBaseline = await countLocalStackSesMessages(request);
      await commitShareEmail(shareDialog, recipientEmail);
      await closeShareAlbumModal(userA.page);

      // A non-user album share sends the recipient TWO emails: a linkless "…shared an album
      // with you" notification and the guest invite ("…sent you photos") carrying the public
      // /shared/{token} URL. Order isn't guaranteed, so match on the message that actually
      // yields a share URL rather than the first one addressed to the recipient.
      let resolvedShareUrl = '';
      await expect
        .poll(
          async () => {
            const messages = (await retrieveLocalStackSesMessages(request)).slice(sesBaseline);
            for (const message of messages) {
              if (!findSesMessageForRecipient([message], recipientEmail)) {
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
      const shareUrl = resolvedShareUrl;

      await anonPage.goto(shareUrl);

      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      await expect(anonPage.getByTestId(`media-tile-${c.id}`)).toHaveCount(0);
      await expect(anonPage.getByTestId(`media-tile-${d.id}`)).toHaveCount(0);

      await addMediaItemsToExistingAlbum(userA.page, [c.id]);

      await anonPage.reload();
      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      await expectMediaItemLoaded(anonPage, c.id);
      await expect(anonPage.getByTestId(`media-tile-${d.id}`)).toHaveCount(0);

      await removeMediaItemsFromAlbum(userA.page, [c.id]);

      await anonPage.reload();
      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      await expect(anonPage.getByTestId(`media-tile-${c.id}`)).toHaveCount(0);

      await anonPage.goto(buildPublicMediaDetailUrl(shareUrl, c.id));
      await expectPublicMediaUnavailable(anonPage);

      await test.step('USER A: shared email is saved as a recipient suggestion', async () => {
        // Sharing with a non-user saves the email as one of User A's share contacts,
        // so it should surface as a suggestion the next time A shares. The catalog
        // filters out people already in the open album's shared-with list, so the
        // check needs a FRESH album where the contact is genuinely suggestable.
        await userA.page.goto('/media');
        await addMediaItemsToNewAlbum(userA.page, `${albumTitle}-2`, [d.id]);
        const reopenedDialog = await openShareAlbumModal(userA.page);
        await shareAlbumEmailInput(reopenedDialog).fill(recipientEmail.toLowerCase());
        // The suggestion popover renders in a portal at the document body (not inside the
        // dialog), so query options at page level. Its accessible name also includes the
        // row's "Remove from saved contacts" control, so match on text content.
        await expect(
          userA.page.getByRole('option').filter({ hasText: recipientEmail.toLowerCase() }),
        ).toBeVisible();
      });
    });
  });
});
