import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  expectAlbumGalleryItems,
  removeMediaItemsFromAlbum,
} from '../../fixtures/album';
import { loginViaUi } from '../../fixtures/auth';
import {
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
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
      request,
    }) => {
      const [a, b, c, d] = await setup(grabTestImages, userA, 4);

      const albumTitle = `e2e-share-album-${uniqueSuffix}`;

      const { albumId } = await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id, b.id]);
      await test.step('USER A: Share album with user', async () => {
        await userA.page.getByRole('button', { name: 'Share album' }).click();
        const shareDialog = userA.page.getByRole('dialog', { name: 'Share album' });
        const recipientInput = shareDialog.getByRole('combobox', { name: 'Recipients' });
        await recipientInput.fill(userB.user.email);
        // The MultiCombobox only counts a recipient once it's committed to a pill;
        // typed text alone leaves the recipients list empty. Enter commits it.
        await recipientInput.press('Enter');
        await expect(
          shareDialog.getByRole('button', { name: `Remove ${userB.user.email.toLowerCase()}` }),
        ).toBeVisible();
        await shareDialog.getByRole('button', { name: 'Share with user' }).click();
        await expect(shareDialog).toBeHidden();
      });
      await loginViaUi(userB.page, userB.user);
      await test.step('USER B: Go to shared album', async () => {
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
      });
      await test.step('USER B: Go to single item', async () => {
        await userB.page.getByTestId(`media-tile-${a.id}`).getByRole('link').first().click();
        await expect(userB.page).toHaveURL(new RegExp(`/media/${a.id}`));
      });
      await test.step('USER B: Create a comment', async () => {
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
      });
      await test.step('USER A: Add item to shared album', async () => {
        await addMediaItemsToExistingAlbum(userA.page, [c.id]);

        await expectAlbumGalleryItems(userA.page, {
          albumTitle,
          loadedIds: [a.id, b.id, c.id],
          absentIds: [d.id],
        });
      });
      await test.step('USER B: Sees unseen-activity dot for the new item', async () => {
        // Land on a non-album page: opening the album marks its activity seen and
        // clears the dot, so the flag must be checked before re-opening it. A's add
        // published the unseen-activity row post-commit, so a fresh load reflects it.
        await userB.page.goto('/albums');
        await expect(userB.page.getByRole('status', { name: 'Unseen activity' })).toBeVisible();
      });
      await test.step('USER B: View new items', async () => {
        await userB.page.goto(`/albums/${albumId}`);
        await expectAlbumGalleryItems(userB.page, {
          albumTitle,
          loadedIds: [a.id, b.id, c.id],
          absentIds: [d.id],
        });

        await expect
          .poll(
            async () => {
              const messages = await retrieveLocalStackSesMessages(request);
              // Matches the recipient AND the "New album activity" body, so the earlier
              // share-invite email to the same user doesn't satisfy the poll.
              return Boolean(
                findSesMessageForRecipient(messages, userB.user.email, 'New activity'),
              );
            },
            { timeout: 30_000 },
          )
          .toBe(true);
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
