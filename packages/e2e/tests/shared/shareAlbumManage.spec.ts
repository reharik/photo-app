import { addMediaItemsToNewAlbum } from '../../fixtures/album';
import { loginViaUi } from '../../fixtures/auth';
import { expectMediaItemLoaded } from '../../fixtures/mediaSelection';
import { expectAuthenticatedMediaDetailInaccessible } from '../../fixtures/navigation';
import {
  closeShareAlbumModal,
  commitShareEmail,
  openShareAlbumModal,
  removeAccessButton,
  shareAlbumWithEmail,
} from '../../fixtures/shareAlbumModal';
import { expect, test } from '../../fixtures/test';
import { expectToast } from '../../fixtures/toast';
import { setup } from '../../routines/setup';

/**
 * Management flows on the one-surface share modal (RAI-79): revoking a share,
 * promoting a share to membership and managing the member's role, and the
 * public-link lifecycle. The grant-forward paths (initial share, invite email,
 * digests) live in the other shared/ specs — this file is everything that
 * TAKES access away or changes its shape.
 */

test.describe('Share album management', () => {
  test('removing access revokes the grant end to end', async ({
    userA,
    userB,
    grabTestImages,
    uniqueSuffix,
  }) => {
    const [a, b] = await setup(grabTestImages, userA, 2);
    const albumTitle = `e2e-manage-revoke-${uniqueSuffix}`;
    const { albumId } = await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id, b.id]);
    await shareAlbumWithEmail(userA.page, userB.user.email);

    await loginViaUi(userB.page, userB.user);
    await test.step('USER B: can see the shared album before the revoke', async () => {
      await userB.page.goto(`/albums/${albumId}`);
      await expect(userB.page.getByRole('heading', { name: albumTitle })).toBeVisible();
      await expectMediaItemLoaded(userB.page, a.id);
      await expectMediaItemLoaded(userB.page, b.id);
    });

    await test.step('USER A: remove access from the shared-with row', async () => {
      const dialog = await openShareAlbumModal(userA.page);
      await removeAccessButton(dialog, userB.user.email).click();
      await expectToast(userA.page, 'Access removed');
      await expect(removeAccessButton(dialog, userB.user.email)).toHaveCount(0);
      await closeShareAlbumModal(userA.page);
    });

    await test.step('USER B: the album AND the media bytes are gone', async () => {
      // The revoke must tear down the materialized grant rows in the same
      // transaction as the authorization row — if it ever regresses to a
      // post-commit event, this step is what catches the fail-open.
      await userB.page.goto(`/albums/${albumId}`);
      await expect(userB.page.getByText('Something went wrong')).toBeVisible();
      await expect(userB.page.getByTestId(`media-tile-${a.id}`)).toHaveCount(0);
      await expectAuthenticatedMediaDetailInaccessible(userB.page, a.id);
    });
  });

  test('promote to member, change the role, then remove the member', async ({
    userA,
    userB,
    grabTestImages,
    uniqueSuffix,
  }) => {
    const [a] = await setup(grabTestImages, userA, 1);
    // Member rows render "firstName lastName" — derive from the per-test user.
    const recipientName = userB.user.displayName;
    const albumTitle = `e2e-manage-roles-${uniqueSuffix}`;
    await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id]);
    const dialog = await openShareAlbumModal(userA.page);
    await commitShareEmail(dialog, userB.user.email);

    await test.step('promote the account-holding share to contributor', async () => {
      await dialog
        .getByRole('button', { name: `Access level for ${userB.user.email.toLowerCase()}` })
        .click();
      await userA.page.getByRole('menuitem', { name: 'Contributor' }).click();
      // The promote confirm carries the capability change; the share row's
      // grant is deliberately NOT revoked by promotion (grants are additive).
      await userA.page.getByRole('button', { name: 'Make contributor' }).click();
      await expectToast(userA.page, 'Added as a member');
      await expect(
        dialog.getByRole('button', { name: `Change role for ${recipientName}` }),
      ).toContainText('Contributor');
    });

    await test.step('change the member role to admin', async () => {
      const roleTrigger = dialog.getByRole('button', {
        name: `Change role for ${recipientName}`,
      });
      await roleTrigger.click();
      await userA.page.getByRole('menuitem', { name: 'Admin' }).click();
      await expect(roleTrigger).toContainText('Admin');
    });

    await test.step('the admin role survives a reopen (persisted server-side)', async () => {
      await closeShareAlbumModal(userA.page);
      const reopened = await openShareAlbumModal(userA.page);
      await expect(
        reopened.getByRole('button', { name: `Change role for ${recipientName}` }),
      ).toContainText('Admin');
    });

    await test.step('removing the member falls back to the surviving view grant', async () => {
      const reopened = userA.page.getByRole('dialog', { name: 'Share album' });
      await reopened.getByRole('button', { name: `Remove ${recipientName} from album` }).click();
      await userA.page.getByRole('button', { name: 'Remove', exact: true }).click();
      await expectToast(userA.page, 'Removed from album');
      // Promotion never revoked the original access_grant, so once membership
      // is gone the person reappears in SHARED WITH under that grant.
      await expect(removeAccessButton(reopened, userB.user.email)).toBeVisible();
      await expect(
        reopened.getByRole('button', { name: `Change role for ${recipientName}` }),
      ).toHaveCount(0);
    });
  });

  test('public link: create, view anonymously, reset kills the old token', async ({
    userA,
    anonPage,
    grabTestImages,
    uniqueSuffix,
  }) => {
    const [a] = await setup(grabTestImages, userA, 1);
    const albumTitle = `e2e-manage-link-${uniqueSuffix}`;
    await addMediaItemsToNewAlbum(userA.page, albumTitle, [a.id]);
    const dialog = await openShareAlbumModal(userA.page);
    const urlField = dialog.getByLabel('Public link URL');

    let firstUrl = '';
    await test.step('create the link from the modal footer', async () => {
      await dialog.getByRole('button', { name: 'Create a link anyone can view' }).click();
      await expect(urlField).toBeVisible();
      firstUrl = await urlField.inputValue();
      expect(firstUrl).toContain('/shared/');
    });

    await test.step('anyone with the link can view the album', async () => {
      await anonPage.goto(firstUrl);
      await expectMediaItemLoaded(anonPage, a.id);
    });

    let secondUrl = '';
    await test.step('reset mints a fresh token behind a confirm', async () => {
      await dialog.getByRole('button', { name: 'Reset public link' }).click();
      await userA.page.getByRole('button', { name: 'Reset link' }).click();
      await expectToast(userA.page, 'Public link reset');
      await expect(urlField).not.toHaveValue(firstUrl);
      secondUrl = await urlField.inputValue();
      expect(secondUrl).toContain('/shared/');
    });

    await test.step('the old token is dead; the new one works', async () => {
      // Reset revokes the token AND prunes its grant rows in one transaction —
      // a stale-but-working old link here means the teardown regressed.
      await anonPage.goto(firstUrl);
      await expect(anonPage.getByTestId(`media-tile-${a.id}`)).toHaveCount(0);
      await anonPage.goto(secondUrl);
      await expectMediaItemLoaded(anonPage, a.id);
    });
  });
});
