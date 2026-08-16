import type { Knex } from 'knex';

/**
 * The one-active-job-per-item partial unique indexes on media_processing_job and
 * media_deletion_job predicated on lowercase status values ('pending','processing'),
 * but the smart-enum wire format stores constant-case ('PENDING','PROCESSING'). The
 * predicate never matched a single row, so the indexes never enforced anything —
 * enqueueIfNoneActive's unique-violation handling was dead code and duplicate active
 * jobs could accumulate. Rebuild both indexes with the real wire values.
 *
 * Because the guard was vacuous, existing data may already violate it: before creating
 * each corrected index, mark all but the newest active job per media_item_id as FAILED
 * (auditable via last_error) so the CREATE UNIQUE INDEX cannot fail.
 */

const TABLES = ['media_processing_job', 'media_deletion_job'] as const;

const indexName = (table: string): string => `${table}_one_active_per_media_item`;

const supersedeDuplicateActiveJobs = async (knex: Knex, table: string): Promise<void> => {
  await knex.raw(
    `
    UPDATE ?? SET
      status = 'FAILED',
      completed_at = now(),
      updated_at = now(),
      last_error = 'superseded: duplicate active job for media_item_id (migration 0027 index-case fix)'
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY media_item_id
          ORDER BY created_at DESC, id DESC
        ) AS rn
        FROM ??
        WHERE status IN ('PENDING', 'PROCESSING')
      ) ranked
      WHERE ranked.rn > 1
    )
  `,
    [table, table],
  );
};

export const up = async (knex: Knex): Promise<void> => {
  for (const table of TABLES) {
    await supersedeDuplicateActiveJobs(knex, table);
    await knex.raw(`DROP INDEX IF EXISTS ${indexName(table)}`);
    await knex.raw(`
      CREATE UNIQUE INDEX ${indexName(table)}
      ON ${table} (media_item_id)
      WHERE status IN ('PENDING', 'PROCESSING')
    `);
  }
};

export const down = async (knex: Knex): Promise<void> => {
  // Restores the original (vacuous, lowercase-predicate) index definitions from
  // 0001_init_schema; the superseded-duplicate status updates are not reverted.
  for (const table of TABLES) {
    await knex.raw(`DROP INDEX IF EXISTS ${indexName(table)}`);
    await knex.raw(`
      CREATE UNIQUE INDEX ${indexName(table)}
      ON ${table} (media_item_id)
      WHERE status IN ('pending', 'processing')
    `);
  }
};
