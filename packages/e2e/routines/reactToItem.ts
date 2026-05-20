import { Locator, Page } from '@playwright/test';
import { expect } from '../fixtures/test';

export const reactToItem = async (page: Page, item: Locator): Promise<void> => {
  const heartButton = item.getByRole('button', { name: 'Heart' });
  await expect(heartButton).toHaveAttribute('aria-label', 'Add Heart');
  await heartButton.click();
  await expect(heartButton).toHaveAttribute('aria-label', 'Remove Heart');
  await expect(item.getByLabel('Reaction count')).toHaveText('1');
  await heartButton.click();
  await expect(heartButton).toHaveAttribute('aria-label', 'Add Heart');
  await expect(item.getByLabel('Reaction count')).toBeHidden();
};
