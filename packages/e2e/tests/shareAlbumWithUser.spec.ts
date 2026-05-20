import { addMediaItemsToNewAlbum } from '../fixtures/album';
import { loginViaApi } from '../fixtures/auth';
import { loginAndUploadMedia } from '../fixtures/upload';
import { expect, test } from '../fixtures/test';

/**
 * Scenario 2 — Share an album with an existing user.
 */
test.describe('Share an album with an existing user', () => {
  test.describe('When User A shares a multi-item album with User B', () => {
    test('should let User B see the album items in Shared-with-me with only the granted operations', async ({
      userA,
      userB,
      uniqueSuffix,
    }) => {
      const albumTitle = `e2e-share-album-${uniqueSuffix}`;
      const [itemOne, itemTwo] = await loginAndUploadMedia(
        userA.page,
        userA.context,
        userA.user,
        [
          `e2e-album-one-${uniqueSuffix}.jpg`,
          `e2e-album-two-${uniqueSuffix}.jpg`,
        ],
      );

      await addMediaItemsToNewAlbum(userA.page, albumTitle, [itemOne.id, itemTwo.id]);

      await userA.page.getByRole('button', { name: 'Share album' }).click();
      const shareDialog = userA.page.getByRole('dialog', { name: 'Share album' });
      await shareDialog.getByLabel('Recipient').fill(userB.user.email);
      await shareDialog.getByRole('button', { name: 'Share with user' }).click();
      await expect(shareDialog).toBeHidden();

      await loginViaApi(userB.context, userB.user);
      await userB.page.goto('/shared-with-me');

      await expect(userB.page.getByTestId(`media-tile-${itemOne.id}`)).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${itemTwo.id}`)).toBeVisible();

      await userB.page.getByTestId(`media-tile-${itemOne.id}`).getByRole('link').first().click();
      await expect(userB.page).toHaveURL(new RegExp(`/media/${itemOne.id}(\\?.*)?$`));

      await expect(userB.page.getByLabel('Add a comment…')).toHaveCount(0);
      await expect(userB.page.getByRole('button', { name: 'Save' })).toHaveCount(0);
      await expect(userB.page.getByRole('button', { name: 'Share' })).toHaveCount(0);

      await userB.page.goto('/albums');
      await expect(userB.page.getByRole('heading', { name: albumTitle })).toHaveCount(0);
    });
  });
});
