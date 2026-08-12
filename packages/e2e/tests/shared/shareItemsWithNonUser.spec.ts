import { cleanupRecipientByEmail } from '../../fixtures/cleanup';
import { env } from '../../fixtures/env';
import {
  countLocalStackSesMessages,
  extractShareInviteUrl,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded, selectMediaItems } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { sharedItemsAlbumTitle } from '../../routines/openSharedAlbum';
import { setup } from '../../routines/setup';

// Shared with the album non-user spec; both reuse this fixed address, so each resets
// the shadow user it leaves behind (see cleanupRecipientByEmail) before running.
const RECIPIENT_EMAIL = 'nonUser@email.com';

/**
 * Scenario 1 — Share individual media items with an email that is not a user.
 */
test.describe('Share individual items with an email that is not a user', () => {
  test.beforeEach(async () => {
    // Reset the shadow user, which cascades away any un-sent pending notification so no
    // stale invite to RECIPIENT_EMAIL can still be delivered. Both non-user specs reuse
    // this address; the poll below matches the first email to it AFTER a per-test
    // baseline (see sesBaseline), so already-delivered invites are ignored without
    // deleting them.
    await cleanupRecipientByEmail(RECIPIENT_EMAIL);
  });

  test.describe('When User A shares two items with a non-user email', () => {
    test('should create a public link and email it to the email', async ({
      userA,
      anonPage,
      request,
      grabTestImages,
    }) => {
      const [a, b, c] = await setup(grabTestImages, userA, 3);
      const recipientEmail = RECIPIENT_EMAIL;

      const selection = await selectMediaItems(userA.page, [a.id, b.id], {
        toolbarVariant: 'library',
        expectActions: ['Share', 'Add to album'],
      });
      await expect(selection.toolbar).toContainText('2 items selected');
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share 2 items' });
      const recipientInput = shareDialog.getByRole('combobox', { name: 'Recipients' });
      await recipientInput.fill(recipientEmail);
      // Commit the typed email to a recipient pill before submitting.
      await recipientInput.press('Enter');
      await expect(
        shareDialog.getByRole('button', { name: `Remove ${recipientEmail.toLowerCase()}` }),
      ).toBeVisible();
      // Only mail sent after this share counts — ignores any earlier invite to the
      // reused RECIPIENT_EMAIL without wiping the SES store.
      const sesBaseline = await countLocalStackSesMessages(request);
      await shareDialog.getByRole('button', { name: 'Share with user' }).click();
      await expect(shareDialog).toBeHidden();

      // Sharing loose items now wraps them in a shadow album, so this path sends the
      // recipient the SAME two emails an album share does: a linkless activity digest
      // and the guest invite carrying the /shared/{token} URL. The digest usually lands
      // first, so match on the message that actually yields a share URL rather than the
      // first one addressed to the recipient (mirrors shareAlbumWithNonUser.spec.ts).
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

      // The link resolves to the generated shadow album that wraps the shared items —
      // assert the title so this pins the CORRECT album, not merely "some album whose
      // grid happens to contain a and b".
      await expect(
        anonPage.getByRole('heading', { name: sharedItemsAlbumTitle(userA.user) }),
      ).toBeVisible();

      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      await expect(anonPage.getByTestId(`media-tile-${c.id}`)).toHaveCount(0);
    });
  });
});
