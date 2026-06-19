import { env } from '../../fixtures/env';
import {
  extractShareInviteUrl,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded, selectMediaItems } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * Scenario 1 — Share individual media items with an email that is not a user.
 */
test.describe('Share individual items with an email that is not a user', () => {
  test.describe('When User A shares two items with a non-user email', () => {
    test('should create a public link and email it to the email', async ({
      userA,
      anonPage,
      request,
      grabTestImages,
    }) => {
      const [a, b, c] = await setup(grabTestImages, userA, 3);
      const recipientEmail = 'nonUser@email.com';

      const selection = await selectMediaItems(userA.page, [a.id, b.id], {
        toolbarVariant: 'library',
        expectActions: ['Share', 'Add to album'],
      });
      await expect(selection.toolbar).toContainText('2 photos selected');
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share 2 photos' });
      await shareDialog.getByLabel('Recipient').fill(recipientEmail);
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
