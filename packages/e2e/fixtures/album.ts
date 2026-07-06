import { expect, type Page, type Response } from '@playwright/test';
import {
  expectMediaItemLoaded,
  selectMediaItems,
  selectionCountLabel,
  selectionToolbar,
  type MediaSelectionHandle,
  type SelectionToolbarVariant,
} from './mediaSelection';
import { getModal } from './modal';
import { expectMediaTileVisible } from './navigation';
import { UPLOAD_TIMEOUT_MS } from './upload';

export type CreatedAlbumResult = {
  albumId: string;
  albumTitle: string;
  mediaItemIds: string[];
};

const isAddMediaItemsToAlbumResponse = (response: Response): boolean => {
  if (!response.url().includes('/graphql') || response.request().method() !== 'POST') {
    return false;
  }

  const body = response.request().postDataJSON() as { operationName?: string } | undefined;
  return body?.operationName === 'AddMediaItemsToAlbum';
};

const readAlbumIdFromAddMutation = async (response: Response): Promise<string> => {
  const json = (await response.json()) as {
    data?: { AddMediaItemsToAlbum?: { data?: { albumId?: string } } };
  };
  const albumId = json.data?.AddMediaItemsToAlbum?.data?.albumId;
  if (albumId == null) {
    throw new Error(`AddMediaItemsToAlbum response missing albumId: ${JSON.stringify(json)}`);
  }
  return albumId;
};

const waitForAddMediaItemsToAlbumAlbumId = async (page: Page): Promise<string> => {
  const response = await page.waitForResponse(isAddMediaItemsToAlbumResponse, {
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return readAlbumIdFromAddMutation(response);
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
  /** Library uses "{N} items selected"; album screens use "{N} selected". */
  toolbarVariant?: SelectionToolbarVariant;
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
 * (e.g. Library). Default: navigates to the new album and returns its id.
 */
export const addMediaItemsToNewAlbum = async (
  page: Page,
  albumTitle: string,
  mediaItemIds: string[],
  options: AddMediaItemsToNewAlbumOptions = {},
): Promise<CreatedAlbumResult> => {
  const { alreadySelected = false, navigateToAlbum = true, toolbarVariant = 'library' } = options;

  if (mediaItemIds.length === 0) {
    throw new Error('addMediaItemsToNewAlbum requires at least one media item id');
  }

  if (!alreadySelected) {
    const selection = await selectMediaItems(page, mediaItemIds, {
      expectActions: ['Add to album'],
      toolbarVariant,
    });
    await selection.clickAction('Add to album');
  } else {
    const toolbar = selectionToolbar(page);
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toContainText(selectionCountLabel(mediaItemIds.length, toolbarVariant));
    await toolbar.getByRole('button', { name: 'Add to album' }).click();
  }

  const albumIdPromise = waitForAddMediaItemsToAlbumAlbumId(page);
  await submitNewAlbumInAddModal(page, albumTitle);
  const albumId = await albumIdPromise;

  if (!navigateToAlbum) {
    return { albumId, albumTitle, mediaItemIds };
  }

  await page.goto(`/albums/${albumId}`);
  await expect(page.getByRole('heading', { name: albumTitle })).toBeVisible();

  return {
    albumId,
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
  const albumIdPromise = waitForAddMediaItemsToAlbumAlbumId(page);
  await submitNewAlbumInAddModal(page, albumTitle);
  const albumId = await albumIdPromise;

  const { navigateToAlbum = true } = options;
  if (!navigateToAlbum) {
    return { albumId, albumTitle, mediaItemIds: selection.mediaItemIds };
  }

  await page.goto(`/albums/${albumId}`);
  await expect(page.getByRole('heading', { name: albumTitle })).toBeVisible();

  return {
    albumId,
    albumTitle,
    mediaItemIds: selection.mediaItemIds,
  };
};

export type AddMediaItemsToExistingAlbumOptions = {
  /**
   * When false, assumes the "Add album item" modal is already open.
   * Default: opens the "Add to album" menu and chooses "Add from library".
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
    await page.getByRole('button', { name: 'Add to album' }).click();
    await page.getByRole('menuitem', { name: 'Add from library' }).click();
  }

  const modal = getModal(page);
  await expect(modal).toBeVisible();

  const selection = await selectMediaItems(page, mediaItemIds, {
    scope: modal,
    expectActions: ['Add to album'],
    toolbarVariant: 'legacy',
  });
  await selection.clickAction('Add to album');

  await expect(modal).toBeHidden({ timeout: UPLOAD_TIMEOUT_MS });

  for (const mediaItemId of mediaItemIds) {
    await expectMediaTileVisible(page, mediaItemId);
  }
};

/**
 * On an album detail screen: selects items in the album gallery, removes them
 * from the album only, and waits until each tile disappears.
 */
export const removeMediaItemsFromAlbum = async (
  page: Page,
  mediaItemIds: string[],
): Promise<void> => {
  if (mediaItemIds.length === 0) {
    throw new Error('removeMediaItemsFromAlbum requires at least one media item id');
  }

  const selection = await selectMediaItems(page, mediaItemIds, {
    toolbarVariant: 'album',
    expectActions: ['Remove from album'],
  });
  await selection.clickAction('Remove from album');

  const modal = getModal(page);
  await expect(modal).toBeVisible();
  await expect(modal.getByText('Remove from album?')).toBeVisible();
  await modal.getByRole('button', { name: 'Remove from album' }).click();
  await expect(modal).toBeHidden({ timeout: UPLOAD_TIMEOUT_MS });

  for (const mediaItemId of mediaItemIds) {
    await expect(page.getByTestId(`media-tile-${mediaItemId}`)).toHaveCount(0);
  }
};

export type ExpectAlbumGalleryItemsOptions = {
  albumTitle?: string;
  loadedIds: string[];
  absentIds?: string[];
};

/** Asserts an album gallery shows the expected loaded and absent media tiles. */
export const expectAlbumGalleryItems = async (
  page: Page,
  { albumTitle, loadedIds, absentIds = [] }: ExpectAlbumGalleryItemsOptions,
): Promise<void> => {
  if (albumTitle != null) {
    await expect(page.getByRole('heading', { name: albumTitle })).toBeVisible();
  }

  for (const mediaItemId of loadedIds) {
    await expectMediaItemLoaded(page, mediaItemId);
  }

  for (const mediaItemId of absentIds) {
    await expect(page.getByTestId(`media-tile-${mediaItemId}`)).toHaveCount(0);
  }
};

/**
 * On an album detail screen: opens the cover picker, selects an item by media id
 * (must already be in the album), and waits until the header cover updates.
 */
export const setAlbumCover = async (page: Page, mediaItemId: string): Promise<void> => {
  const coverButton = page.getByRole('main').getByRole('button').first();
  await coverButton.click();

  const modal = getModal(page);
  await expect(modal).toBeVisible();
  await expect(modal.getByText('Select album Cover')).toBeVisible();

  const coverThumb = modal.getByTestId(mediaItemId);
  await expect(coverThumb).toBeVisible();
  await coverThumb.click();

  await expect(modal).toBeHidden({ timeout: UPLOAD_TIMEOUT_MS });
  await expect(page.getByRole('main').getByTestId(mediaItemId)).toBeVisible({
    timeout: UPLOAD_TIMEOUT_MS,
  });
};
