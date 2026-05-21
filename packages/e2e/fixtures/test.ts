import { test as base, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { cleanupGrantsToRecipient, cleanupOwnedRows } from './cleanup';
import { closeDb, getUserIdByEmail } from './db';
import { grabTestImages, type GrabTestImagesResult } from './testAssets';
import { USER_A, USER_B, type TestUser } from './users';

export type UserSession = {
  user: TestUser;
  context: BrowserContext;
  page: Page;
  userId: string;
};

type Fixtures = {
  /** User A — owner of test fixtures. Fresh browser context per test. */
  userA: UserSession;
  /** User B — recipient. Fresh browser context per test, no shared auth with A. */
  userB: UserSession;
  /** Fresh unauthenticated browser context for public-link tests. */
  anonContext: BrowserContext;
  /** Page in the fresh unauthenticated context. */
  anonPage: Page;
  /** Per-test random suffix for fixture titles, so concurrent test runs don't collide. */
  uniqueSuffix: string;
  /**
   * Picks random images from `fixtures/assets`, copies them to temp paths named
   * `{stem}-{uniqueSuffix}{ext}`, and returns paths ready for upload.
   */
  grabTestImages: (count: number) => GrabTestImagesResult[];
};

const makeSession = async (browser: Browser, user: TestUser): Promise<UserSession> => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const userId = await getUserIdByEmail(user.email);
  return { user, context, page, userId };
};

export const test = base.extend<Fixtures>({
  uniqueSuffix: async ({}, use, testInfo) => {
    await use(`${Date.now().toString(36)}-${testInfo.workerIndex}`);
  },

  grabTestImages: async ({ uniqueSuffix }, use) => {
    await use((count: number) => grabTestImages(count, uniqueSuffix));
  },

  userA: async ({ browser }, use) => {
    const session = await makeSession(browser, USER_A);
    try {
      await use(session);
    } finally {
      try {
        await cleanupOwnedRows(session.userId);
      } finally {
        await session.context.close();
      }
    }
  },

  userB: async ({ browser }, use) => {
    const session = await makeSession(browser, USER_B);
    try {
      await use(session);
    } finally {
      try {
        await cleanupGrantsToRecipient(session.userId);
      } finally {
        await session.context.close();
      }
    }
  },

  anonContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: undefined });
    try {
      await use(context);
    } finally {
      await context.close();
    }
  },

  anonPage: async ({ anonContext }, use) => {
    const page = await anonContext.newPage();
    await use(page);
  },
});

test.afterAll(async () => {
  await closeDb();
});

export { expect } from '@playwright/test';
