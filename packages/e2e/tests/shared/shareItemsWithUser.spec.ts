import { loginViaUi } from '../../fixtures/auth';
import {
  countLocalStackSesMessages,
  findSesMessageForRecipient,
  retrieveLocalStackSesMessages,
} from '../../fixtures/localstackSes';
import {
  expectMediaItemLoaded,
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
      request,
    }) => {
      const [a, b, c] = await setup(grabTestImages, userA, 3);

      const selection = await selectMediaItems(userA.page, [a.id, b.id], {
        toolbarVariant: 'library',
        expectActions: ['Share', 'Add to album'],
      });
      await expect(selection.toolbar).toContainText('2 items selected');
      await selection.clickAction('Share');

      const shareDialog = userA.page.getByRole('dialog', { name: 'Share 2 items' });
      const recipientInput = shareDialog.getByRole('combobox', { name: 'Recipients' });
      await recipientInput.fill(userB.user.email);
      // The MultiCombobox only counts a recipient once it's committed to a pill; Enter
      // commits the typed email.
      await recipientInput.press('Enter');
      await expect(
        shareDialog.getByRole('button', { name: `Remove ${userB.user.email.toLowerCase()}` }),
      ).toBeVisible();
      // Baseline SES so the email assertion below only sees the message this share
      // produces, not a leftover from an earlier test — without wiping the store.
      const sesBaseline = await countLocalStackSesMessages(request);
      await shareDialog.getByRole('button', { name: 'Share with user' }).click();
      await expect(shareDialog).toBeHidden();

      await test.step('USER B: is emailed about the shared items', async () => {
        // Item-sharing with an existing user should notify them by email. This test
        // never sends any other email to User B, so a recipient match is sufficient.
        // TODO: tighten the match to the item-share template's distinctive copy once
        // that template exists (see NOTIFICATION_ROUTING.itemShared, currently null).
        await expect
          .poll(
            async () => {
              const messages = (await retrieveLocalStackSesMessages(request)).slice(sesBaseline);
              return Boolean(findSesMessageForRecipient(messages, userB.user.email));
            },
            { timeout: 30_000 },
          )
          .toBe(true);
      });

      await loginViaUi(userB.page, userB.user);

      await test.step('USER B: sees the unseen-activity dot for the newly shared items', async () => {
        // The share should light the aggregate unseen-activity dot on the "Shared" nav
        // item (role=status, aria-label "Unseen activity") before B opens the items.
        await expect(userB.page.getByRole('status', { name: 'Unseen activity' })).toBeVisible();
      });

      await userB.page.goto('/shared/items');

      const itemA = mediaTile(userB.page, a.id);
      await expect(itemA).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${b.id}`)).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${c.id}`)).toHaveCount(0);

      await expectMediaItemLoaded(userB.page, a.id);
      await expectMediaItemLoaded(userB.page, b.id);

      await userB.page.getByTestId(`media-tile-${a.id}`).getByRole('link').first().click();
      await expect(userB.page).toHaveURL(new RegExp(`/media/${a.id}`));
      await reactToItem(userB.page, userB.page.locator('body'));

      const rootBody = `Root comment ${uniqueSuffix}`;

      const composer = userB.page.getByLabel('Add a comment…');
      await composer.click();
      await composer.fill(rootBody);
      await composer.press('Control+Enter');

      const rootRow = userB.page.getByTestId('comment-row').filter({ hasText: rootBody });
      await expect(rootRow).toBeVisible();

      await reactToItem(userB.page, rootRow);

      await userB.page.goto('/shared-with-me');
      await expectMediaTileNotSelectable(userB.page, a.id);
    });
  });
});
