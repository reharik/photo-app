import { mediaTile } from '../../fixtures/mediaSelection';
import { test } from '../../fixtures/test';
import { reactToItem } from '../../routines/reactToItem';
import { setup } from '../../routines/setup';

test.describe('User Library', () => {
  test.describe('When user reacts to an item', () => {
    test('should be able to toggle icon and see the count change', async ({
      userA,
      grabTestImages,
    }) => {
      const [a] = await setup(grabTestImages, userA, 1);
      await reactToItem(userA.page, mediaTile(userA.page, a.id));
    });
  });
});
