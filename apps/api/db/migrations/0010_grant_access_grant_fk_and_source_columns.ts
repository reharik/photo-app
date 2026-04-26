import type { Knex } from 'knex';

type GrantSourceColumn = 'source' | 'source_id' | 'source_album_id';

type AccessGrantIdFkRow = {
  constraint_name: string;
  delete_rule: string;
};

const findAccessGrantIdFk = async (knex: Knex): Promise<AccessGrantIdFkRow | undefined> => {
  const { rows } = await knex.raw<{
    rows: AccessGrantIdFkRow[];
  }>(
    `
    SELECT
      tc.constraint_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    INNER JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_schema = rc.constraint_schema
      AND tc.constraint_name = rc.constraint_name
    INNER JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_schema = kcu.constraint_schema
      AND tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    INNER JOIN information_schema.constraint_column_usage AS ccu
      ON rc.unique_constraint_schema = ccu.constraint_schema
      AND rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.table_schema = current_schema()
      AND tc.table_name = 'grant'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'access_grant_id'
      AND ccu.table_name = 'access_grant'
    LIMIT 1
  `,
  );
  return rows[0];
};

export const up = async (knex: Knex): Promise<void> => {
  const existingFk = await findAccessGrantIdFk(knex);
  const needsCascadeFk = !existingFk || existingFk.delete_rule !== 'CASCADE';

  if (needsCascadeFk) {
    if (existingFk) {
      await knex.schema.alterTable('grant', (table) => {
        table.dropForeign(['access_grant_id'], existingFk.constraint_name);
      });
    }
    await knex.schema.alterTable('grant', (table) => {
      table.foreign('access_grant_id').references('id').inTable('access_grant').onDelete('CASCADE');
    });
  }

  const sourceColumns: GrantSourceColumn[] = ['source', 'source_id', 'source_album_id'];
  for (const col of sourceColumns) {
    if (await knex.schema.hasColumn('grant', col)) {
      await knex.schema.alterTable('grant', (table) => {
        table.dropColumn(col);
      });
    }
  }
};

export const down = async (knex: Knex): Promise<void> => {
  if (await knex.schema.hasColumn('grant', 'source')) {
    return;
  }
  await knex.schema.alterTable('grant', (table) => {
    table.text('source').notNullable();
    table.uuid('source_id').notNullable();
    table
      .uuid('source_album_id')
      .nullable()
      .references('id')
      .inTable('album')
      .onDelete('SET NULL');
  });
  await knex.raw(`
    ALTER TABLE "grant"
    ADD CONSTRAINT grant_source_check
    CHECK (source IN ('direct_share', 'album_share', 'album_member'))
  `);
  await knex.schema.alterTable('grant', (table) => {
    table.index(['source_id']);
    table.index(['source_album_id']);
  });
};
