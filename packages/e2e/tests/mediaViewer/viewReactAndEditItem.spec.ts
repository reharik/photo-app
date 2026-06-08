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
      await expect(userA.page.getByLabel('Media viewer')).toBeVisible();

      await reactToItem(userA.page, userA.page);

      const title = `E2E title ${uniqueSuffix}`;
      const description = `E2E description ${uniqueSuffix}`;
      const titlePrompt = userA.page.getByRole('button', { name: 'Add a title' });
      const descriptionPrompt = userA.page.getByRole('button', { name: 'Add a description' });

      await expect(titlePrompt).toBeVisible();
      await expect(descriptionPrompt).toBeVisible();

      await titlePrompt.click();
      const titleInput = userA.page.locator('#media-detail-title');
      const descriptionInput = userA.page.locator('#media-detail-description');
      await expect(titleInput).toBeVisible();
      await expect(userA.page.getByRole('button', { name: 'Save' })).toBeDisabled();

      await titleInput.fill(title);
      await descriptionInput.fill(description);
      await expect(userA.page.getByRole('button', { name: 'Save' })).toBeEnabled();

      await userA.page.getByRole('button', { name: 'Cancel' }).click();
      await expect(titlePrompt).toBeVisible();
      await expect(descriptionPrompt).toBeVisible();

      await titlePrompt.click();
      await titleInput.fill(title);
      await descriptionInput.fill(description);
      await userA.page.getByRole('button', { name: 'Save' }).click();

      await expect(userA.page.getByRole('status')).toContainText('Changes saved');
      await expect(userA.page.getByRole('button', { name: title })).toBeVisible();
      await expect(userA.page.getByRole('button', { name: description })).toBeVisible();
      await expect(userA.page.locator('#media-detail-title')).toHaveCount(0);
    });
  });
});
