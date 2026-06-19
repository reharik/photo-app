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

type UserRow = { id: string; email: string };

export const getUserIdByEmail = async (email: string): Promise<string> => {
  const db = getDb();
  const row = await db<UserRow>('user').where({ email }).first('id');
  if (!row) {
    throw new Error(
      `Test user "${email}" not found. Run the api db seeds first (npm run db:seed:local --workspace=@app/api).`,
    );
  }
  return row.id;
};
