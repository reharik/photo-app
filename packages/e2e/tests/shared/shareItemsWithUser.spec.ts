import { loginViaUi } from '../../fixtures/auth';
import {
  expectMediaTileNotSelectable,
  mediaTile,
  selectMediaItems,
} from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { reactToItem } from '../../routines/reactToItem';
import { setup } from '../../routines/setup';

/**
 * Scenario 1 — Share individual media items with an existing user.
 */
test.describe('Share individual items with an existing user', () => {
  test.describe('When User A shares two items with User B', () => {
    test('should let User B see them in Shared-with-me with only the granted operations', async ({
      userA,
      userB,
      grabTestImages,
      uniqueSuffix,
    }) => {
      const [a, b, c] = await setup(grabTestImages, userA, 3);

      const selection = await selectMediaItems(userA.page, [a.id, b.id], {
        expectActions: ['Share', 'Add to album', 'Delete from library'],
      });
      await expect(selection.toolbar).toContainText('2 selected');
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share 2 photos' });
      await shareDialog.getByLabel('Recipient').fill(userB.user.email);
      await shareDialog.getByRole('button', { name: 'Share with user' }).click();
      await expect(shareDialog).toBeHidden();

      await loginViaUi(userB.page, userB.user);
      await userB.page.goto('/shared-with-me');

      const itemA = mediaTile(userB.page, a.id);
      await expect(itemA).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${b.id}`)).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${c.id}`)).toHaveCount(0);

      await reactToItem(userB.page, itemA);

      await userB.page.getByTestId(`media-tile-${a.id}`).getByRole('link').first().click();
      await expect(userB.page).toHaveURL(new RegExp(`/media/${a.id}`));

      const rootBody = `Root comment ${uniqueSuffix}`;

      const composer = userA.page.getByLabel('Add a comment…');
      await composer.click();
      await composer.fill(rootBody);
      await composer.press('Control+Enter');

      const rootRow = userA.page.getByTestId('comment-row').filter({ hasText: rootBody });
      await expect(rootRow).toBeVisible();

      await reactToItem(userB.page, rootRow);

      await userB.page.goto('/shared-with-me');
      await expectMediaTileNotSelectable(userB.page, a.id);
    });
  });
});
