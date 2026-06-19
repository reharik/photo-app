import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  expectAlbumGalleryItems,
  removeMediaItemsFromAlbum,
} from '../../fixtures/album';
import { loginViaUi } from '../../fixtures/auth';
import { expectMediaItemLoaded, mediaTile } from '../../fixtures/mediaSelection';
import { expectAuthenticatedMediaDetailInaccessible } from '../../fixtures/navigation';
import { expect, test } from '../../fixtures/test';
import { reactToItem } from '../../routines/reactToItem';
import { setup } from '../../routines/setup';

/**
 * Scenario 2 — Share an album with an existing user.
 */
test.describe('Share an album with an existing user', () => {
  test.describe('When User A shares a multi-item album with User B', () => {
    test('should let User B see the album items in Shared-with-me with only the granted operations', async ({
      userA,
      userB,
      grabTestImages,
      uniqueSuffix,
    }) => {
      const [a, b, c, d] = await setup(grabTestImages, userA, 4);

      const albumTitle = `e2e-share-album-${uniqueSuffix}`;

      const { albumId } = await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id, b.id]);

      await userA.page.getByRole('button', { name: 'Share album' }).click();
      const shareDialog = userA.page.getByRole('dialog', { name: 'Share album' });
      await shareDialog.getByLabel('Recipient').fill(userB.user.email);
      await shareDialog.getByRole('button', { name: 'Share with user' }).click();
      await expect(shareDialog).toBeHidden();

      await loginViaUi(userB.page, userB.user);
      await userB.page.goto(`/albums/${albumId}`);
      await expect(userB.page.getByRole('heading', { name: albumTitle })).toBeVisible();

      const itemA = mediaTile(userB.page, a.id);
      await expect(itemA).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${b.id}`)).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${c.id}`)).toHaveCount(0);
      await expect(userB.page.getByTestId(`media-tile-${d.id}`)).toHaveCount(0);
      await expectMediaItemLoaded(userB.page, a.id);
      await expectMediaItemLoaded(userB.page, b.id);
      await reactToItem(userB.page, itemA);

      await userB.page.getByTestId(`media-tile-${a.id}`).getByRole('link').first().click();
      await expect(userB.page).toHaveURL(new RegExp(`/media/${a.id}`));

      const rootBody = `Root comment ${uniqueSuffix}`;

      const composer = userB.page.getByLabel('Add a comment…');
      await composer.click();
      await composer.fill(rootBody);
      await composer.press('Control+Enter');

      const rootRow = userB.page.getByTestId('comment-row').filter({ hasText: rootBody });
      await expect(rootRow).toBeVisible();

      await reactToItem(userB.page, rootRow);

      await userB.page.goto(`/albums/${albumId}`);
      await expect(userB.page.getByRole('heading', { name: albumTitle })).toBeVisible();

      await addMediaItemsToExistingAlbum(userA.page, [c.id]);

      await expectAlbumGalleryItems(userA.page, {
        albumTitle,
        loadedIds: [a.id, b.id, c.id],
        absentIds: [d.id],
      });

      await userB.page.reload();
      await expectAlbumGalleryItems(userB.page, {
        albumTitle,
        loadedIds: [a.id, b.id, c.id],
        absentIds: [d.id],
      });

      await removeMediaItemsFromAlbum(userA.page, [c.id]);

      await expectAlbumGalleryItems(userA.page, {
        albumTitle,
        loadedIds: [a.id, b.id],
        absentIds: [c.id],
      });

      await userB.page.reload();
      await expectAlbumGalleryItems(userB.page, {
        albumTitle,
        loadedIds: [a.id, b.id],
        absentIds: [c.id],
      });

      await expectAuthenticatedMediaDetailInaccessible(userB.page, c.id);

      await userB.page.goto('/albums');
    });
  });
});
