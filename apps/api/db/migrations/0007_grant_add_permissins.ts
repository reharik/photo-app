import type { Knex } from 'knex';

const GRANT_TABLE = 'grant';
const PERMISSINS_COLUMN = 'permissins';

export const up = async (knex: Knex): Promise<void> => {
  const hasPermissins = await knex.schema.hasColumn(GRANT_TABLE, PERMISSINS_COLUMN);
  if (hasPermissins) {
    return;
  }

  await knex.schema.alterTable(GRANT_TABLE, (table) => {
    table.string(PERMISSINS_COLUMN).nullable();
  });
};

export const down = async (knex: Knex): Promise<void> => {
  const hasPermissins = await knex.schema.hasColumn(GRANT_TABLE, PERMISSINS_COLUMN);
  if (!hasPermissins) {
    return;
  }

  await knex.schema.alterTable(GRANT_TABLE, (table) => {
    table.dropColumn(PERMISSINS_COLUMN);
  });
};
