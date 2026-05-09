import type { Knex } from 'knex';

const SHARE_LINK_TABLE = 'share_link';
const ACCESS_GRANT_TABLE = 'access_grant';
const ALBUM_TABLE = 'album';

const ALBUM_ID_COLUMN = 'album_id';
const SHARE_LINK_ID_COLUMN = 'share_link_id';

/**
 * - `share_link.album_id`: which album this public share applies to (nullable for legacy rows).
 * - `access_grant.share_link_id`: optional link to a public share link; already created in
 *   `0001_init_schema` for fresh databases — duplicated here with a guard for older/partial DBs.
 */
export const up = async (knex: Knex): Promise<void> => {
  const hasAlbumOnShareLink = await knex.schema.hasColumn(SHARE_LINK_TABLE, ALBUM_ID_COLUMN);
  if (!hasAlbumOnShareLink) {
    await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
      table
        .uuid(ALBUM_ID_COLUMN)
        .nullable()
        .references('id')
        .inTable(ALBUM_TABLE)
        .onDelete('CASCADE');
      table.index([ALBUM_ID_COLUMN]);
    });
  }

  const hasShareLinkOnAccessGrant = await knex.schema.hasColumn(
    ACCESS_GRANT_TABLE,
    SHARE_LINK_ID_COLUMN,
  );
  if (!hasShareLinkOnAccessGrant) {
    await knex.schema.alterTable(ACCESS_GRANT_TABLE, (table) => {
      table
        .uuid(SHARE_LINK_ID_COLUMN)
        .nullable()
        .references('id')
        .inTable(SHARE_LINK_TABLE)
        .onDelete('SET NULL');
    });
  }
};

export const down = async (knex: Knex): Promise<void> => {
  const hasAlbumOnShareLink = await knex.schema.hasColumn(SHARE_LINK_TABLE, ALBUM_ID_COLUMN);
  if (hasAlbumOnShareLink) {
    await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
      table.dropForeign([ALBUM_ID_COLUMN]);
    });
    await knex.schema.alterTable(SHARE_LINK_TABLE, (table) => {
      table.dropColumn(ALBUM_ID_COLUMN);
    });
  }

  // Do not drop `access_grant.share_link_id` here: it is created by `0001_init_schema` on
  // normal installs; only skip dropping to avoid breaking rollback order with the initial schema.
};
