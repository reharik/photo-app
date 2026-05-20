import { selectMediaItems } from '../fixtures/mediaSelection';
import {
  expectMediaTileVisible,
  expectPublicMediaDetailUrl,
} from '../fixtures/navigation';
import { loginAndUploadMedia } from '../fixtures/upload';
import { expect, test } from '../fixtures/test';

/**
 * Scenario 4 — Create a public link for SEVERAL media items.
 */
test.describe('Create a public link for multiple media items', () => {
  test.describe('When the link is opened in an unauthenticated context', () => {
    test('should show the public album grid, allow prev/next navigation in detail, and stay read-only', async ({
      userA,
      anonPage,
      uniqueSuffix,
    }) => {
      const uploaded = await loginAndUploadMedia(
        userA.page,
        userA.context,
        userA.user,
        [
          `e2e-pub-multi-one-${uniqueSuffix}.jpg`,
          `e2e-pub-multi-two-${uniqueSuffix}.jpg`,
          `e2e-pub-multi-three-${uniqueSuffix}.jpg`,
        ],
      );
      const [one, two, three] = uploaded;

      const selection = await selectMediaItems(
        userA.page,
        [one.id, two.id, three.id],
        { expectActions: ['Share'] },
      );
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share 3 photos' });
      await shareDialog.getByRole('button', { name: 'Create shareable link' }).click();

      const shareUrl = await shareDialog.getByLabel('Share URL').inputValue();
      expect(shareUrl).toMatch(/\/shared\/[A-Za-z0-9_-]+$/);

      await anonPage.goto(shareUrl);

      await expectMediaTileVisible(anonPage, one.id);
      await expectMediaTileVisible(anonPage, two.id);
      await expectMediaTileVisible(anonPage, three.id);

      const tileOne = anonPage.getByTestId(`media-tile-${one.id}`);
      await tileOne.getByRole('link').first().click();
      await expectPublicMediaDetailUrl(anonPage, one.id);

      const nextBtn = anonPage.getByRole('button', { name: 'Next image' });
      const prevBtn = anonPage.getByRole('button', { name: 'Previous image' });

      await nextBtn.click();
      await expectPublicMediaDetailUrl(anonPage, two.id);
      await nextBtn.click();
      await expectPublicMediaDetailUrl(anonPage, three.id);
      await prevBtn.click();
      await expectPublicMediaDetailUrl(anonPage, two.id);

      await expect(anonPage.getByLabel('Add a comment…')).toHaveCount(0);
      await expect(anonPage.getByLabel('Add a reply')).toHaveCount(0);
      await expect(anonPage.getByRole('textbox', { name: 'Title' })).toHaveCount(0);
      await expect(anonPage.getByRole('button', { name: 'Save' })).toHaveCount(0);
      await expect(anonPage.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    });
  });
});
