import { expect, type Locator, type Page } from '@playwright/test';

/** Toolbar shown when one or more `media-tile-*` items are selected in a gallery. */
export const selectionToolbar = (page: Page): Locator =>
  page.getByRole('toolbar', { name: 'Selected items' });

export type MediaSelectionHandle = {
  /** Number of items selected (matches toolbar label). */
  count: number;
  /** Media item ids that were selected. */
  mediaItemIds: string[];
  /** The top selection bar (`role="toolbar"`, name "Selected items"). */
  toolbar: Locator;
  /** Clicks an action button in the selection bar (e.g. "Share", "Add to album"). */
  clickAction: (buttonName: string) => Promise<void>;
  /** Asserts an action button is visible in the selection bar. */
  expectActionVisible: (buttonName: string) => Promise<void>;
  /** Asserts an action button is not present in the selection bar. */
  expectActionHidden: (buttonName: string) => Promise<void>;
  /** Clears the selection via the ✕ control; toolbar is hidden afterward. */
  clear: () => Promise<void>;
};

export type SelectMediaItemsOptions = {
  /**
   * When set, asserts each label appears as a button on the selection toolbar.
   * Use the visible button text (e.g. "Share", "Add to album", "Delete from library").
   */
  expectActions?: string[];
  /**
   * When set, tiles and the selection toolbar are resolved within this container
   * (e.g. an "Add album item" modal on the album screen).
   */
  scope?: Locator;
};

const selectionCountLabel = (count: number): string =>
  count === 1 ? '1 selected' : `${count} selected`;

export const mediaTile = (root: Page | Locator, mediaItemId: string): Locator =>
  root.getByTestId(`media-tile-${mediaItemId}`);

const selectionToolbarIn = (root: Page | Locator): Locator =>
  root.getByRole('toolbar', { name: 'Selected items' });

/**
 * Hovers a gallery tile and toggles its corner checkbox on if not already selected.
 * Works on any screen that renders `SelectableGallery` + `media-tile-{id}` (recent
 * media, album detail, shared-with-me, public album grid, media picker, etc.).
 */
export const selectMediaTile = async (
  page: Page,
  mediaItemId: string,
  scope?: Locator,
): Promise<void> => {
  const root = scope ?? page;
  const tile = mediaTile(root, mediaItemId);
  await tile.hover();

  const checkbox = tile.getByRole('checkbox');
  const checkboxCount = await checkbox.count();
  if (checkboxCount === 0) {
    throw new Error(
      `No selection checkbox on media-tile-${mediaItemId}. ` +
        'The viewer may lack selectable operations on this screen, or the tile is not hoverable yet.',
    );
  }

  const pressed = await checkbox.getAttribute('aria-checked');
  if (pressed === 'true') {
    return;
  }

  await checkbox.click();
};

/**
 * Selects one or more media items by id, then waits for the top selection toolbar
 * with the expected count and optional action buttons.
 */
export const selectMediaItems = async (
  page: Page,
  mediaItemIds: string[],
  options: SelectMediaItemsOptions = {},
): Promise<MediaSelectionHandle> => {
  if (mediaItemIds.length === 0) {
    throw new Error('selectMediaItems requires at least one media item id');
  }

  const root = options.scope ?? page;

  for (const mediaItemId of mediaItemIds) {
    await selectMediaTile(page, mediaItemId, options.scope);
  }

  const toolbar = selectionToolbarIn(root);
  const count = mediaItemIds.length;

  await expect(toolbar).toBeVisible();
  await expect(toolbar).toContainText(selectionCountLabel(count));

  if (options.expectActions != null) {
    for (const actionName of options.expectActions) {
      await expect(toolbar.getByRole('button', { name: actionName })).toBeVisible();
    }
  }

  const clickAction = async (buttonName: string): Promise<void> => {
    await toolbar.getByRole('button', { name: buttonName }).click();
  };

  const expectActionVisible = async (buttonName: string): Promise<void> => {
    await expect(toolbar.getByRole('button', { name: buttonName })).toBeVisible();
  };

  const expectActionHidden = async (buttonName: string): Promise<void> => {
    await expect(toolbar.getByRole('button', { name: buttonName })).toHaveCount(0);
  };

  const clear = async (): Promise<void> => {
    await toolbar.getByRole('button', { name: 'Clear selection' }).click();
    await expect(toolbar).toBeHidden();
  };

  return {
    count,
    mediaItemIds,
    toolbar,
    clickAction,
    expectActionVisible,
    expectActionHidden,
    clear,
  };
};

/** Asserts the selection toolbar is not shown (nothing selected). */
export const expectNoMediaSelection = async (page: Page): Promise<void> => {
  await expect(selectionToolbar(page)).toBeHidden();
};

/**
 * Asserts a tile's selection checkbox is not available (e.g. shared recipient
 * without grant operations).
 */
export const expectMediaTileNotSelectable = async (
  page: Page,
  mediaItemId: string,
): Promise<void> => {
  const tile = mediaTile(page, mediaItemId);
  await tile.hover();
  await expect(tile.getByRole('checkbox', { name: 'Select' })).toHaveCount(0);
  await expect(tile.getByRole('checkbox', { name: 'Deselect' })).toHaveCount(0);
};

export const toggleReaction = async (
  page: Page,
  mediaItemId: string,
  reaction: string,
): Promise<void> => {
  const tile = mediaTile(page, mediaItemId);
  await tile.hover();
  await tile.getByRole('button', { name: reaction }).click();
};

export const expectMediaItemLoaded = async (page: Page, id: string) => {
  const img = page.getByTestId(id);
  await expect(img).toBeVisible();

  await expect
    .poll(async () => {
      const state = await img.evaluate((el: HTMLImageElement) => ({
        complete: el.complete,
        naturalWidth: el.naturalWidth,
        src: el.currentSrc || el.src,
      }));
      return state.complete && state.naturalWidth > 0;
    })
    .toBe(true);
};
