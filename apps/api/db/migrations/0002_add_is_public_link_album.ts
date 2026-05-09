import type { Knex } from 'knex';

const ALBUM_TABLE = 'album';
const PUBLIC_LINK_COLUMN = 'is_public_link_album';
const HIDDEN_COLUMN = 'hidden';

export const up = async (knex: Knex): Promise<void> => {
  const hasIsPublicLinkAlbum = await knex.schema.hasColumn(ALBUM_TABLE, PUBLIC_LINK_COLUMN);
  if (hasIsPublicLinkAlbum) {
    return;
  }

  const hasHidden = await knex.schema.hasColumn(ALBUM_TABLE, HIDDEN_COLUMN);
  if (hasHidden) {
    await knex.schema.alterTable(ALBUM_TABLE, (table) => {
      table.renameColumn(HIDDEN_COLUMN, PUBLIC_LINK_COLUMN);
    });
  } else {
    await knex.schema.alterTable(ALBUM_TABLE, (table) => {
      table.boolean(PUBLIC_LINK_COLUMN).notNullable().defaultTo(false);
    });
  }
};

export const down = async (knex: Knex): Promise<void> => {
  const hasIsPublicLinkAlbum = await knex.schema.hasColumn(ALBUM_TABLE, PUBLIC_LINK_COLUMN);
  if (!hasIsPublicLinkAlbum) {
    return;
  }

  await knex.schema.alterTable(ALBUM_TABLE, (table) => {
    table.dropColumn(PUBLIC_LINK_COLUMN);
  });
};
