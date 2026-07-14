// eslint-disable-next-line @nx/enforce-module-boundaries -- e2e setup seeds the api's users directly; apps/api exposes no package entry for this helper.
import { ensureSeedUsers } from '../../apps/api/db/seedUsers';

import { closeDb, getDb } from './fixtures/db';

/**
 * Ensures api seed users exist before e2e runs (integration tests may truncate `user`).
 */
const globalSetup = async (): Promise<void> => {
  await ensureSeedUsers(getDb());
  await closeDb();
};

export default globalSetup;
