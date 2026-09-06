import { Knex } from 'knex';

export const withAttachViewerMembership =
  (db: Knex, viewerId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.leftJoin('albumMember', (join) => {
      join.on('albumMember.albumId', 'album.id').on('albumMember.userId', db.raw('?', [viewerId]));
    });
  };
