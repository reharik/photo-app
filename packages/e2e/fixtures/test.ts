import { test as base, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { cleanupTestUser } from './cleanup';
import { closeDb } from './db';
// Import disabled alongside the afterAll SES clear below (kept for easy re-enable).
// import { clearLocalStackSesMessages } from './localstackSes';
import { grabTestImages, type GrabTestImagesResult } from './testAssets';
import { buildTestUser, insertTestUser, type TestUser, type TestUserRole } from './users';

export type UserSession = {
  user: TestUser;
  context: BrowserContext;
  page: Page;
  userId: string;
  box: true;
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

/**
 * Creates a fresh user row for THIS test (and this retry attempt — the
 * uniqueSuffix changes per attempt, so CI retries never reuse an email or its
 * rate-limit counters), plus a fresh browser context.
 */
const makeSession = async (
  browser: Browser,
  role: TestUserRole,
  uniqueSuffix: string,
): Promise<UserSession> => {
  const user = buildTestUser(role, uniqueSuffix);
  const userId = await insertTestUser(user);
  const context = await browser.newContext();
  const page = await context.newPage();
  return { user, context, page, userId, box: true };
};

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  uniqueSuffix: async ({}, use, testInfo) => {
    await use(`${Date.now().toString(36)}-${testInfo.workerIndex}`);
  },

  grabTestImages: async ({ uniqueSuffix }, use) => {
    await use((count: number) => grabTestImages(count, uniqueSuffix));
  },

  userA: async ({ browser, uniqueSuffix }, use) => {
    const session = await makeSession(browser, 'owner', uniqueSuffix);
    try {
      await use(session);
    } finally {
      try {
        await cleanupTestUser(session.userId);
      } finally {
        await session.context.close();
      }
    }
  },

  userB: async ({ browser, uniqueSuffix }, use) => {
    const session = await makeSession(browser, 'recipient', uniqueSuffix);
    try {
      await use(session);
    } finally {
      try {
        // Deleting the user row cascades B's own media (contributor specs have
        // B upload) AND both grant directions — no recipient-side sweep needed.
        await cleanupTestUser(session.userId);
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
  // Temporarily disabled so sent emails survive the run for manual inspection
  // (e.g. the batched activity digest). Re-enable to stop inboxes accumulating
  // across runs against the shared LocalStack SES store.
  // await clearLocalStackSesMessages();
  await closeDb();
});

export { expect } from '@playwright/test';
