import { Knex } from 'knex';

export const withAlbumItemCount =
  (db: Knex) =>
  (qb: Knex.QueryBuilder): void => {
    qb.select(
      db('album_item')
        .count('* as item_count')
        .whereRaw('album_item.album_id = album.id') // correlate to the outer album row
        .as('itemCount'),
    );
  };
