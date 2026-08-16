import { Knex } from 'knex';
import { withActiveGrants } from './withLiveAuthorizationFilter';

const activeAlbumGrantExists = (db: Knex, viewerId: string) =>
  db
    .select(db.raw('1'))
    .from('accessGrant as ag2')
    .whereNotNull('ag2.albumId')
    .where('ag2.albumId', db.ref('album.id'))
    .modify(withActiveGrants(db, viewerId, 'ag2'));

export const withViewableByMemberOrAlbumGrant =
  (db: Knex, viewerId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.where((w) => {
      w.where('albumMember.userId', viewerId).orWhereExists(activeAlbumGrantExists(db, viewerId));
    });
  };

/**
 * Gates album items on the MATERIALIZED `grant` table, which reconciliation fans out
 * one row per (accessGrant × mediaItem) for an album-scoped grant. There is no
 * item-scoped access_grant any more — loose items are wrapped in a shadow album.
 */
export const withAlbumItemViewableByMemberOrGrant =
  (db: Knex, viewerId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.where((w) => {
      w.where('albumMember.userId', viewerId).orWhereExists(
        db
          .select(db.raw('1'))
          .from('grant')
          .where('grant.mediaItemId', '=', db.ref('albumItem.mediaItemId'))
          .where('grant.grantedToUser', viewerId),
      );
    });
  };
