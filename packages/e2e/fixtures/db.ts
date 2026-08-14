import knex, { Knex } from 'knex';
import knexStringcase from 'knex-stringcase';

import { env } from './env';

let cached: Knex | undefined;

/**
 * Returns a singleton knex connection for the local Postgres database
 * the api uses. Tests use it to seed and tear down fixture rows.
 */
export const getDb = (): Knex => {
  if (cached) {
    return cached;
  }
  cached = knex(
    knexStringcase({
      client: 'pg',
      connection: {
        host: env.postgres.host,
        port: env.postgres.port,
        user: env.postgres.user,
        password: env.postgres.password,
        database: env.postgres.database,
      },
      pool: { min: 0, max: 4 },
    }),
  );
  return cached;
};

export const closeDb = async (): Promise<void> => {
  if (cached) {
    await cached.destroy();
    cached = undefined;
  }
};
