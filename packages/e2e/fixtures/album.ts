import { expect, type Page } from '@playwright/test';
import { selectMediaItems, selectionToolbar, type MediaSelectionHandle } from './mediaSelection';
import { getModal } from './modal';
import { expectMediaTileVisible } from './navigation';
import { UPLOAD_TIMEOUT_MS } from './upload';

export type CreatedAlbumResult = {
  albumId: string;
  albumTitle: string;
  mediaItemIds: string[];
};

export type AddMediaItemsToNewAlbumOptions = {
  /**
   * When true, skips `selectMediaItems` — use if the same ids are already
   * selected and the toolbar already shows the right count.
   */
  alreadySelected?: boolean;
  /**
   * When true (default), goes to /albums and opens the new album so
   * `albumId` can be read from the URL. When false, stays on the current page
   * after the modal closes (albumId will be empty).
   */
  navigateToAlbum?: boolean;
};

/**
 * Fills the "Add to album" modal combobox with a new album title and submits.
 * Caller must already have opened the modal (e.g. via selection toolbar).
 */
export const submitNewAlbumInAddModal = async (page: Page, albumTitle: string): Promise<void> => {
  const modal = getModal(page);
  await expect(modal).toBeVisible();
  const albumField = modal.getByLabel('Album');
  await albumField.fill(albumTitle);
  // Commit the custom "Create album: …" option and close the menu so it does not cover the button.
  await albumField.press('Enter');
  await modal.getByRole('button', { name: 'Add to album' }).click();
  await expect(modal).toBeHidden({ timeout: UPLOAD_TIMEOUT_MS });
};

/**
 * Selects media items (unless `alreadySelected`), clicks "Add to album", creates
 * a new album with `albumTitle`, and adds the selection to it.
 *
 * Works on any gallery screen that supports multi-select + "Add to album"
 * (e.g. Recent Media). Default: navigates to the new album and returns its id.
 */
export const addMediaItemsToNewAlbum = async (
  page: Page,
  albumTitle: string,
  mediaItemIds: string[],
  options: AddMediaItemsToNewAlbumOptions = {},
): Promise<CreatedAlbumResult> => {
  const { alreadySelected = false, navigateToAlbum = true } = options;

  if (mediaItemIds.length === 0) {
    throw new Error('addMediaItemsToNewAlbum requires at least one media item id');
  }

  if (!alreadySelected) {
    const selection = await selectMediaItems(page, mediaItemIds, {
      expectActions: ['Add to album'],
    });
    await selection.clickAction('Add to album');
  } else {
    const toolbar = selectionToolbar(page);
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toContainText(
      mediaItemIds.length === 1 ? '1 selected' : `${mediaItemIds.length} selected`,
    );
    await toolbar.getByRole('button', { name: 'Add to album' }).click();
  }

  await submitNewAlbumInAddModal(page, albumTitle);

  if (!navigateToAlbum) {
    return { albumId: '', albumTitle, mediaItemIds };
  }

  await page.goto('/albums');
  await page.getByRole('link', { name: albumTitle }).click();
  await expect(page.getByRole('heading', { name: albumTitle })).toBeVisible();

  const match = page.url().match(/\/albums\/([^/?]+)/);
  if (match?.[1] == null) {
    throw new Error(`Expected album URL after create; got ${page.url()}`);
  }

  return {
    albumId: match[1],
    albumTitle,
    mediaItemIds,
  };
};

/**
 * Same as `addMediaItemsToNewAlbum`, but uses an existing selection handle
 * (items must already be selected on the toolbar).
 */
export const addSelectionToNewAlbum = async (
  page: Page,
  selection: MediaSelectionHandle,
  albumTitle: string,
  options: Pick<AddMediaItemsToNewAlbumOptions, 'navigateToAlbum'> = {},
): Promise<CreatedAlbumResult> => {
  await selection.expectActionVisible('Add to album');
  await selection.clickAction('Add to album');
  await submitNewAlbumInAddModal(page, albumTitle);

  const { navigateToAlbum = true } = options;
  if (!navigateToAlbum) {
    return { albumId: '', albumTitle, mediaItemIds: selection.mediaItemIds };
  }

  await page.goto('/albums');
  await page.getByRole('link', { name: albumTitle }).click();
  await expect(page.getByRole('heading', { name: albumTitle })).toBeVisible();

  const match = page.url().match(/\/albums\/([^/?]+)/);
  if (match?.[1] == null) {
    throw new Error(`Expected album URL after create; got ${page.url()}`);
  }

  return {
    albumId: match[1],
    albumTitle,
    mediaItemIds: selection.mediaItemIds,
  };
};

export type AddMediaItemsToExistingAlbumOptions = {
  /**
   * When false, assumes the "Add album item" modal is already open.
   * Default: clicks "Add items to Album" on the current album screen.
   */
  openModal?: boolean;
};

/**
 * On an album detail screen: opens the add-items modal (unless already open),
 * selects library media in the picker, saves, and waits until each item appears
 * in the album gallery.
 *
 * Items must not already be in the album (picker excludes existing members).
 */
export const addMediaItemsToExistingAlbum = async (
  page: Page,
  mediaItemIds: string[],
  options: AddMediaItemsToExistingAlbumOptions = {},
): Promise<void> => {
  const { openModal = true } = options;

  if (mediaItemIds.length === 0) {
    throw new Error('addMediaItemsToExistingAlbum requires at least one media item id');
  }

  if (openModal) {
    await page.getByRole('button', { name: 'Add items to Album' }).click();
  }

  const modal = getModal(page);
  await expect(modal).toBeVisible();

  const selection = await selectMediaItems(page, mediaItemIds, {
    scope: modal,
    expectActions: ['Add to album'],
  });
  await selection.clickAction('Add to album');

  await expect(modal).toBeHidden({ timeout: UPLOAD_TIMEOUT_MS });

  for (const mediaItemId of mediaItemIds) {
    await expectMediaTileVisible(page, mediaItemId);
  }
};

/**
 * On an album detail screen: opens the cover picker, selects an item by media id
 * (must already be in the album), and waits until the header cover updates.
 */
export const setAlbumCover = async (page: Page, mediaItemId: string): Promise<void> => {
  const coverButton = page
    .getByRole('button')
    .filter({ has: page.locator('img, [aria-hidden]') })
    .first();
  await coverButton.click();

  const modal = getModal(page);
  await expect(modal).toBeVisible();

  const coverThumb = modal.locator(`img[src*="/media/${mediaItemId}/"]`);
  await expect(coverThumb).toBeVisible();
  await coverThumb.click();

  await expect(modal).toBeHidden({ timeout: UPLOAD_TIMEOUT_MS });
  await expect(coverButton.locator(`img[src*="/media/${mediaItemId}/"]`)).toBeVisible({
    timeout: UPLOAD_TIMEOUT_MS,
  });
};
