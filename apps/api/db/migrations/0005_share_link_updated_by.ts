import type { Knex } from 'knex';

const SHARE_LINK_TABLE = 'share_link';
const USER_TABLE = 'user';
const UPDATED_BY_COLUMN = 'updated_by';

export const up = async (knex: Knex): Promise<void> => {
  const hasUpdatedBy = await knex.schema.hasColumn(SHARE_LINK_TABLE, UPDATED_BY_COLUMN);
  if (hasUpdatedBy) {
    return;
  }

  await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
    table
      .uuid(UPDATED_BY_COLUMN)
      .nullable()
      .references('id')
      .inTable(USER_TABLE)
      .onDelete('CASCADE');
  });

  await knex(SHARE_LINK_TABLE).update({
    [UPDATED_BY_COLUMN]: knex.raw('created_by'),
  });

  await knex.raw(`ALTER TABLE ?? ALTER COLUMN ?? SET NOT NULL`, [
    SHARE_LINK_TABLE,
    UPDATED_BY_COLUMN,
  ]);
};

export const down = async (knex: Knex): Promise<void> => {
  const hasUpdatedBy = await knex.schema.hasColumn(SHARE_LINK_TABLE, UPDATED_BY_COLUMN);
  if (!hasUpdatedBy) {
    return;
  }

  await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
    table.dropForeign([UPDATED_BY_COLUMN]);
  });
  await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
    table.dropColumn(UPDATED_BY_COLUMN);
  });
};
