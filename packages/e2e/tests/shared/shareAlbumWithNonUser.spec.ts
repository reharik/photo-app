import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  removeMediaItemsFromAlbum,
} from '../../fixtures/album';
import { env } from '../../fixtures/env';
import {
  extractShareInviteUrl,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded } from '../../fixtures/mediaSelection';
import {
  buildPublicMediaDetailUrl,
  expectPublicMediaUnavailable,
} from '../../fixtures/navigation';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * Scenario 2 — Share an album with a non-user email.
 */
test.describe('Share an album with an email that is not a user', () => {
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
      const recipientEmail = 'nonUser@email.com';

      await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id, b.id]);

      await userA.page.getByRole('button', { name: 'Share album' }).click();
      const shareDialog = userA.page.getByRole('dialog', { name: 'Share album' });
      await shareDialog.getByRole('combobox', { name: 'Recipients' }).fill(recipientEmail);
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
    });
  });
});
