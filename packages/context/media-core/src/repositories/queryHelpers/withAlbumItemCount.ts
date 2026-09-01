import { Knex } from 'knex';

export const withAlbumItemCount =
  (db: Knex) =>
  (qb: Knex.QueryBuilder): void => {
    qb.select(
      db('album_item')
        // count(*) is bigint, and node-postgres hands bigint back as a STRING (no
        // OID-20 type parser is registered). Consumers that go through the GraphQL
        // Int scalar get silently coerced, but the worker's email path does not —
        // "36" + 0 rendered "360 photos". Cast in SQL so itemCount is always a number.
        .select(db.raw('count(*)::int'))
        .whereRaw('album_item.album_id = album.id') // correlate to the outer album row
        .as('itemCount'),
    );
  };
