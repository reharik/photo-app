import { expectMediaItemFullyDeleted } from '../../fixtures/mediaDb';
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
        toolbarVariant: 'library',
        expectActions: ['Share', 'Add to album'],
      });
      await expect(selection.toolbar).toContainText('2 items selected');

      await selection.toolbar.getByRole('button', { name: 'More actions' }).click();
      await userA.page.getByRole('menuitem', { name: 'Delete from library' }).click();
      await expect(userA.page.getByRole('dialog', { name: 'Delete from library?' })).toBeVisible();
      await userA.page.getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(userA.page.getByRole('dialog', { name: 'Delete from library?' })).toBeHidden();
      await expect(userA.page.getByText('Homeroll')).toBeVisible();

      await expect(mediaTile(userA.page, a.id)).toBeHidden();
      await expect(mediaTile(userA.page, b.id)).toBeHidden();
      await expect(selection.toolbar).toBeHidden();

      // A hidden tile is also what a cache eviction or a status flip off READY
      // produces. "Deleted properly" is a claim about rows, so check the rows.
      await expectMediaItemFullyDeleted(a.id);
      await expectMediaItemFullyDeleted(b.id);
    });
  });
});
