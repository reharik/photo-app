import { Knex } from 'knex';

export const withViewerMembership =
  (db: Knex, viewerId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.leftJoin('albumMember', (join) => {
      join.on('albumMember.albumId', 'album.id').on('albumMember.userId', db.raw('?', [viewerId]));
    });
  };
