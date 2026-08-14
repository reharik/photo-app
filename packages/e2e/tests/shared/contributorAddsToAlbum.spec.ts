import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  expectAlbumGalleryItems,
} from '../../fixtures/album';
import { expectMediaItemLoaded } from '../../fixtures/mediaSelection';
import {
  closeShareAlbumModal,
  commitShareEmail,
  openShareAlbumModal,
} from '../../fixtures/shareAlbumModal';
import { expect, test } from '../../fixtures/test';
import { expectToast } from '../../fixtures/toast';
import { setup } from '../../routines/setup';

/**
 * The contributor capability actually being USED (RAI-79 promote flow only
 * exercises the modal): A promotes B's share to contributor, B uploads media
 * of their OWN and adds it to A's album, and the item must then be visible to
 * everyone the album reaches — the owner, and a non-member public-link viewer.
 *
 * This is the only spec where USER B owns media, which is exactly where
 * viewer-gating bugs hide: the added item flows through the album-visibility
 * predicates with an owner_id that is neither the album owner nor the viewer.
 */
test.describe('Contributor adds media to a shared album', () => {
  test('promoted contributor adds their own item; owner and link viewers see it', async ({
    userA,
    userB,
    anonPage,
    grabTestImages,
    uniqueSuffix,
  }) => {
    const [ownerItem] = await setup(grabTestImages, userA, 1);
    const albumTitle = `e2e-contrib-add-${uniqueSuffix}`;
    const { albumId } = await addMediaItemsToNewAlbum(userA.page, albumTitle, [ownerItem.id]);
    const dialog = await openShareAlbumModal(userA.page);
    await commitShareEmail(dialog, userB.user.email);

    // B uploads to their own library BEFORE being promoted — the item to
    // contribute must exist, and this also logs B in for the steps below.
    const [contributorItem] = await setup(grabTestImages, userB, 1);

    await test.step('USER B (view-only grant): sees the album but cannot add to it', async () => {
      await userB.page.goto(`/albums/${albumId}`);
      await expect(userB.page.getByRole('heading', { name: albumTitle })).toBeVisible();
      await expectMediaItemLoaded(userB.page, ownerItem.id);
      // operations gate: a grant-holder has no addItems, so the control is absent.
      await expect(userB.page.getByRole('button', { name: 'Add to album' })).toHaveCount(0);
    });

    await test.step('USER A: promote the share to contributor', async () => {
      await dialog
        .getByRole('button', { name: `Access level for ${userB.user.email.toLowerCase()}` })
        .click();
      await userA.page.getByRole('menuitem', { name: 'Contributor' }).click();
      await userA.page.getByRole('button', { name: 'Make contributor' }).click();
      await expectToast(userA.page, 'Added as a member');
      await closeShareAlbumModal(userA.page);
    });

    await test.step('USER B (contributor): adds their own item to the album', async () => {
      await userB.page.reload();
      await expect(userB.page.getByRole('button', { name: 'Add to album' })).toBeVisible();
      await addMediaItemsToExistingAlbum(userB.page, [contributorItem.id]);
    });

    await test.step('USER A: sees the contributor-added item in the album', async () => {
      await userA.page.goto(`/albums/${albumId}`);
      await expectAlbumGalleryItems(userA.page, {
        albumTitle,
        loadedIds: [ownerItem.id, contributorItem.id],
      });
    });

    await test.step('non-member link viewer: sees the contributor-added item too', async () => {
      // No third seeded user exists, so the public link is the non-member
      // perspective: the anon viewer must get the contributor-owned bytes
      // through the album's link, same as the owner-uploaded ones.
      const shareDialog = await openShareAlbumModal(userA.page);
      await shareDialog.getByRole('button', { name: 'Create a link anyone can view' }).click();
      const shareUrl = await shareDialog.getByLabel('Public link URL').inputValue();
      expect(shareUrl).toContain('/shared/');

      await anonPage.goto(shareUrl);
      await expectMediaItemLoaded(anonPage, ownerItem.id);
      await expectMediaItemLoaded(anonPage, contributorItem.id);
    });
  });
});
