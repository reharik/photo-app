import type { Knex } from 'knex';

const SHARE_LINK_TABLE = 'share_link';
const USER_TABLE = 'user';
const GRANTED_BY_COLUMN = 'granted_by';

export const up = async (knex: Knex): Promise<void> => {
  const hasGrantedBy = await knex.schema.hasColumn(SHARE_LINK_TABLE, GRANTED_BY_COLUMN);
  if (hasGrantedBy) {
    return;
  }

  await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
    table
      .uuid(GRANTED_BY_COLUMN)
      .nullable()
      .references('id')
      .inTable(USER_TABLE)
      .onDelete('CASCADE');
    table.index([GRANTED_BY_COLUMN]);
  });

  await knex(SHARE_LINK_TABLE).update({
    [GRANTED_BY_COLUMN]: knex.raw('created_by'),
  });

  await knex.raw(`ALTER TABLE ?? ALTER COLUMN ?? SET NOT NULL`, [
    SHARE_LINK_TABLE,
    GRANTED_BY_COLUMN,
  ]);
};

export const down = async (knex: Knex): Promise<void> => {
  const hasGrantedBy = await knex.schema.hasColumn(SHARE_LINK_TABLE, GRANTED_BY_COLUMN);
  if (!hasGrantedBy) {
    return;
  }

  await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
    table.dropForeign([GRANTED_BY_COLUMN]);
  });
  await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
    table.dropIndex([GRANTED_BY_COLUMN]);
    table.dropColumn(GRANTED_BY_COLUMN);
  });
};
