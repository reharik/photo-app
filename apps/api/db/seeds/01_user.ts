import type { Knex } from 'knex';

import { ensureSeedUsers } from '../seedUsers';

export const seed = async (knex: Knex): Promise<void> => {
  await ensureSeedUsers(knex);
};
