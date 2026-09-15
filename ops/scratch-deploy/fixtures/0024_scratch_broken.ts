import type { Knex } from 'knex';

/**
 * SCRATCH TEST FIXTURE — case 2. Never commit a copy of this into
 * apps/api/db/migrations/: it would ship a guaranteed-failing migration to prod.
 *
 * Fails inside Postgres (duplicate column name, SQLSTATE 42701) rather than
 * throwing in JS, so the failure travels the real path: knex rejects ->
 * runMigrations catches -> process.exit(1) -> container exits non-zero ->
 * `docker compose run` propagates it -> `set -e` aborts remote-deploy.sh.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.raw('CREATE TABLE scratch_broken (id integer, id integer);');
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('scratch_broken');
};
