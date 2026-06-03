import { expect, type Page } from '@playwright/test';

/**
 * Waits until a media grid tile is visible. Fails with a readable message
 * when the item is missing from the page (wrong DB, not loaded yet, etc.).
 */
export const expectMediaTileVisible = async (
  page: Page,
  mediaItemId: string,
  title?: string,
): Promise<void> => {
  const tile = page.getByTestId(`media-tile-${mediaItemId}`);
  try {
    await expect(tile).toBeVisible({ timeout: 30_000 });
  } catch {
    const titleVisible =
      title != null && title.length > 0
        ? await page
            .getByText(title, { exact: true })
            .isVisible()
            .catch(() => false)
        : false;
    throw new Error(
      `Media tile [data-testid="media-tile-${mediaItemId}"] not found. ` +
        `URL: ${page.url()}.` +
        (title != null && title.length > 0 ? ` Title "${title}" visible: ${titleVisible}.` : '') +
        ' Confirm upload finished and the item appears on Library.',
    );
  }
};

/** Opens an owned media detail screen and waits for the comments composer. */
export const gotoOwnerMediaDetail = async (page: Page, mediaItemId: string): Promise<void> => {
  await page.goto(`/media/${mediaItemId}`);
  await expect(page).toHaveURL(new RegExp(`/media/${mediaItemId}(\\?.*)?$`));

  const composer = page.getByLabel('Add a comment…');
  try {
    await expect(composer).toBeVisible({ timeout: 30_000 });
  } catch {
    const bodyPreview = await page
      .locator('body')
      .innerText()
      .catch(() => '');
    throw new Error(
      `Media detail did not load for id ${mediaItemId}. URL: ${page.url()}. ` +
        `Expected the comment composer. Page text starts with: ${bodyPreview.slice(0, 300)}`,
    );
  }
};

/** Waits for a public shared media detail URL after opening a tile from the grid. */
export const expectPublicMediaDetailUrl = async (
  page: Page,
  mediaItemId: string,
): Promise<void> => {
  await expect(page).toHaveURL(new RegExp(`/shared/[^/]+/media/${mediaItemId}(\\?.*)?$`), {
    timeout: 30_000,
  });
};
