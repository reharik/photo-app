import type { Locator, Page } from '@playwright/test';

/**
 * The currently open modal. Only one dialog is shown at a time in the app, so
 * no name/filtering is needed — open the modal first, then query within this.
 */
export const getModal = (page: Page): Locator => page.getByRole('dialog');
