import { closeDb, getDb } from './fixtures/db';

/**
 * Tests create their own users per test (see `fixtures/users.ts`), so no seed
 * data is required here anymore. This just fails fast, with a clear error,
 * when Postgres isn't reachable — the alternative is 25 tests each timing out
 * in their user-factory fixture.
 */
const globalSetup = async (): Promise<void> => {
  try {
    await getDb().raw('select 1');
  } catch (error) {
    throw new Error(
      `E2e global setup could not reach Postgres (${String(error)}). ` +
        'Is the local stack running? See packages/e2e/README.md.',
    );
  } finally {
    await closeDb();
  }
};

export default globalSetup;
