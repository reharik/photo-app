import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT IF EXISTS access_grant_operations_check
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ALTER COLUMN operations TYPE text[]
    USING (
      CASE
        WHEN operations IS NULL OR operations = '' THEN ARRAY[]::text[]
        ELSE string_to_array(operations, ',')
      END
    )
  `);

  await knex.raw(`
    ALTER TABLE "grant"
    ALTER COLUMN operations TYPE text[]
    USING (
      CASE
        WHEN operations IS NULL OR operations = '' THEN NULL
        ELSE string_to_array(operations, ',')
      END
    )
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_operations_check
    CHECK (
      cardinality(operations) > 0
      AND operations <@ ARRAY['VIEW', 'COMMENT', 'DOWNLOAD']::text[]
    )
  `);

  await knex.raw(`
    ALTER TABLE "grant"
    ADD CONSTRAINT grant_operations_check
    CHECK (
      operations IS NULL
      OR (
        cardinality(operations) > 0
        AND operations <@ ARRAY['VIEW', 'COMMENT', 'DOWNLOAD']::text[]
      )
    )
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw(`
    ALTER TABLE "grant"
    DROP CONSTRAINT IF EXISTS grant_operations_check
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT IF EXISTS access_grant_operations_check
  `);

  await knex.raw(`
    ALTER TABLE "grant"
    ALTER COLUMN operations TYPE text
    USING (
      CASE
        WHEN operations IS NULL THEN NULL
        ELSE array_to_string(operations, ',')
      END
    )
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ALTER COLUMN operations TYPE text
    USING array_to_string(operations, ',')
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_operations_check
    CHECK (operations IN ('VIEW', 'COMMENT', 'DOWNLOAD'))
  `);
};
