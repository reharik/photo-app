import { expect, type Page } from '@playwright/test';
import type { TestUser } from '../fixtures/users';

/**
 * Title of the "shadow" album the backend generates when someone shares loose media
 * items (items not already in an album): `Photos from {sharer's first name}`.
 *
 * Sharing individual items no longer has its own recipient-side surface — the shadow
 * album is how those items reach the recipient, listed under Shared alongside real
 * shared albums. Derived from the fixture user so it tracks the seed data.
 */
export const sharedItemsAlbumTitle = (sharer: TestUser): string =>
  `Photos from ${sharer.displayName.split(' ')[0]}`;

/**
 * Navigates to the Shared list and opens the album with the given title, landing on
 * `/albums/:id` where the member media tiles render.
 */
export const openSharedAlbum = async (
  page: Page,
  title: string,
  options?: { timeout?: number },
): Promise<void> => {
  await page.goto('/shared/albums');
  const tile = page.locator('[data-testid^="album-tile-"]').filter({ hasText: title }).first();
  await expect(tile).toBeVisible(options);
  await tile.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/albums\/[0-9a-f-]+/);
};
