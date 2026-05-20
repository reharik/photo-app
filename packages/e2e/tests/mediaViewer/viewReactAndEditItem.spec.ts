import { expect, test } from '../../fixtures/test';
import { reactToItem } from '../../routines/reactToItem';
import { setup } from '../../routines/setup';

test.describe('Media Viewer', () => {
  test.describe('When viewing an individual item', () => {
    test('should be able to react and edit the item', async ({
      userA,
      grabTestImages,
      uniqueSuffix,
    }) => {
      const [item] = await setup(grabTestImages, userA, 1);

      await userA.page.getByTestId(`media-tile-${item.id}`).getByRole('link').first().click();
      await expect(userA.page).toHaveURL(new RegExp(`/media/${item.id}(\\?.*)?$`));
      await expect(userA.page.getByRole('heading', { name: 'Details' })).toBeVisible();

      await reactToItem(userA.page, userA.page.getByLabel('Media viewer'));

      const title = `E2E title ${uniqueSuffix}`;
      const description = `E2E description ${uniqueSuffix}`;
      const titleRow = userA.page.getByRole('button', { name: 'Title Not set' });
      const descriptionRow = userA.page.getByRole('button', { name: 'Description Not set' });

      await expect(titleRow).toBeVisible();
      await expect(descriptionRow).toBeVisible();

      await titleRow.click();
      const titleInput = userA.page.locator('#media-detail-title');
      const descriptionInput = userA.page.locator('#media-detail-description');
      await expect(titleInput).toBeVisible();
      await expect(userA.page.getByRole('button', { name: 'Save' })).toBeDisabled();

      await titleInput.fill(title);
      await descriptionInput.fill(description);
      await expect(userA.page.getByRole('button', { name: 'Save' })).toBeEnabled();

      await userA.page.getByRole('button', { name: 'Cancel' }).click();
      await expect(titleRow).toBeVisible();
      await expect(descriptionRow).toBeVisible();

      await titleRow.click();
      await titleInput.fill(title);
      await descriptionInput.fill(description);
      await userA.page.getByRole('button', { name: 'Save' }).click();

      await expect(userA.page.getByRole('status')).toContainText('Changes saved');
      await expect(userA.page.getByRole('button', { name: `Title ${title}` })).toBeVisible();
      await expect(
        userA.page.getByRole('button', { name: `Description ${description}` }),
      ).toBeVisible();
      await expect(userA.page.locator('#media-detail-title')).toHaveCount(0);
    });
  });
});
