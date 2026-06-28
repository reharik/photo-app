import { Knex } from 'knex';
import { activeGrantChecks } from './withActiveGrants';

const activeAlbumGrantExists = (db: Knex, viewerId: string) => {
  const sub = db.select(db.raw('1')).from('accessGrant as ag2');
  activeGrantChecks(sub, db, viewerId, 'ag2');
  return sub
    .whereNotNull('ag2.albumId')
    .whereNull('ag2.mediaItemId')
    .where('ag2.albumId', db.ref('album.id'));
};

export const withViewableByMemberOrAlbumGrant =
  (db: Knex, viewerId: string) =>
  (qb: Knex.QueryBuilder): void => {
    qb.where((w) => {
      w.where('albumMember.userId', viewerId).orWhereExists(activeAlbumGrantExists(db, viewerId));
    });
  };

export const withAlbumItemViewableByMemberOrItemGrant =
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
