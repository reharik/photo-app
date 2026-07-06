import { selectMediaItems } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';
import { setup } from '../../routines/setup';

/**
 * Recipient commit-via-Enter coverage.
 *
 * Every share spec (share{Album,Items}With{,Non}User) commits the recipient by
 * pressing Enter before submitting: relying on commit-on-blur (fill + submit with no
 * Enter) is unreliable, because a matching saved-contact suggestion opens a popover
 * that intercepts the submit click. This spec locks the explicit Enter-commit +
 * tag-render path: typing an email and pressing Enter must turn it into a removable
 * pill before submitting.
 */
test.describe('Share individual items — recipient commit via Enter', () => {
  test('Enter turns the typed email into a pill, then the share submits', async ({
    userA,
    userB,
    grabTestImages,
  }) => {
    const [a, b] = await setup(grabTestImages, userA, 2);

    const selection = await selectMediaItems(userA.page, [a.id, b.id], {
      toolbarVariant: 'library',
      expectActions: ['Share', 'Add to album'],
    });
    await expect(selection.toolbar).toContainText('2 items selected');
    await selection.clickAction('Share');

    const shareDialog = userA.page.getByRole('dialog', { name: 'Share 2 items' });
    // The pill display is the normalized (lowercased) recipient handle.
    const recipient = userB.user.email.toLowerCase();

    const recipientInput = shareDialog.getByRole('combobox', { name: 'Recipients' });
    await recipientInput.fill(recipient);
    await recipientInput.press('Enter');

    // Enter committed the typed email as a removable tag (not just left in the input).
    await expect(shareDialog.getByRole('button', { name: `Remove ${recipient}` })).toBeVisible();

    await shareDialog.getByRole('button', { name: 'Share with user' }).click();
    await expect(shareDialog).toBeHidden();
  });
});
