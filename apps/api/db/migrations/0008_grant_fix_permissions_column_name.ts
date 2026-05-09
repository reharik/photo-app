import type { Knex } from 'knex';

const GRANT_TABLE = 'grant';
const MISSPELLED_COLUMN = 'permissins';
const CORRECT_COLUMN = 'permissions';

export const up = async (knex: Knex): Promise<void> => {
  const hasMisspelledColumn = await knex.schema.hasColumn(GRANT_TABLE, MISSPELLED_COLUMN);
  const hasCorrectColumn = await knex.schema.hasColumn(GRANT_TABLE, CORRECT_COLUMN);

  if (hasCorrectColumn || !hasMisspelledColumn) {
    return;
  }

  await knex.schema.alterTable(GRANT_TABLE, (table) => {
    table.renameColumn(MISSPELLED_COLUMN, CORRECT_COLUMN);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  const hasMisspelledColumn = await knex.schema.hasColumn(GRANT_TABLE, MISSPELLED_COLUMN);
  const hasCorrectColumn = await knex.schema.hasColumn(GRANT_TABLE, CORRECT_COLUMN);

  if (hasMisspelledColumn || !hasCorrectColumn) {
    return;
  }

  await knex.schema.alterTable(GRANT_TABLE, (table) => {
    table.renameColumn(CORRECT_COLUMN, MISSPELLED_COLUMN);
  });
};
