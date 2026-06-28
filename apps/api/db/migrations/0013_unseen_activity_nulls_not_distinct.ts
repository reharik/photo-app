import type { Knex } from 'knex';

const UNIQUE_COLUMNS = ['viewer_id', 'album_id', 'target_type', 'target_id', 'activity_kind'];
const CONSTRAINT_NAME = 'unseen_activity_unique';

// Drops whatever unique constraint currently spans UNIQUE_COLUMNS on unseen_activity,
// regardless of its (possibly truncated) auto-generated name.
async function dropExistingUniqueConstraint(knex: Knex): Promise<void> {
  // A `DO` block cannot take bind parameters, so the column list is inlined as a
  // literal array. UNIQUE_COLUMNS is a hardcoded constant (not user input), so
  // there is no injection risk.
  const columnArrayLiteral = `ARRAY[${UNIQUE_COLUMNS.map((c) => `'${c}'`).join(', ')}]::text[]`;
  await knex.raw(`
    DO $$
    DECLARE
      con_name text;
    BEGIN
      SELECT conname INTO con_name
      FROM pg_constraint
      WHERE conrelid = 'unseen_activity'::regclass
        AND contype = 'u'
        AND (
          SELECT array_agg(attname::text ORDER BY attname::text)
          FROM unnest(conkey) AS k(attnum)
          JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k.attnum
        ) = (SELECT array_agg(c ORDER BY c) FROM unnest(${columnArrayLiteral}) AS c);

      IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE unseen_activity DROP CONSTRAINT %I', con_name);
      END IF;
    END $$;
  `);
}

export async function up(knex: Knex): Promise<void> {
  await dropExistingUniqueConstraint(knex);

  await knex.raw(`
    ALTER TABLE unseen_activity
    ADD CONSTRAINT ${CONSTRAINT_NAME}
    UNIQUE NULLS NOT DISTINCT (${UNIQUE_COLUMNS.join(', ')})
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE unseen_activity
    DROP CONSTRAINT ${CONSTRAINT_NAME}
  `);

  await knex.raw(`
    ALTER TABLE unseen_activity
    ADD CONSTRAINT ${CONSTRAINT_NAME}
    UNIQUE (${UNIQUE_COLUMNS.join(', ')})
  `);
}
