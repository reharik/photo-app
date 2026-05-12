import type { Knex } from 'knex';

const TABLE = 'comment';
const COLUMN = 'is_edited';

export const up = async (knex: Knex): Promise<void> => {
  const hasColumn = await knex.schema.hasColumn(TABLE, COLUMN);
  if (hasColumn) {
    return;
  }

  await knex.schema.alterTable(TABLE, (table) => {
    table.boolean(COLUMN).notNullable().defaultTo(false);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  const hasColumn = await knex.schema.hasColumn(TABLE, COLUMN);
  if (!hasColumn) {
    return;
  }

  await knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn(COLUMN);
  });
};
