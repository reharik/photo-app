import { Locator } from '@playwright/test';
import {
  addMediaItemsToExistingAlbum,
  addMediaItemsToNewAlbum,
  expectAlbumGalleryItems,
} from '../../fixtures/album';
import { loginViaUi } from '../../fixtures/auth';
import {
  retrieveLocalStackSesMessages,
  sesMessageBodyIncludes,
} from '../../fixtures/localstackSes';
import { expectMediaItemLoaded, mediaTile } from '../../fixtures/mediaSelection';
import { expect, test } from '../../fixtures/test';

import { setup } from '../../routines/setup';

/**
 * Leaves a *persistent* reaction (unlike the `reactToItem` routine, which toggles
 * the heart back off to exercise the toggle). The batched-digest test needs the
 * reaction to survive so its `async_notification` row can ride along with a driver.
 */
const addPersistentReaction = async (item: Locator): Promise<void> => {
  const isMediaTile = (await item.getAttribute('data-testid').catch(() => null))?.startsWith(
    'media-tile-',
  );
  if (isMediaTile) {
    await item.hover();
  }
  const heart = item.getByRole('button', { name: /heart/i }).first();
  await expect(heart).toBeVisible();
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
};

// A digest that has landed is one send: its body carries every section at once. So a
// message matched by content unique to this test (the album title / comment body, both
// carry `uniqueSuffix`) plus a section marker is unambiguously THIS test's digest, even
// though the seed-user inboxes are shared across the whole run.
const digestPresent = async (
  request: Parameters<typeof retrieveLocalStackSesMessages>[0],
  ...requiredText: string[]
): Promise<boolean> => {
  const messages = await retrieveLocalStackSesMessages(request);
  return messages.some((m) => requiredText.every((t) => sesMessageBodyIncludes(m, t)));
};

/**
 * Exercises the batched activity digest (`activityDigest` template) end to end.
 *
 * The digest batches three activity kinds — item-added-to-album, comments, and
 * reactions — but a reaction is a *rider*: it only ships inside an email that also
 * carries a "driver" (an item-add or a comment) for the same recipient. A reaction
 * whose claim has no driver produces no email, and its row lingers until a driver
 * appears in a later claim (see notificationBatcher `hasDriver` + outcomeCleanup).
 *
 * Recipients differ by activity, so this produces two independent digests:
 *
 *   • USER B's digest — item-added: A adds an item to the shared album; B (an album
 *     member) is notified. Section: "New photos" + the album title.
 *
 *   • USER A's digest — comment (driver) + reaction (rider): B comments on and reacts
 *     to an item A owns; both notify the owner (A). Because the reaction is created
 *     *before* the comment, its row is always claimed in the same sweep as that
 *     comment, so A's single digest carries both "New comments" and "New reactions".
 *
 * Timing note: the worker gates this on DEBOUNCE_EMAIL_WINDOW_SECONDS (rows are only
 * claimed once older than the window) and the slow-sweep interval — both 5s in the
 * docker dev/CI stack. The generous poll timeout absorbs that plus a batch or two.
 */
test.describe('Batched activity digest', () => {
  test('delivers item-add, comment, and reaction activity as batched digests', async ({
    userA,
    userB,
    grabTestImages,
    uniqueSuffix,
    request,
  }) => {
    const [a, b, c] = await setup(grabTestImages, userA, 3);

    const albumTitle = `e2e-batched-${uniqueSuffix}`;
    const { albumId } = await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id, b.id]);

    await test.step('USER A: share album with user B (default comment/download grant)', async () => {
      await userA.page.getByRole('button', { name: 'Share album' }).click();
      const shareDialog = userA.page.getByRole('dialog', { name: 'Share album' });
      const recipientInput = shareDialog.getByRole('combobox', { name: 'Recipients' });
      await recipientInput.fill(userB.user.email);
      // The MultiCombobox only counts a recipient once it's committed to a pill.
      await recipientInput.press('Enter');
      await expect(
        shareDialog.getByRole('button', { name: `Remove ${userB.user.email.toLowerCase()}` }),
      ).toBeVisible();
      await shareDialog.getByRole('button', { name: 'Share with user' }).click();
      await expect(shareDialog).toBeHidden();
    });

    await loginViaUi(userB.page, userB.user);

    const commentBody = `Batched comment ${uniqueSuffix}`;
    await test.step('USER B: react to item A owns (rider), THEN comment on it (driver)', async () => {
      await userB.page.goto(`/albums/${albumId}`);
      await expect(userB.page.getByRole('heading', { name: albumTitle })).toBeVisible();
      await expectMediaItemLoaded(userB.page, a.id);

      // Reaction first: its notification row must be older than the comment's so every
      // sweep that claims the comment also re-claims this reaction. Recipient = the
      // item's owner (A).
      await addPersistentReaction(mediaTile(userB.page, a.id));

      // Comment (the driver). Recipient = the item's owner (A).
      await userB.page.getByTestId(`media-tile-${a.id}`).getByRole('link').first().click();
      await expect(userB.page).toHaveURL(new RegExp(`/media/${a.id}`));
      const composer = userB.page.getByLabel('Add a comment…');
      await composer.click();
      await composer.fill(commentBody);
      await composer.press('Control+Enter');
      await expect(
        userB.page.getByTestId('comment-row').filter({ hasText: commentBody }),
      ).toBeVisible();
    });

    await test.step('USER A: add an item to the shared album (drives B’s digest)', async () => {
      await addMediaItemsToExistingAlbum(userA.page, [c.id]);
      await expectAlbumGalleryItems(userA.page, {
        albumTitle,
        loadedIds: [a.id, b.id, c.id],
      });
    });

    await test.step('USER A: receives a comment+reaction digest (reaction rides the comment)', async () => {
      await expect
        .poll(() => digestPresent(request, commentBody, 'reacted to your'), { timeout: 45_000 })
        .toBe(true);
    });

    await test.step('USER B: receives an item-added digest', async () => {
      await expect
        .poll(() => digestPresent(request, albumTitle, 'New photos'), { timeout: 45_000 })
        .toBe(true);
    });
  });
});
