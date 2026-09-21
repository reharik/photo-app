import { Knex } from 'knex';

export const withAlbumItemCount =
  (db: Knex) =>
  (qb: Knex.QueryBuilder): void => {
    qb.select(
      db('album_item')
        // count(*) is bigint. Both apps now register an OID-20 (int8 -> number) type
        // parser, but before that node-postgres returned bigint as a STRING and the
        // worker's email path rendered "36" + 0 as "360 photos". The ::int cast is kept
        // so itemCount stays a number even on a connection that skips the parser.
        .select(db.raw('count(*)::int'))
        .whereRaw('album_item.album_id = album.id') // correlate to the outer album row
        .as('itemCount'),
    );
  };
