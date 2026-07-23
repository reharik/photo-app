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

      let resolvedShareUrl = '';
      await expect
        .poll(
          async () => {
            const messages = (await retrieveLocalStackSesMessages(request)).slice(sesBaseline);
            const message = findSesMessageForRecipient(messages, recipientEmail);
            if (!message) {
              return false;
            }
            resolvedShareUrl = extractShareInviteUrl(message, env.webBaseUrl) ?? '';
            return resolvedShareUrl.length > 0;
          },
          { timeout: 30_000 },
        )
        .toBe(true);
      const shareUrl = resolvedShareUrl;

      await anonPage.goto(shareUrl);

      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      await expect(anonPage.getByTestId(`media-tile-${c.id}`)).toHaveCount(0);
    });
  });
});
