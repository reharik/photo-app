import { expect, test } from '../../fixtures/test';
import { reactToItem } from '../../routines/reactToItem';
import { setup } from '../../routines/setup';

/**
 * Scenario 5 — Comments full cycle (authenticated owner, media detail).
 */
test.describe('Comments full cycle on the media detail screen', () => {
  test.describe('When User A adds, replies to, edits, and deletes comments on an owned item', () => {
    test('should reflect each change in the comments panel', async ({
      userA,
      grabTestImages,
      uniqueSuffix,
    }) => {
      const [item] = await setup(grabTestImages, userA, 1);

      await userA.page.getByTestId(`media-tile-${item.id}`).getByRole('link').first().click();
      await expect(userA.page).toHaveURL(new RegExp(`/media/${item.id}(\\?.*)?$`));
      await expect(userA.page.getByLabel('Media viewer')).toBeVisible();
      const rootBody = `Root comment ${uniqueSuffix}`;
      const replyBody = `Reply ${uniqueSuffix}`;
      const editedReplyBody = `Reply ${uniqueSuffix} amended`;

      const composer = userA.page.getByLabel('Add a comment…');
      await composer.click();
      await composer.fill(rootBody);
      await composer.press('Control+Enter');

      const rootRow = userA.page.getByTestId('comment-row').filter({ hasText: rootBody });
      await expect(rootRow).toBeVisible();
      await reactToItem(userA.page, rootRow);

      await rootRow.hover();
      await rootRow.getByRole('button', { name: 'Reply' }).click();
      const replyComposer = userA.page.getByLabel('Add a reply');
      await expect(replyComposer).toBeVisible();
      await replyComposer.fill(replyBody);
      await replyComposer.press('Control+Enter');
      await expect(replyComposer).toBeHidden();

      const replyRow = userA.page.getByTestId('comment-row').filter({ hasText: replyBody });
      await expect(replyRow).toBeVisible();

      await replyRow.hover();
      await replyRow.getByRole('button', { name: 'Comment actions' }).click();
      await userA.page.getByRole('menuitem', { name: 'Edit' }).click();

      const editTextarea = userA.page.getByLabel('Edit comment');
      await expect(editTextarea).toBeVisible();
      await editTextarea.fill(editedReplyBody);
      await editTextarea.press('Control+Enter');
      await expect(editTextarea).toBeHidden();

      const editedReplyRow = userA.page
        .getByTestId('comment-row')
        .filter({ hasText: editedReplyBody });

      await expect(editedReplyRow).toBeVisible();

      await rootRow.hover();
      await rootRow.getByRole('button', { name: 'Comment actions' }).click();
      await userA.page.getByRole('menuitem', { name: 'Delete' }).click();

      await expect(userA.page.getByTestId('comment-row').filter({ hasText: rootBody })).toHaveCount(
        0,
      );
    });
  });
});
