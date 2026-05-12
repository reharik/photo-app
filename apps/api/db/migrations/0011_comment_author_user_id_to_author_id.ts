import type { Knex } from 'knex';

const TABLE = 'comment';
const OLD_COLUMN = 'author_user_id';
const NEW_COLUMN = 'author_id';

export const up = async (knex: Knex): Promise<void> => {
  const hasNew = await knex.schema.hasColumn(TABLE, NEW_COLUMN);
  const hasOld = await knex.schema.hasColumn(TABLE, OLD_COLUMN);

  if (hasNew || !hasOld) {
    return;
  }

  await knex.schema.alterTable(TABLE, (table) => {
    table.renameColumn(OLD_COLUMN, NEW_COLUMN);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  const hasNew = await knex.schema.hasColumn(TABLE, NEW_COLUMN);
  const hasOld = await knex.schema.hasColumn(TABLE, OLD_COLUMN);

  if (hasOld || !hasNew) {
    return;
  }

  await knex.schema.alterTable(TABLE, (table) => {
    table.renameColumn(NEW_COLUMN, OLD_COLUMN);
  });
};
