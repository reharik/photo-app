import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Helpers for the one-surface ShareAlbumModal (RAI-79 redesign).
 *
 * The modal has no modes and no submit button: committing an email to the
 * input (Enter / separator / suggestion pick / paste) fires the share
 * immediately and renders a SHARED WITH row that settles from 'sending' to
 * shared. The row's enabled "Remove access" × is the settle signal — it stays
 * disabled while the share is in flight and never renders on a failed row —
 * and by the time it enables, the refetched server row (with the
 * authorization id revoke needs) has landed too.
 */

export const openShareAlbumModal = async (page: Page): Promise<Locator> => {
  await page.getByRole('button', { name: 'Share album' }).click();
  const dialog = page.getByRole('dialog', { name: 'Share album' });
  await expect(dialog).toBeVisible();
  return dialog;
};

/** The email input has no visible label — the placeholder is its identity. */
export const shareAlbumEmailInput = (dialog: Locator): Locator =>
  dialog.getByPlaceholder('Add people by email');

export const removeAccessButton = (dialog: Locator, email: string): Locator =>
  dialog.getByRole('button', { name: `Remove access for ${email.toLowerCase()}` });

/** Commits one email and waits for its shared-with row to settle as shared. */
export const commitShareEmail = async (dialog: Locator, email: string): Promise<void> => {
  const input = shareAlbumEmailInput(dialog);
  await input.fill(email);
  await input.press('Enter');
  await expect(removeAccessButton(dialog, email)).toBeEnabled({ timeout: 15_000 });
};

export const closeShareAlbumModal = async (page: Page): Promise<void> => {
  const dialog = page.getByRole('dialog', { name: 'Share album' });
  await dialog.getByRole('button', { name: 'Close modal' }).click();
  await expect(dialog).toBeHidden();
};

/** Opens the modal, shares with one email, and closes — the common happy path. */
export const shareAlbumWithEmail = async (page: Page, email: string): Promise<void> => {
  const dialog = await openShareAlbumModal(page);
  await commitShareEmail(dialog, email);
  await closeShareAlbumModal(page);
};
