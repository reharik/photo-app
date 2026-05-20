import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  setAlbumCover,
} from '../fixtures/album';
import { selectMediaItems } from '../fixtures/mediaSelection';
import { expect, test } from '../fixtures/test';
import { setup } from '../routines/setup';

test.describe('Foundation tests', () => {
  test.describe('When starts with a fresh database', () => {
    test('should be able to login and upload media', async ({ userA, grabTestImages }) => {
      const [a, b, c, d, e] = await setup(grabTestImages, userA, 5);

      const selection = await selectMediaItems(userA.page, [a.id, b.id], {
        expectActions: ['Share', 'Add to album', 'Delete from library'],
      });
      await expect(selection.toolbar).toContainText('2 selected');

      await addMediaItemsToNewAlbum(userA.page, 'lovely_new_album', [a.id, b.id], {
        alreadySelected: true,
      });

      await addMediaItemsToExistingAlbum(userA.page, [c.id, d.id, e.id]);

      await setAlbumCover(userA.page, c.id);
    });
  });
});
