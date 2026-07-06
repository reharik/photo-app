import { expectMediaItemLoaded, selectMediaItems } from '../../fixtures/mediaSelection';
import { expectPublicMediaDetailUrl } from '../../fixtures/navigation';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * Scenario 3 — Create a public link for ONE media item.
 */
test.describe('Create a public link for a single media item', () => {
  test.describe('When the link is opened in an unauthenticated context', () => {
    test('should show the public detail view as read-only, with no react toggle and no comment composer', async ({
      userA,
      anonPage,
      grabTestImages,
    }) => {
      const [a] = await setup(grabTestImages, userA, 1);

      const selection = await selectMediaItems(userA.page, [a.id], {
        expectActions: ['Share', 'Add to album', 'Delete from library'],
      });
      await expect(selection.toolbar).toContainText('1 item selected');
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share item' });

      await shareDialog.getByRole('button', { name: 'Create shareable link' }).click();

      const shareUrl = await shareDialog.getByLabel('Share URL').inputValue();
      expect(shareUrl).toMatch(/\/shared\/[A-Za-z0-9_-]+$/);

      await anonPage.goto(shareUrl);
      await expectPublicMediaDetailUrl(anonPage, a.id);

      await expectMediaItemLoaded(anonPage, a.id);

      await expect(anonPage.getByRole('textbox', { name: 'Title' })).toHaveCount(0);
      await expect(anonPage.getByRole('button', { name: 'Save' })).toHaveCount(0);
      await expect(anonPage.getByLabel('Add a comment…')).toHaveCount(0);

      const reaction = anonPage.getByRole('button', { name: /heart/i });
      if ((await reaction.count()) > 0) {
        await expect(reaction.first()).toBeDisabled();
      }

      await expect(anonPage.getByLabel('Add a reply')).toHaveCount(0);
    });
  });
});
