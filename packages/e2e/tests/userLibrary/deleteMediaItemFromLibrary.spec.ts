import { mediaTile, selectMediaItems } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

test.describe('User Library', () => {
  test.describe('When user deletes item from library', () => {
    test('should be presented with a confirmation modal and items should be deleted properly', async ({
      userA,
      grabTestImages,
    }) => {
      // setup
      const [a, b] = await setup(grabTestImages, userA, 2);

      // end setup
      const selection = await selectMediaItems(userA.page, [a.id, b.id], {
        expectActions: ['Share', 'Add to album', 'Delete from library'],
      });
      await expect(selection.toolbar).toContainText('2 selected');

      await selection.clickAction('Delete from library');
      await expect(userA.page.getByRole('dialog', { name: 'Delete from library?' })).toBeVisible();
      await userA.page.getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(userA.page.getByRole('dialog', { name: 'Delete from library?' })).toBeHidden();
      await expect(userA.page.getByText('Recent Media')).toBeVisible();

      await expect(mediaTile(userA.page, a.id)).toBeHidden();
      await expect(mediaTile(userA.page, b.id)).toBeHidden();
      await expect(selection.toolbar).toBeHidden();
    });
  });
});
