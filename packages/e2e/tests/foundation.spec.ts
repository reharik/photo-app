import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  setAlbumCover,
} from '../fixtures/album';
import { loginViaUi } from '../fixtures/auth';
import { selectMediaItems } from '../fixtures/mediaSelection';
import { expect, test } from '../fixtures/test';
import { expectLibraryPage, uploadMediaViaUi } from '../fixtures/upload';

test.describe('Foundation tests', () => {
  test.describe('When starts with a fresh database', () => {
    test('should be able to login and upload media', async ({ userA, grabTestImages }) => {
      // Deliberately logs in through the visible form rather than the shared
      // `setup()` routine (which uses `loginViaApi` for speed): this spec is
      // the canary that catches `loginViaApi` drifting from what the real
      // login form does. Keep it on the UI path.
      await loginViaUi(userA.page, userA.user);
      await userA.page.goto('/media');
      await expectLibraryPage(userA.page);
      const [a, b, c, d, e] = await uploadMediaViaUi(userA.page, grabTestImages(5));

      const selection = await selectMediaItems(userA.page, [a.id, b.id], {
        toolbarVariant: 'library',
        expectActions: ['Share', 'Add to album'],
      });
      await expect(selection.toolbar).toContainText('2 items selected');

      await addMediaItemsToNewAlbum(userA.page, 'lovely_new_album', [a.id, b.id], {
        alreadySelected: true,
      });

      await addMediaItemsToExistingAlbum(userA.page, [c.id, d.id, e.id]);

      await setAlbumCover(userA.page, c.id);
    });
  });
});
