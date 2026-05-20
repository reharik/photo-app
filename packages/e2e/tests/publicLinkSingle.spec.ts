import { selectMediaItems } from '../fixtures/mediaSelection';
import { expectPublicMediaDetailUrl } from '../fixtures/navigation';
import { loginAndUploadMedia } from '../fixtures/upload';
import { expect, test } from '../fixtures/test';

/**
 * Scenario 3 — Create a public link for ONE media item.
 */
test.describe('Create a public link for a single media item', () => {
  test.describe('When the link is opened in an unauthenticated context', () => {
    test('should show the public detail view as read-only, with no react toggle and no comment composer', async ({
      userA,
      anonPage,
      uniqueSuffix,
    }) => {
      const fileName = `e2e-public-single-${uniqueSuffix}.jpg`;
      const [item] = await loginAndUploadMedia(
        userA.page,
        userA.context,
        userA.user,
        [fileName],
      );

      const selection = await selectMediaItems(userA.page, [item.id], {
        expectActions: ['Share'],
      });
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share photo' });
      await expect(shareDialog).toBeVisible();
      await shareDialog.getByRole('button', { name: 'Create shareable link' }).click();

      const shareUrl = await shareDialog.getByLabel('Share URL').inputValue();
      expect(shareUrl).toMatch(/\/shared\/[A-Za-z0-9_-]+$/);

      await anonPage.goto(shareUrl);
      await expectPublicMediaDetailUrl(anonPage, item.id);

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
