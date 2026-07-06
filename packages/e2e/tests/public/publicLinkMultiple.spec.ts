import { expectMediaItemLoaded, selectMediaItems } from '../../fixtures/mediaSelection';
import { expectPublicMediaDetailUrl } from '../../fixtures/navigation';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * Scenario 4 — Create a public link for SEVERAL media items.
 */
test.describe('Create a public link for multiple media items', () => {
  test.describe('When the link is opened in an unauthenticated context', () => {
    test('should show the public album grid, allow prev/next navigation in detail, and stay read-only', async ({
      userA,
      anonPage,
      grabTestImages,
    }) => {
      const [a, b, c] = await setup(grabTestImages, userA, 3);

      const selection = await selectMediaItems(userA.page, [a.id, b.id, c.id], {
        expectActions: ['Share', 'Add to album', 'Delete from library'],
      });
      await expect(selection.toolbar).toContainText('3 items selected');
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share 3 items' });
      await shareDialog.getByRole('button', { name: 'Create shareable link' }).click();

      const shareUrl = await shareDialog.getByLabel('Share URL').inputValue();
      expect(shareUrl).toMatch(/\/shared\/[A-Za-z0-9_-]+$/);

      await anonPage.goto(shareUrl);

      await expectMediaItemLoaded(anonPage, a.id);
      await expectMediaItemLoaded(anonPage, b.id);
      await expectMediaItemLoaded(anonPage, c.id);

      const tileOne = anonPage.getByTestId(`media-tile-${a.id}`);
      await tileOne.getByRole('link').first().click();
      await expectPublicMediaDetailUrl(anonPage, a.id);

      const nextBtn = anonPage.getByRole('button', { name: 'Next image' });
      const prevBtn = anonPage.getByRole('button', { name: 'Previous image' });

      await nextBtn.click();
      await expectPublicMediaDetailUrl(anonPage, b.id);
      await nextBtn.click();
      await expectPublicMediaDetailUrl(anonPage, c.id);
      await prevBtn.click();
      await expectPublicMediaDetailUrl(anonPage, b.id);

      await expect(anonPage.getByLabel('Add a comment…')).toHaveCount(0);
      await expect(anonPage.getByLabel('Add a reply')).toHaveCount(0);
      await expect(anonPage.getByRole('textbox', { name: 'Title' })).toHaveCount(0);
      await expect(anonPage.getByRole('button', { name: 'Save' })).toHaveCount(0);
      await expect(anonPage.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    });
  });
});
