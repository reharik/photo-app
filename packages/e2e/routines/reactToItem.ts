import { Locator, Page } from '@playwright/test';
import { expect } from '../fixtures/test';

export const reactToItem = async (page: Page, item: Locator): Promise<void> => {
  const isMediaTile = (await item.getAttribute('data-testid').catch(() => null))?.startsWith(
    'media-tile-',
  );
  if (isMediaTile) {
    await item.hover();
  }

  const heartButton = item.getByRole('button', { name: /heart/i }).first();
  await expect(heartButton).toBeVisible();
  await expect(heartButton).toHaveAttribute('aria-pressed', 'false');

  await heartButton.click();
  await expect(heartButton).toHaveAttribute('aria-pressed', 'true');

  const reactionCount = item.getByLabel('Reaction count');
  if ((await reactionCount.count()) > 0) {
    await expect(reactionCount).toHaveText('1');
  } else if (/\d/.test((await heartButton.textContent()) ?? '')) {
    await expect(heartButton).toContainText('1');
  }

  await heartButton.click();
  await expect(heartButton).toHaveAttribute('aria-pressed', 'false');

  if ((await reactionCount.count()) > 0) {
    await expect(reactionCount).toBeHidden();
  } else if (/\d/.test((await heartButton.textContent()) ?? '')) {
    await expect(heartButton).not.toContainText('1');
  }
};
