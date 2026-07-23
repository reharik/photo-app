import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The transient notification toast.
 *
 * Several elements in the app legitimately carry `role="status"` (e.g. the nav's
 * unseen-activity dot, `aria-label="Unseen activity"`), so a bare
 * `getByRole('status')` is ambiguous and throws a strict-mode violation once more
 * than one is present. The toast is the only status element with a "Dismiss
 * notification" button, so key off that instead — stable regardless of the message.
 */
export const toast = (page: Page): Locator =>
  page
    .getByRole('status')
    .filter({ has: page.getByRole('button', { name: 'Dismiss notification' }) });

/** Asserts the notification toast is showing `message`. */
export const expectToast = async (page: Page, message: string): Promise<void> => {
  await expect(toast(page)).toContainText(message);
};
