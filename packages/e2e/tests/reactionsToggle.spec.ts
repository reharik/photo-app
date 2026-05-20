import { loginAndUploadMedia } from '../fixtures/upload';
import { expect, test } from '../fixtures/test';

/**
 * Scenario 6 — Reactions toggle (authenticated owner).
 */
test.describe('Reactions toggle on the media detail screen', () => {
  test.describe('When User A toggles a reaction on an owned item', () => {
    test('should switch pressed state to true on react and back to false on un-react', async ({
      userA,
      uniqueSuffix,
    }) => {
      const [item] = await loginAndUploadMedia(
        userA.page,
        userA.context,
        userA.user,
        [`e2e-reactions-${uniqueSuffix}.jpg`],
      );

      await userA.page.getByTestId(`media-tile-${item.id}`).getByRole('link').first().click();
      await expect(userA.page).toHaveURL(new RegExp(`/media/${item.id}(\\?.*)?$`));

      await expect(userA.page.getByRole('button', { pressed: false })).toHaveCount(1);

      await userA.page.getByRole('button', { pressed: false }).click();
      await expect(userA.page.getByRole('button', { pressed: true })).toHaveCount(1);

      await userA.page.getByRole('button', { pressed: true }).click();
      await expect(userA.page.getByRole('button', { pressed: false })).toHaveCount(1);
      await expect(userA.page.getByRole('button', { pressed: true })).toHaveCount(0);
    });
  });
});
