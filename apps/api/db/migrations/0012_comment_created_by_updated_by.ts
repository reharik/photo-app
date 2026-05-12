import type { Knex } from 'knex';

const TABLE = 'comment';
const USER_TABLE = 'user';

const resolveAuthorColumn = async (knex: Knex): Promise<'author_id' | 'author_user_id' | null> => {
  if (await knex.schema.hasColumn(TABLE, 'author_id')) {
    return 'author_id';
  }
  if (await knex.schema.hasColumn(TABLE, 'author_user_id')) {
    return 'author_user_id';
  }
  return null;
};

/**
 * Aligns `comment` with audit columns used elsewhere (`created_by`, `updated_by`).
 * Rows with a null author keep null audit IDs (nullable author is intentional in `0009_comment`).
 */
export const up = async (knex: Knex): Promise<void> => {
  if (!(await knex.schema.hasTable(TABLE))) {
    return;
  }

  const hasCreatedBy = await knex.schema.hasColumn(TABLE, 'created_by');
  const hasUpdatedBy = await knex.schema.hasColumn(TABLE, 'updated_by');
  if (hasCreatedBy && hasUpdatedBy) {
    return;
  }

  const authorColumn = await resolveAuthorColumn(knex);

  await knex.schema.alterTable(TABLE, (table) => {
    if (!hasCreatedBy) {
      table
        .uuid('created_by')
        .nullable()
        .references('id')
        .inTable(USER_TABLE)
        .onDelete('SET NULL');
    }
    if (!hasUpdatedBy) {
      table
        .uuid('updated_by')
        .nullable()
        .references('id')
        .inTable(USER_TABLE)
        .onDelete('SET NULL');
    }
  });

  if (authorColumn !== null && (!hasCreatedBy || !hasUpdatedBy)) {
    await knex.raw(
      `
      UPDATE "${TABLE}"
      SET created_by = ${authorColumn},
          updated_by = ${authorColumn}
      WHERE ${authorColumn} IS NOT NULL
      `,
    );
  }
};

export const down = async (knex: Knex): Promise<void> => {
  if (!(await knex.schema.hasTable(TABLE))) {
    return;
  }

  const hasCreatedBy = await knex.schema.hasColumn(TABLE, 'created_by');
  const hasUpdatedBy = await knex.schema.hasColumn(TABLE, 'updated_by');
  if (!hasCreatedBy && !hasUpdatedBy) {
    return;
  }

  if (hasCreatedBy) {
    await knex.schema.alterTable(TABLE, (table) => {
      table.dropForeign(['created_by']);
    });
    await knex.schema.alterTable(TABLE, (table) => {
      table.dropColumn('created_by');
    });
  }

  if (hasUpdatedBy) {
    await knex.schema.alterTable(TABLE, (table) => {
      table.dropForeign(['updated_by']);
    });
    await knex.schema.alterTable(TABLE, (table) => {
      table.dropColumn('updated_by');
    });
  }
};
