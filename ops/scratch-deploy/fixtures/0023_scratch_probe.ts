import type { Knex } from 'knex';

/**
 * SCRATCH TEST FIXTURE — case 3. Never commit a copy of this into
 * apps/api/db/migrations/.
 *
 * Ships in the SECOND scratch deploy. Its whole job is to be detectable: if
 * `scratch_probe` exists in the database after a deploy that used
 * `--force-recreate --no-deps`, the explicit migrate step defeated --no-deps.
 * If it is absent, prod would have silently stopped migrating.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('scratch_probe', (table) => {
    table.increments('id').primary();
    table.text('marker').notNullable().defaultTo('case-3');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('scratch_probe');
};
