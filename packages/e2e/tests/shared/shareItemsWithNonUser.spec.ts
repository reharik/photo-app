import { cleanupRecipientByEmail } from '../../fixtures/cleanup';
import { env } from '../../fixtures/env';
import {
  clearLocalStackSesMessages,
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
    // Reset the shadow user (cascades away any un-sent pending notification) AND drain
    // SES: both non-user specs reuse RECIPIENT_EMAIL, and the poll below matches the
    // first email to that address, so a stale invite from an earlier spec would send the
    // anon page to a since-cleaned-up token ("This album isn't available").
    await cleanupRecipientByEmail(RECIPIENT_EMAIL);
    await clearLocalStackSesMessages();
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
      await shareDialog.getByRole('button', { name: 'Share with user' }).click();
      await expect(shareDialog).toBeHidden();

      let resolvedShareUrl = '';
      await expect
        .poll(
          async () => {
            const messages = await retrieveLocalStackSesMessages(request);
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
